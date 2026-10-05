import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { queryKeys } from "./queryKeys";
import type {
  Activity,
  Board,
  BoardDetail,
  CreateBoardInput,
  CreateCardInput,
  CreateTeamInput,
  InviteMemberInput,
  InviteRole,
  Member,
  Team,
  UpdateCardInput,
  UpdateColumnInput,
} from "./types";

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: async () => (await api.get<Team[]>("/teams")).data,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeamInput) => (await api.post<Team>("/teams", input)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.teams }),
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: queryKeys.teamMembers(teamId ?? ""),
    queryFn: async () => (await api.get<Member[]>(`/teams/${teamId}/members`)).data,
    enabled: teamId !== null,
  });
}

export function useInviteMember(teamId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteMemberInput) =>
      (await api.post<Member>(`/teams/${teamId}/members`, { email: input.email, role: input.role as InviteRole })).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.teamMembers(teamId ?? "") }),
  });
}

export function useBoards(teamId: string | null) {
  return useQuery({
    queryKey: queryKeys.boards(teamId ?? ""),
    queryFn: async () => (await api.get<Board[]>("/boards", { params: { teamId } })).data,
    enabled: teamId !== null,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBoardInput) => (await api.post<Board>("/boards", input)).data,
    onSuccess: (board) => void qc.invalidateQueries({ queryKey: queryKeys.boards(board.teamId) }),
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: async () => (await api.get<BoardDetail>(`/boards/${boardId}`)).data,
  });
}

export function useActivity(boardId: string) {
  return useQuery({
    queryKey: queryKeys.activity(boardId),
    queryFn: async () => (await api.get<Activity[]>(`/boards/${boardId}/activity`)).data,
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ columnId, input }: { columnId: string; input: CreateCardInput }) =>
      (await api.post(`/columns/${columnId}/cards`, {
        title: input.title,
        description: input.description ?? "",
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
      })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      void qc.invalidateQueries({ queryKey: queryKeys.activity(boardId) });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, input }: { cardId: string; input: UpdateCardInput }) =>
      (await api.patch(`/cards/${cardId}`, input)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => (await api.delete(`/cards/${cardId}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      void qc.invalidateQueries({ queryKey: queryKeys.activity(boardId) });
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ columnId, input }: { columnId: string; input: UpdateColumnInput }) =>
      (await api.patch(`/columns/${columnId}`, input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      void qc.invalidateQueries({ queryKey: queryKeys.activity(boardId) });
    },
  });
}
