import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Input } from "./Input";

interface NewBoardModalProps {
  open: boolean;
  teamId: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function NewBoardModal({ open, teamId, isSaving, onClose, onSubmit }: NewBoardModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Board name is required");
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <Modal
      open={open}
      title="New board"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="board-form" isLoading={isSaving} disabled={teamId === null}>
            Create board
          </Button>
        </>
      }
    >
      <form id="board-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Board name"
          value={name}
          error={error ?? undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Sprint 12"
          autoFocus
        />
        <p className="text-xs text-slate-500">A board starts with four default columns.</p>
      </form>
    </Modal>
  );
}
