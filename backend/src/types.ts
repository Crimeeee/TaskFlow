export type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export type PublicUser = { id: string; name: string; email: string };

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: Role;
}
