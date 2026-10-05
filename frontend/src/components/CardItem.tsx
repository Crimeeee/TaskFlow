import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, GripVertical, Pencil, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import type { Card } from "../lib/types";
import { toneForColumn } from "../lib/board";

interface CardItemProps {
  card: Card;
  columnName?: string;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
  disabled?: boolean;
}

const isOverdue = (card: Card) => Boolean(card.dueDate) && new Date(card.dueDate as string) < new Date();

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function CardItem({ card, columnName = "", onEdit, onDelete, disabled = false }: CardItemProps) {
  const tone = toneForColumn(columnName);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled,
    data: { card },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-xl border border-line bg-raised pl-4 pr-3 py-3 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/5 ${
        isDragging ? "drag-ghost z-10" : ""
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${tone.bar} opacity-70`} />

      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Move ${card.title}`}
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted hover:text-muted active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-strong">{card.title}</p>
          {card.description ? (
            <p className="mt-1 line-clamp-3 text-xs text-muted">{card.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 pl-6">
        {card.dueDate ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
              isOverdue(card)
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-sunken text-body"
            }`}
          >
            <CalendarClock size={12} /> {formatDate(card.dueDate)}
          </span>
        ) : null}
        <span className="flex-1" />
        {card.assignee ? <Avatar name={card.assignee.name} size={22} /> : null}
        <button
          type="button"
          onClick={() => onEdit(card)}
          aria-label={`Edit ${card.title}`}
          className="rounded p-1 text-muted hover:bg-sunken hover:text-body"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card)}
          aria-label={`Delete ${card.title}`}
          className="rounded p-1 text-muted hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
