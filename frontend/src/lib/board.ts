import type { Card, Column } from "./types";

export const sortByPosition = (cards: Card[]): Card[] => [...cards].sort((a, b) => a.position - b.position);

/** Midpoint of the neighbours around an insertion index, per the API's float position rule. */
export function positionFor(cards: Card[], index: number): number {
  const ordered = sortByPosition(cards);
  const prev = ordered[index - 1];
  const next = ordered[index];
  if (prev && next) return (prev.position + next.position) / 2;
  if (next) return next.position - 1024;
  if (prev) return prev.position + 1024;
  return 1024;
}

export function findCard(columns: Column[], cardId: string): { column: Column; card: Card } | null {
  for (const column of columns) {
    const card = column.cards.find((c) => c.id === cardId);
    if (card) return { column, card };
  }
  return null;
}

/** Moves a card in memory; returns null when the move would not change anything. */
export function applyMove(columns: Column[], cardId: string, targetColumnId: string, index: number): Column[] | null {
  const found = findCard(columns, cardId);
  if (!found) return null;

  const target = columns.find((c) => c.id === targetColumnId);
  if (!target) return null;

  const sourceCards = sortByPosition(found.column.cards).filter((c) => c.id !== cardId);
  const targetCards = found.column.id === targetColumnId ? sourceCards : sortByPosition(target.cards);
  const clamped = Math.max(0, Math.min(index, targetCards.length));
  const position = positionFor(targetCards, clamped);

  const moved: Card = { ...found.card, columnId: targetColumnId, position };
  const withCard = [...targetCards];
  withCard.splice(clamped, 0, moved);

  return columns.map((column) => {
    if (column.id === targetColumnId) return { ...column, cards: withCard };
    if (column.id === found.column.id && column.id !== targetColumnId) return { ...column, cards: sourceCards };
    return column;
  });
}

/**
 * Visual tone per column so the board reads at a glance instead of one flat colour.
 * Classes are spelled out in full because the Tailwind scanner cannot see `bg-${tone}`.
 */
const TONES = {
  "tone-done": { bar: "bg-tone-done", text: "text-tone-done" },
  "tone-review": { bar: "bg-tone-review", text: "text-tone-review" },
  "tone-doing": { bar: "bg-tone-doing", text: "text-tone-doing" },
  "tone-todo": { bar: "bg-tone-todo", text: "text-tone-todo" },
} as const;

export const toneForColumn = (name: string) => {
  const n = name.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(n)) return TONES["tone-done"];
  if (/(review|qa|check|verify)/.test(n)) return TONES["tone-review"];
  if (/(progress|doing|active|started)/.test(n)) return TONES["tone-doing"];
  return TONES["tone-todo"];
};
