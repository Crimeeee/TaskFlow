export default function Spinner({ size = 24, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-muted">
      <span
        className="inline-block animate-spin rounded-full border-2 border-line-strong border-t-accent"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
