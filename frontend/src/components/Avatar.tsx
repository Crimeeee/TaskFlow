const palette = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
