// Shades stay inside the crimson family so avatars never clash with the brand.
const palette = [
  "bg-accent",
  "bg-rose-600",
  "bg-crimson-600",
  "bg-rose-700",
  "bg-crimson-500",
  "bg-crimson-700",
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const colorFor = (seed: string) => {
  const sum = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[sum % palette.length];
};

interface AvatarProps {
  name: string;
  size?: number;
  title?: string;
}

export default function Avatar({ name, size = 28, title }: AvatarProps) {
  return (
    <span
      title={title ?? name}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-on-accent ${colorFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
