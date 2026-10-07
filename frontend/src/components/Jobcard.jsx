import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { BookmarkIcon, MapPinIcon, Pencil, Trash2Icon } from "lucide-react";
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

  return (
    <Card className="flex flex-col justify-between">
      {loadingDeleteJob && (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      )}
      <div>
        <CardHeader className="flex flex-row w-full justify-between">
          <CardTitle className="flex justify-between font-medium text-xl">
            {job?.title}
          </CardTitle>
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

        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between">
          {job.company?.logo_url && <img src={job.company.logo_url} className="h-6" alt={job.company.name || "Company"} />}
            <div className="flex gap-2 items-center">
              {<MapPinIcon size={15} />}
              {job.location}
            </div>
          </div>
          <hr />
          <p className="text-1xl font-light">
            {(job?.description || "").substring(0, 150)} {"..."}
          </p>
        </CardContent>
      </div>
      <CardFooter className="flex gap-2">
        {isMyJob && (
          <Link to={`/post-job?job_id=${job.id}`}>
            <Button type="button" variant="outline" size="icon" aria-label={`Edit ${job.title}`}>
              <Pencil size={16} />
            </Button>
          </Link>
        )}
        <Link to={`/jobs/${job.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            More Details
          </Button>
        </Link>

        {(user?.role === "candidate" || !user) && <Button
          variant="outline"
          className="w-14 transition-all duration-300 hover:scale-110"
          onClick={toggleSaved}
          disabled={loadingSaveJob}
          aria-label={saved ? "Remove from saved" : "Save job"}
          title={saved ? "Remove from saved" : "Save job"}
        >
          <BookmarkIcon
            size={20}
            stroke={saved ? "violet" : "grey"}
            fill={saved ? "violet" : "transparent"}
            className="transition-all duration-300"
          />
        </Button>}
      </CardFooter>
      {saveError && <p role="alert" className="px-5 pb-3 text-sm text-red-500">{saveError}</p>}
      {deleteError && <p role="alert" className="px-5 pb-3 text-sm text-red-500">{deleteError}</p>}
    </Card>
  );
};

export default Jobcard;
