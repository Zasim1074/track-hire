import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import Header from "./Header";
import WorkspaceSidebar from "./WorkspaceSidebar";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "./theme-context";
import { Button } from "./ui/button";

const AppLayout = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const workspace = Boolean(user) && !["/", "/login", "/register"].includes(pathname);

  if (workspace) return <div className="min-h-dvh bg-background lg:pl-64">
    <a href="#main-content" className="sr-only z-[70] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
    <WorkspaceSidebar />
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu aria-hidden="true" /></Button><div><p className="text-sm font-semibold">{user?.role === "hr" ? "Recruiter workspace" : user?.role === "admin" ? "Administration" : "Candidate workspace"}</p><p className="hidden text-xs text-muted-foreground sm:block">Welcome back, {user?.first_name}</p></div></div>
      <Button variant="ghost" size="icon" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</Button>
    </header>
    {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/60" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /><div className="relative h-full w-[min(20rem,88vw)]"><WorkspaceSidebar mobile onNavigate={() => setMenuOpen(false)} /><Button variant="ghost" size="icon" className="absolute right-3 top-3 text-white hover:bg-white/10 hover:text-white" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X aria-hidden="true" /></Button></div></div>}
    <main id="main-content" tabIndex="-1" className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
  </div>;

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <div className="grid-background" aria-hidden="true" />
      <Header />
      <main id="main-content" tabIndex="-1" className="container min-h-[calc(100dvh-10rem)] py-8 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t bg-card">
        <div className="container flex flex-col gap-2 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-foreground">TrackHire</p>
          <p>Clearer hiring journeys for candidates and recruitment teams.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
