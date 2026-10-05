export const queryKeys = {
  me: ["me"] as const,
  teams: ["teams"] as const,
  teamMembers: (teamId: string) => ["team-members", teamId] as const,
  boards: (teamId: string) => ["boards", teamId] as const,
  board: (boardId: string) => ["board", boardId] as const,
  activity: (boardId: string) => ["activity", boardId] as const,
};
