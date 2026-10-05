import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Shield, Users } from "lucide-react";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import NewBoardModal from "../components/NewBoardModal";
import NewTeamModal from "../components/NewTeamModal";
import InviteMemberModal from "../components/InviteMemberModal";
import Spinner from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import { useBoards, useCreateBoard, useCreateTeam, useInviteMember, useTeamMembers, useTeams } from "../lib/queries";
import { errorMessage } from "../lib/api";
import type { Team } from "../lib/types";

const canInvite = (team: Team) => team.role === "OWNER" || team.role === "ADMIN";

const roleBadge: Record<Team["role"], string> = {
  OWNER: "bg-indigo-50 text-indigo-700",
  ADMIN: "bg-sky-50 text-sky-700",
  MEMBER: "bg-slate-100 text-slate-600",
};

export default function DashboardPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const teamsQuery = useTeams();
  const createTeam = useCreateTeam();
  const createBoard = useCreateBoard();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isBoardModalOpen, setBoardModalOpen] = useState(false);
  const [isInviteOpen, setInviteOpen] = useState(false);

  const boardsQuery = useBoards(selectedTeam?.id ?? null);
  const membersQuery = useTeamMembers(isInviteOpen ? (selectedTeam?.id ?? null) : null);
  const inviteMember = useInviteMember(selectedTeam?.id ?? null);

  const handleCreateTeam = (name: string) => {
    createTeam.mutate({ name }, {
      onSuccess: (team) => {
        setTeamModalOpen(false);
        setSelectedTeam(team);
        toast.success(`Team "${team.name}" created`);
      },
      onError: (error) => toast.error(errorMessage(error, "Could not create the team")),
    });
  };

  const handleCreateBoard = (name: string) => {
    if (!selectedTeam) return;
    createBoard.mutate(
      { teamId: selectedTeam.id, name },
      {
        onSuccess: (board) => {
          setBoardModalOpen(false);
          toast.success(`Board "${board.name}" created`);
          navigate(`/boards/${board.id}`);
        },
        onError: (error) => toast.error(errorMessage(error, "Could not create the board")),
      },
    );
  };

  const handleInvite = (email: string, role: "ADMIN" | "MEMBER") => {
    inviteMember.mutate(
      { email, role },
      {
        onSuccess: (member) => {
          toast.success(`${member.email} added to the team`);
        },
        onError: (error) => toast.error(errorMessage(error, "Could not add that member")),
      },
    );
  };

  const teams = teamsQuery.data ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Your teams and their boards.</p>
        </div>
        <Button onClick={() => setTeamModalOpen(true)}>
          <Plus size={16} /> New team
        </Button>
      </header>

      {teamsQuery.isLoading ? <Spinner label="Loading your teams" /> : null}

      {teamsQuery.isError ? (
        <EmptyState
          title="Could not load teams"
          description={errorMessage(teamsQuery.error)}
          action={<Button onClick={() => void teamsQuery.refetch()}>Retry</Button>}
        />
      ) : null}

      {!teamsQuery.isLoading && teams.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={30} />}
          title="No teams yet"
          description="Create a team to invite teammates and start a board."
          action={<Button onClick={() => setTeamModalOpen(true)}>Create your first team</Button>}
        />
      ) : null}

      {teams.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const active = selectedTeam?.id === team.id;
            return (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(active ? null : team)}
                  className={`flex w-full flex-col gap-2 rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ${
                    active ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-slate-800">{team.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[team.role]}`}>
                      {team.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{active ? "Hide boards" : "Show boards"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selectedTeam ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{selectedTeam.name} boards</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
                <Users size={16} /> Members
              </Button>
              <Button size="sm" onClick={() => setBoardModalOpen(true)}>
                <Plus size={16} /> New board
              </Button>
            </div>
          </div>

          {!canInvite(selectedTeam) ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Shield size={14} /> Only owners and admins can invite members.
            </p>
          ) : null}

          {boardsQuery.isLoading ? <Spinner label="Loading boards" /> : null}

          {boardsQuery.isError ? (
            <EmptyState title="Could not load boards" description={errorMessage(boardsQuery.error)} />
          ) : null}

          {boardsQuery.data && boardsQuery.data.length === 0 ? (
            <EmptyState
              icon={<FolderKanban size={28} />}
              title="No boards yet"
              description="Boards start with four default columns."
              action={
                <Button size="sm" onClick={() => setBoardModalOpen(true)}>
                  Create a board
                </Button>
              }
            />
          ) : null}

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(boardsQuery.data ?? []).map((board) => (
              <li key={board.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="flex w-full flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-indigo-300"
                >
                  <span className="font-semibold text-slate-800">{board.name}</span>
                  <span className="text-xs text-slate-500">
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <NewTeamModal
        open={isTeamModalOpen}
        isSaving={createTeam.isPending}
        onClose={() => setTeamModalOpen(false)}
        onSubmit={handleCreateTeam}
      />

      <NewBoardModal
        open={isBoardModalOpen}
        teamId={selectedTeam?.id ?? null}
        isSaving={createBoard.isPending}
        onClose={() => setBoardModalOpen(false)}
        onSubmit={handleCreateBoard}
      />

      {selectedTeam && canInvite(selectedTeam) ? (
        <InviteMemberModal
          open={isInviteOpen}
          members={membersQuery.data ?? []}
          isSaving={inviteMember.isPending}
          onClose={() => setInviteOpen(false)}
          onSubmit={handleInvite}
        />
      ) : null}
    </div>
  );
}
