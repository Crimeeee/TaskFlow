import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Pencil, Plus } from "lucide-react";
import CardItem from "./CardItem";
import type { Card } from "../lib/types";

interface ColumnViewProps {
  id: string;
  name: string;
  position: number;
  cards: Card[];
  isSaving: boolean;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (card: Card) => void;
  onRename: (columnId: string, name: string) => void;
}

export default function ColumnView({
  id,
  name,
  position,
  cards,
  isSaving,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onRename,
}: ColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column", columnId: id } });
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const commit = () => {
    const next = draftName.trim();
    setEditing(false);
    setDraftName(name);
    if (next && next !== name) onRename(id, next);
  };

  return (
    <section
      ref={setNodeRef}
      style={{ order: position }}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-line bg-sunken p-3 transition-shadow ${
        isOver ? "border-accent ring-2 ring-accent/25" : ""
      }`}
    >
      <header className="mb-3 flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraftName(name);
                setEditing(false);
              }
            }}
            className="flex-1 rounded border border-line-strong px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        ) : (
          <>
            <h3 className="font-mono flex-1 truncate text-xs font-semibold uppercase tracking-wider text-muted">
              {name}
            </h3>
            <span className="rounded-full bg-raised px-2 py-0.5 font-mono text-xs text-muted">{cards.length}</span>
            <button
              type="button"
              onClick={() => {
                setDraftName(name);
                setEditing(true);
              }}
              aria-label={`Rename ${name}`}
              disabled={isSaving}
              className="rounded p-1 text-muted hover:bg-raised hover:text-body"
            >
              <Pencil size={13} />
            </button>
          </>
        )}
      </header>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-12 flex-1 flex-col gap-2">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
          ))}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={() => onAddCard(id)}
        className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-raised hover:text-strong"
      >
        <Plus size={14} /> Add card
      </button>
    </section>
  );
}
