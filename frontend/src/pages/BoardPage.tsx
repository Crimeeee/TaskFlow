import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { ArrowLeft, History } from "lucide-react";
import ActivityFeed from "../components/ActivityFeed";
import Button from "../components/Button";
import CardItem from "../components/CardItem";
import ColumnView from "../components/ColumnView";
import EmptyState from "../components/EmptyState";
import NewCardModal from "../components/NewCardModal";
import { BoardSkeleton } from "../components/Skeleton";
import { useToast } from "../hooks/useToast";
import { errorMessage } from "../lib/api";
import { applyMove, findCard, positionFor, sortByPosition } from "../lib/board";
import { queryKeys } from "../lib/queryKeys";
import {
  useActivity,
  useBoard,
  useCreateCard,
  useDeleteCard,
  useTeamMembers,
  useUpdateCard,
  useUpdateColumn,
} from "../lib/queries";
import type { BoardDetail, Card, CardDraft } from "../lib/types";

export default function BoardPage() {
  const { boardId = "" } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const boardQuery = useBoard(boardId);
  const activityQuery = useActivity(boardId);
  const createCard = useCreateCard(boardId);
  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const updateColumn = useUpdateColumn(boardId);

  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const board = boardQuery.data;
  const membersQuery = useTeamMembers(board?.team.id ?? null);

  const columns = useMemo(() => (board ? [...board.columns].sort((a, b) => a.position - b.position) : []), [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCard(findCard(columns, String(event.active.id))?.card ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);
    const found = findCard(columns, cardId);
    if (!found) return;

    const targetColumnId = columns.some((c) => c.id === overId) ? overId : findCard(columns, overId)?.column.id;
    if (!targetColumnId) return;

    const target = columns.find((c) => c.id === targetColumnId);
    if (!target) return;

    const remaining = sortByPosition(target.cards).filter((c) => c.id !== cardId);
    const overIndex = remaining.findIndex((c) => c.id === overId);
    const index = overIndex >= 0 ? overIndex : remaining.length;
    const position = positionFor(remaining, index);

    if (found.column.id === targetColumnId && found.card.position === position) return;

    const previous = queryClient.getQueryData<BoardDetail>(queryKeys.board(boardId));
    queryClient.setQueryData<BoardDetail>(queryKeys.board(boardId), (current) =>
      current ? { ...current, columns: applyMove(current.columns, cardId, targetColumnId, index) ?? current.columns } : current,
    );

    updateCard.mutate(
      { cardId, input: { columnId: targetColumnId, position } },
      {
        onError: (error) => {
          if (previous) queryClient.setQueryData(queryKeys.board(boardId), previous);
          toast.error(errorMessage(error, "Could not move the card"));
        },
        onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
      },
    );
  };

  const submitCard = (draft: CardDraft) => {
    if (editingCard) {
      updateCard.mutate(
        { cardId: editingCard.id, input: draft },
        {
          onSuccess: () => {
            setEditingCard(null);
            toast.success("Card updated");
          },
          onError: (error) => toast.error(errorMessage(error, "Could not update the card")),
        },
      );
      return;
    }
    if (!newCardColumnId) return;
    createCard.mutate(
      { columnId: newCardColumnId, input: draft },
      {
        onSuccess: () => {
          setNewCardColumnId(null);
          toast.success("Card created");
        },
        onError: (error) => toast.error(errorMessage(error, "Could not create the card")),
      },
    );
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="mb-1 inline-flex items-center gap-1 text-sm text-muted hover:text-strong">
            <ArrowLeft size={14} /> All teams
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-strong">{board?.name ?? "Board"}</h1>
          <p className="text-sm text-muted">
            {board ? `${board.team.name} - your role: ${board.team.role}` : "Loading board"}
          </p>
        </div>
      </header>

      {boardQuery.isLoading ? <BoardSkeleton /> : null}

      {boardQuery.isError ? (
        <EmptyState
          title="Could not load this board"
          description={errorMessage(boardQuery.error)}
          action={<Button onClick={() => void boardQuery.refetch()}>Retry</Button>}
        />
      ) : null}

      {board && columns.length === 0 ? (
        <EmptyState title="This board has no columns" description="Ask an admin to set up the workflow." />
      ) : null}

      {board ? (
        <div className="flex flex-col gap-5 xl:flex-row">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveCard(null)}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column) => (
                <ColumnView
                  key={column.id}
                  id={column.id}
                  name={column.name}
                  position={column.position}
                  cards={sortByPosition(column.cards)}
                  isSaving={updateColumn.isPending}
                  onAddCard={(columnId) => {
                    setEditingCard(null);
                    setNewCardColumnId(columnId);
                  }}
                  onEditCard={(card) => {
                    setNewCardColumnId(null);
                    setEditingCard(card);
                  }}
                  onDeleteCard={(card) =>
                    deleteCard.mutate(card.id, {
                      onSuccess: () => toast.success(`"${card.title}" deleted`),
                      onError: (error) => toast.error(errorMessage(error, "Could not delete the card")),
                    })
                  }
                  onRename={(columnId, name) =>
                    updateColumn.mutate(
                      { columnId, input: { name } },
                      {
                        onSuccess: () => toast.success("Column renamed"),
                        onError: (error) => toast.error(errorMessage(error, "Could not rename the column")),
                      },
                    )
                  }
                />
              ))}
            </div>
            <DragOverlay>
              {activeCard ? <CardItem card={activeCard} onEdit={() => {}} onDelete={() => {}} disabled /> : null}
            </DragOverlay>
          </DndContext>

          <aside className="w-full shrink-0 rounded-xl border border-line bg-raised p-4 xl:w-80">
            <h2 className="eyebrow mb-3 flex items-center gap-2">
              <History size={16} /> Activity
            </h2>
            <div className="max-h-96 overflow-y-auto">
              <ActivityFeed activities={activityQuery.data ?? []} isLoading={activityQuery.isLoading} />
            </div>
          </aside>
        </div>
      ) : null}

      {newCardColumnId !== null || editingCard !== null ? (
        <NewCardModal
          open
          card={editingCard}
          members={membersQuery.data ?? []}
          isSaving={createCard.isPending || updateCard.isPending}
          onClose={() => {
            setNewCardColumnId(null);
            setEditingCard(null);
          }}
          onSubmit={submitCard}
        />
      ) : null}
    </div>
  );
}
