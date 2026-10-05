import { LayoutDashboard, LogOut, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 bg-slate-900 p-4 text-slate-200 md:w-60 md:min-h-screen">
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 font-bold text-white">T</span>
        <span className="text-lg font-semibold tracking-tight text-white">TaskFlow</span>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400">
          <Users size={18} /> Team members live inside each team
        </span>
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-slate-800 pt-4">
        <Avatar name={user?.name ?? "?"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
          <LogOut size={16} />
        </Button>
      </div>
    </aside>
  );
}
