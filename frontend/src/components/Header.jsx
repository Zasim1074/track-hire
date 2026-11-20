import { Link, NavLink, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Building2, FileText, Heart, LogOut, Moon, Search, Settings, Sun, UserRound } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "./theme-context";
import { Button } from "./ui/button";
import { cn } from "@/utils/utils";

const navClass = ({ isActive }) => cn(
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  isActive && "bg-primary/10 text-primary",
);

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate("/", { replace: true }); };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="brand-panel grid h-9 w-9 place-items-center rounded-xl text-white shadow-md shadow-primary/20"><BriefcaseBusiness aria-hidden="true" className="h-5 w-5" /></span>
          <span className="text-lg font-bold tracking-tight">TrackHire</span>
        </Link>

        <nav aria-label="Primary navigation" className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:order-2 sm:w-auto sm:pb-0">
          <NavLink to="/jobs" className={navClass}><Search aria-hidden="true" />Jobs</NavLink>
          {user?.role === "candidate" && <>
            <NavLink to="/my-applications" className={navClass}><BriefcaseBusiness aria-hidden="true" />Applications</NavLink>
            <NavLink to="/saved-jobs" className={navClass}><Heart aria-hidden="true" />Saved</NavLink>
            <NavLink to="/profile" className={navClass}><UserRound aria-hidden="true" />Profile</NavLink>
            <NavLink to="/resumes" className={navClass}><FileText aria-hidden="true" />Resumes</NavLink>
          </>}
          {(user?.role === "hr" || user?.role === "admin") && <>
            <NavLink to="/dashboard" className={navClass}><Building2 aria-hidden="true" />Dashboard</NavLink>
            <NavLink to="/my-jobs" className={navClass}><BriefcaseBusiness aria-hidden="true" />My jobs</NavLink>
          </>}
        </nav>

        <div className="order-2 flex items-center gap-1 sm:order-3">
          <Button variant="ghost" size="icon" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
          {user ? <>
            <span className="hidden text-sm font-medium lg:inline">{user.first_name}</span>
            <Button asChild variant="ghost" size="icon"><Link to="/settings" aria-label="Account settings"><Settings aria-hidden="true" /></Link></Button>
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={signOut}><LogOut aria-hidden="true" /></Button>
          </> : <>
            <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
            <Button asChild><Link to="/register">Get started</Link></Button>
          </>}
        </div>
      </div>
    </header>
  );
}
