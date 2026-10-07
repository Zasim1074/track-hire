import darkLogo from "../assets/dark-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { BriefcaseBusiness, Heart, PenBox, UserRound, FileText } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div>
      <nav className="py-2 flex justify-between items-center">
        <Link to="/">
          <img src={darkLogo} alt="TrackHire" className="h-12 bg-transparent rounded-xl" />
        </Link>
        <div className="flex gap-3 items-center">
          {user ? <>
            {(user.role === "hr" || user.role === "admin") && <Link to="/dashboard"><Button variant="ghost">Dashboard</Button></Link>}
            {(user.role === "hr" || user.role === "admin") && <Link to="/post-job"><Button variant="destructive" className="rounded-full"><PenBox size={20} />Post a Job</Button></Link>}
            <Link to={user.role === "candidate" ? "/my-applications" : "/my-jobs"} aria-label={user.role === "candidate" ? "My applications" : "My jobs"}><Button variant="ghost" size="icon"><BriefcaseBusiness /></Button></Link>
            {user.role === "candidate" && <>
              <Link to="/saved-jobs" aria-label="Saved jobs"><Button variant="ghost" size="icon"><Heart /></Button></Link>
              <Link to="/profile" aria-label="Candidate profile"><Button variant="ghost" size="icon"><UserRound /></Button></Link>
              <Link to="/resumes" aria-label="My resumes"><Button variant="ghost" size="icon"><FileText /></Button></Link>
            </>}
            <span className="hidden sm:inline text-sm">{user.first_name}</span>
            <Button variant="outline" onClick={signOut}>Log out</Button>
          </> : <>
            <Link to="/login"><Button variant="outline">Login</Button></Link>
            <Link to="/register"><Button variant="blue">Sign up</Button></Link>
          </>}
        </div>
      </nav>
      <hr className="pt-5" />
    </div>
  );
};

export default Header;
