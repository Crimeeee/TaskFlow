import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Input } from "./Input";
import type { InviteRole, Member } from "../lib/types";

interface InviteMemberModalProps {
  open: boolean;
  members: Member[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: InviteRole) => void;
}

export default function InviteMemberModal({ open, members, isSaving, onClose, onSubmit }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    onSubmit(email.trim(), role);
  };

  return (
    <Modal
      open={open}
      title="Invite a member"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="invite-form" isLoading={isSaving}>
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Email"
          type="email"
          value={email}
          error={error ?? undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="teammate@example.com"
          autoFocus
        />
        <label className="flex flex-col gap-1 text-sm font-medium text-body">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            className="rounded-lg border border-line-strong bg-raised px-3 py-2 text-sm font-normal focus:border-accent focus:outline-none"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        {members.length > 0 ? (
          <ul className="divide-y divide-slate-100 rounded-lg border border-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="truncate text-body">
                  {m.name} <span className="text-muted">· {m.email}</span>
                </span>
                <span className="ml-2 shrink-0 text-xs font-medium text-muted">{m.role}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </Modal>
  );
}
