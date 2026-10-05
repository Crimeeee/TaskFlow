import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, GripVertical, Pencil, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import type { Card } from "../lib/types";

interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
  disabled?: boolean;
}

const isOverdue = (card: Card) => Boolean(card.dueDate) && new Date(card.dueDate as string) < new Date();

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function CardItem({ card, onEdit, onDelete, disabled = false }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled,
    data: { card },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${
        isDragging ? "z-10 rotate-1 opacity-80 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Move ${card.title}`}
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">{card.title}</p>
          {card.description ? (
            <p className="mt-1 line-clamp-3 text-xs text-slate-500">{card.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 pl-6">
        {card.dueDate ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
              isOverdue(card) ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
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
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card)}
          aria-label={`Delete ${card.title}`}
          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
