import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Input } from "./Input";

interface NewTeamModalProps {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function NewTeamModal({ open, isSaving, onClose, onSubmit }: NewTeamModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <Modal
      open={open}
      title="New team"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="team-form" isLoading={isSaving}>
            Create team
          </Button>
        </>
      }
    >
      <form id="team-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Team name"
          value={name}
          error={error ?? undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Platform team"
          autoFocus
        />
        <p className="text-xs text-muted">You become the owner of this team.</p>
      </form>
    </Modal>
  );
}
