import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { BookmarkIcon, BriefcaseBusiness, Building2, Clock3, IndianRupee, MapPinIcon, Pencil, Sparkles, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useFetch } from "../services/useFetch";
import { deleteJob, getSavedJobs } from "../services/apiJobs";
import { BarLoader } from "react-spinners";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const Jobcard = ({
  job,
  isMyJob = false,
  savedInit = false,
  onJobSaved = () => {},
}) => {
  const [saved, setSaved] = useState(savedInit);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fn: fnDeleteJob, loading: loadingDeleteJob } = useFetch(deleteJob, {
    job_id: job.id,
  });
  const { fn: fnSaveJob, loading: loadingSaveJob } = useFetch(getSavedJobs, {
    job_id: job.id,
    alreadySaved: saved,
  });

  const handleDeleteJob = async () => {
    setDeleteError("");
    try {
      await fnDeleteJob();
      onJobSaved();
    } catch (error) {
      setDeleteError(error.message);
    }
  };

  const toggleSaved = async () => {
    if (!user) { navigate("/login", { state: { from: { pathname: `/jobs/${job.id}` } } }); return; }
    if (user.role !== "candidate") return;
    setSaveError("");
    try {
      await fnSaveJob({ alreadySaved: saved });
      setSaved(!saved);
      onJobSaved();
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const salary = job.min_salary || job.max_salary
    ? `${job.min_salary ? `₹${Math.round(job.min_salary / 100000)}L` : ""}${job.min_salary && job.max_salary ? " – " : ""}${job.max_salary ? `₹${Math.round(job.max_salary / 100000)}L` : ""}`
    : null;
  const companyInitial = (job.company?.name || "H").charAt(0).toUpperCase();

  return (
    <Card as="article" className="group overflow-hidden border-l-4 border-l-transparent transition-[border-color,box-shadow] duration-200 hover:border-l-primary hover:shadow-[0_18px_45px_-30px_hsl(var(--primary)/0.65)]">
      {loadingDeleteJob && (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      )}
      <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-cyan-100 text-lg font-extrabold text-primary dark:from-violet-950 dark:to-cyan-950">{companyInitial}</div>
        <div className="min-w-0 flex-1">
        <CardHeader className="flex w-full flex-row justify-between gap-4 p-0 pb-3">
          <div className="min-w-0"><CardTitle className="text-xl leading-7"><Link className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/jobs/${job.id}`}>{job?.title}</Link></CardTitle><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Building2 aria-hidden="true" className="h-4 w-4" />{job.company?.name || "Hiring company"}</p></div>
          {isMyJob && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${job.title}`}
              onClick={() => {
                if (window.confirm(`Delete “${job.title}”? This cannot be undone.`)) handleDeleteJob();
              }}
              disabled={loadingDeleteJob}
            >
              <Trash2Icon fill="red" size={18} className="text-red-300" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPinIcon aria-hidden="true" size={16} />{job.location || "Location flexible"}</span>
            <span className="flex items-center gap-2"><BriefcaseBusiness aria-hidden="true" size={16} />{(job.employment_type || "").replaceAll("_", " ")}</span>
            {salary && <span className="flex items-center gap-2"><IndianRupee aria-hidden="true" size={16} />{salary}</span>}
          </div>
          <p className="line-clamp-2 leading-6 text-muted-foreground">
            {(job?.description || "").substring(0, 180)}{(job?.description || "").length > 180 ? "…" : ""}
          </p>
          {job.skills?.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Required skills">{job.skills.slice(0, 3).map((skill) => <li key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{skill}</li>)}{job.skills.length > 3 && <li className="rounded-full bg-muted px-2.5 py-1 text-xs">+{job.skills.length - 3}</li>}</ul>}
        </CardContent>
        </div>
      </div>
      <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/25 px-5 py-3 sm:px-6">
        {isMyJob && (
          <Button asChild variant="outline" size="icon">
            <Link to={`/post-job?job_id=${job.id}`} aria-label={`Edit ${job.title}`}>
              <Pencil size={16} />
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary" className="mr-auto">
          <Link to={`/jobs/${job.id}`}>
            More Details <Sparkles aria-hidden="true" />
          </Link>
        </Button>

        {job.published_at && <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Clock3 aria-hidden="true" className="h-4 w-4" />Posted {new Date(job.published_at).toLocaleDateString()}</span>}

        {(user?.role === "candidate" || !user) && <Button
          variant="outline"
          className="w-11"
          onClick={toggleSaved}
          disabled={loadingSaveJob}
          aria-label={saved ? "Remove from saved" : "Save job"}
          title={saved ? "Remove from saved" : "Save job"}
        >
          <BookmarkIcon
            size={20}
            fill={saved ? "currentColor" : "transparent"}
            className={saved ? "text-primary" : "text-muted-foreground"}
          />
        </Button>}
      </CardFooter>
      {saveError && <p role="alert" className="px-5 pb-3 text-sm text-red-500">{saveError}</p>}
      {deleteError && <p role="alert" className="px-5 pb-3 text-sm text-red-500">{deleteError}</p>}
    </Card>
  );
};

export default Jobcard;
