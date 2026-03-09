import { useUser } from "@clerk/clerk-react";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { BookmarkIcon, MapPinIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useFetch } from "../services/useFetch";
import { getSavedJobs } from "../services/apiJobs";

const Jobcard = ({
  job,
  isMyJob = false,
  savedInit = false,
  onJobSaved = () => {},
}) => {
  const { user } = useUser();
  const [saved, setSaved] = useState(savedInit);

  const {
    fn: fnSavedJobs,
    data: dataSavedJobs,
    loading: loadingSavedJobs,
  } = useFetch(getSavedJobs, { alreadySaved: saved });

  const handleSavedJob = async () => {
    const user_id = user?.id;
    const job_id = job?.id;

    try {
      await fnSavedJobs({ user_id, job_id });
      setSaved(!saved);
      onJobSaved();
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <CardHeader>
          <CardTitle className="flex justify-between font-medium text-xl">
            {job?.title}
          </CardTitle>
          {isMyJob && (
            <Trash2Icon
              fill="red"
              size={18}
              className="text-red-300 cursor-pointer"
            />
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between">
            {job.company && <img src={job.company?.logo_url} className="h-6" />}
            <div className="flex gap-2 items-center">
              {<MapPinIcon size={15} />}
              {job.location}
            </div>
          </div>
          <hr />
          <p className="text-1xl font-light">
            {job?.description.substring(0, 150)} {"..."}
          </p>
        </CardContent>
      </div>
      <CardFooter className="flex gap-2">
        <Link to={`/jobs/${job.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            More Details
          </Button>
        </Link>

        <Button
          variant="outline"
          className="w-14 transition-all duration-300 hover:scale-110"
          onClick={handleSavedJob}
          disabled={loadingSavedJobs}
          title={saved ? "Remove from saved" : "Save job"}
        >
          <BookmarkIcon
            size={20}
            stroke={saved ? "violet" : "grey"}
            fill={saved ? "violet" : "transparent"}
            className="transition-all duration-300"
          />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Jobcard;
