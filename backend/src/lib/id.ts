import { randomUUID } from "node:crypto";

export const newId = (): string => randomUUID();

// Midpoint insert keeps positions stable without renumbering the column.
export const midpoint = (prev: number | null, next: number | null): number => {
  if (prev === null && next === null) return 1000;
  if (prev === null) return next! - 1000;
  if (next === null) return prev + 1000;
  return (prev + next) / 2;
};
