import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="absolute right-5 top-5 rounded-xl border border-line bg-raised p-2.5 text-muted transition-colors hover:text-strong"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <aside className="surface-grain relative hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-300 lg:flex">
        <span className="font-display flex items-center gap-2.5 text-lg font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-base text-on-accent shadow-sm shadow-accent/40">
            T
          </span>
          TaskFlow
        </span>

        <div className="max-w-sm">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-bright">Team boards</p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-white">
            Move the work forward, without the noise.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Boards, columns, assignees and a full activity history for every team you work with.
          </p>
        </div>

        <p className="font-mono text-xs text-zinc-600">Express · TypeScript · SQLite</p>
      </aside>

      <main className="flex items-center justify-center bg-page px-4 py-10">
        <div className="w-full max-w-sm">
          <span className="font-display mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-sm shadow-accent/40 lg:hidden">
            T
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-strong">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-5 text-center text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
