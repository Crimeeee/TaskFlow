import { LayoutDashboard, LogOut, Moon, Sun, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
    isActive
      ? "bg-accent text-on-accent shadow-sm shadow-accent/30"
      : "text-muted hover:bg-white/5 hover:text-ink-soft"
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    // Stays dark in both themes: the contrast against the content area is the point.
    <aside className="surface-grain flex w-full shrink-0 flex-col gap-6 bg-zinc-950 p-4 text-zinc-300 md:w-64 md:min-h-screen">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex items-center gap-2.5">
          <span className="font-display flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-base font-bold text-on-accent shadow-sm shadow-accent/40">
            T
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">TaskFlow</span>
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        <span className="mt-1 flex items-start gap-3 rounded-xl px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
          <Users size={16} className="mt-0.5 shrink-0" /> Invite teammates from a team to assign cards.
        </span>
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
        <Avatar name={user?.name ?? "?"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
