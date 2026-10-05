import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Input, Textarea } from "./Input";
import type { Card, CardDraft, Member } from "../lib/types";

const emptyDraft: CardDraft = { title: "", description: "", assigneeId: null, dueDate: null };

interface NewCardModalProps {
  open: boolean;
  card: Card | null;
  members: Member[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (draft: CardDraft) => void;
}

export default function NewCardModal({ open, card, members, isSaving, onClose, onSubmit }: NewCardModalProps) {
  const [draft, setDraft] = useState<CardDraft>(() =>
    card
      ? {
          title: card.title,
          description: card.description ?? "",
          assigneeId: card.assignee?.id ?? null,
          dueDate: card.dueDate ? card.dueDate.slice(0, 10) : null,
        }
      : emptyDraft,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
      assigneeId: draft.assigneeId,
    });
  };

  return (
    <Modal
      open={open}
      title={card ? "Edit card" : "New card"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="card-form" isLoading={isSaving}>
            {card ? "Save changes" : "Create card"}
          </Button>
        </>
      }
    >
      <form id="card-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Title"
          value={draft.title}
          error={error ?? undefined}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Ship the login screen"
          autoFocus
        />
        <Textarea
          label="Description"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Optional details"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Assignee
            <select
              value={draft.assigneeId ?? ""}
              onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value || null })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Due date"
            type="date"
            value={draft.dueDate ?? ""}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
