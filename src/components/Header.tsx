import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Moon, LogOut, Compass, Sparkles, User as UserIcon, BookOpen, Calendar, Gift } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/", label: "Home", icon: Moon },
    { to: "/challenges", label: "Challenges", icon: Compass },
    { to: "/profile", label: "Profile", icon: UserIcon },
    { to: "/notebook", label: "Notebook", icon: BookOpen },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/ads", label: "Ads", icon: Gift },
  ];

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <motion.div
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow/30 to-indigo-glow/20 ring-1 ring-violet-glow/40"
            whileHover={{ scale: 1.08, rotate: 8 }}
          >
            <Moon className="h-5 w-5 text-moon" />
          </motion.div>
          <span className="font-display text-xl font-semibold tracking-tight text-gradient">
            Moonbug
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-violet-glow/15 bg-obsidian-soft/60 p-1 backdrop-blur">
          {links.map((l) => {
            const active =
              l.to === "/" ? location.pathname === "/" : location.pathname.startsWith(l.to);
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active ? "text-moon" : "text-moon-dim hover:text-moon"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-violet-glow/20 ring-1 ring-violet-glow/30"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-violet-glow/15 bg-obsidian-soft/60 px-3 py-1.5 text-sm text-moon-dim sm:flex">
                <Sparkles className="h-4 w-4 text-aurora" />
                <span className="text-moon">{user.displayName}</span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-violet-glow/15 bg-obsidian-soft/60 text-moon-dim transition hover:text-rose-glow"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
