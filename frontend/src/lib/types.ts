export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";
export type InviteRole = "ADMIN" | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Team {
  id: string;
  name: string;
  role: TeamRole;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  assignee: User | null;
  dueDate: string | null;
  createdAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  teamId: string;
  name: string;
  createdAt: string;
}

export interface BoardDetail extends Board {
  columns: Column[];
  team: Team;
}

export interface Activity {
  id: string;
  boardId: string;
  message: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateTeamInput {
  name: string;
}

export interface CreateBoardInput {
  teamId: string;
  name: string;
}

export interface InviteMemberInput {
  email: string;
  role: InviteRole;
}

export interface CreateCardInput {
  title: string;
  description?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  position?: number;
  assigneeId?: string | null;
  dueDate?: string | null;
  columnId?: string;
}

export interface UpdateColumnInput {
  name?: string;
  position?: number;
}

/** Error envelope returned by the API. */
export interface ApiErrorBody {
  error: { message: string };
}

export interface CardDraft {
  title: string;
  description: string;
  assigneeId: string | null;
  dueDate: string | null;
}
