import { NavLink, Link, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Building2, FileText, Heart, LayoutDashboard, LogOut, Search, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/utils/utils";

const candidateNav = [["/dashboard", "Overview", LayoutDashboard], ["/jobs", "Find jobs", Search], ["/saved-jobs", "Saved jobs", Heart], ["/my-applications", "Applications", BriefcaseBusiness], ["/profile", "My profile", UserRound], ["/resumes", "Resumes", FileText]];
const recruiterNav = [["/dashboard", "Overview", LayoutDashboard], ["/my-jobs", "Jobs & applicants", BriefcaseBusiness], ["/post-job", "Create job", FileText]];
const adminNav = [["/dashboard", "Overview", LayoutDashboard], ["/jobs", "Jobs", BriefcaseBusiness], ["/companies", "Companies", Building2]];

export default function WorkspaceSidebar({ mobile = false, onNavigate }) {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const items = user?.role === "candidate" ? candidateNav : user?.role === "hr" ? recruiterNav : adminNav;
  const signOut = () => { logout(); navigate("/", { replace: true }); };
  return <aside className={cn("flex h-full flex-col bg-[#172B4D] text-white", mobile ? "w-full" : "fixed inset-y-0 left-0 z-40 hidden w-64 lg:flex")}>
    <Link to="/dashboard" className="flex min-h-20 items-center gap-3 border-b border-white/10 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#172B4D]"><BriefcaseBusiness aria-hidden="true" className="h-5 w-5" /></span>
      <span><span className="block text-lg font-bold">TrackHire</span><span className="block text-xs text-slate-300">Recruitment workspace</span></span>
    </Link>
    <nav aria-label="Workspace navigation" className="flex-1 space-y-1 overflow-y-auto p-4">
      <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Workspace</p>
      {items.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", isActive && "bg-white text-[#172B4D] shadow-sm")}><Icon aria-hidden="true" className="h-5 w-5" />{label}</NavLink>)}
    </nav>
    <div className="border-t border-white/10 p-4">
      <Link to="/settings" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"><Settings aria-hidden="true" className="h-5 w-5" />Settings</Link>
      <button type="button" onClick={signOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"><LogOut aria-hidden="true" className="h-5 w-5" />Log out</button>
      <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/10 p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-200 font-semibold text-[#172B4D]">{user?.first_name?.[0] || "U"}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{user?.first_name} {user?.last_name}</span><span className="block text-xs capitalize text-slate-300">{user?.role === "hr" ? "Recruiter" : user?.role}</span></span></div>
    </div>
  </aside>;
}
