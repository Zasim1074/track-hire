import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHiringStatus, getSingleJob } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";
import { useUser } from "@clerk/clerk-react";
import MDEditor from "@uiw/react-md-editor";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import ApplyJobDrawer from "@/components/ApplyJobDrawer";
import ApplicationCard from "@/components/ApplicationCard";

const Job = () => {
  const { user, isLoaded } = useUser();
  const { id } = useParams();

  const {
    fn: fnJob,
    data: dataJob,
    loading: loadingJob,
  } = useFetch(getSingleJob, { job_id: id });

  const {
    fn: fnHiringStatus,
    data: dataHiringStatus,
    loading: loadingHiringStatus,
    error: errorHiringStatus,
  } = useFetch(getHiringStatus, { job_id: id });

  useEffect(() => {
    if (!isLoaded) return;
    fnJob();
  }, [isLoaded]);

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus({ isOpen }).then(() => fnJob());
  };

  // =================================== UI ==========================================
  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  return (
    <>
      {loadingJob && (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      )}
      {dataJob && (
        <div className="flex flex-col gap-8 mt-5">
          <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
            <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">
              {dataJob?.title}
            </h1>
            {dataJob?.company && (
              <div>
                <img
                  src={dataJob.company.logo_url}
                  className="h-12"
                  alt={dataJob.title}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              {<MapPinIcon />}
              {dataJob?.location}
            </div>

            {dataJob?.recruiter_id !== user?.id && (
              <div className="flex gap-2">
                {dataJob?.isOpen ? (
                  <div className="flex felx-row">
                    <DoorOpen className="mr-2" />
                    <p>Currently Hiring</p>
                  </div>
                ) : (
                  <div className="flex felx-row">
                    <DoorClosed className="mr-2" /> <p>Hiring Closed</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {<Briefcase />}
              {dataJob?.applications?.length ?? 0}
              {"  "}Applicants
            </div>
          </div>

          {/* hiring status */}
          {dataJob?.recruiter_id === user?.id && (
            <Select
              disabled={loadingHiringStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
                className={`w-auto h-full gap-4 ${dataJob.isOpen ? "bg-green-950" : "bg-red-950"}`}
              >
                <SelectValue
                  placeholder={`Hiring Status : ${dataJob.isOpen ? "Open" : "Closed"}`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Description:</h2>
            <p className="sm:text-lg">{dataJob?.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Requirements: </h2>
            <MDEditor.Markdown
              source={dataJob?.requirements || "No description"}
              className="bg-transparent sm:text-lg"
            />
          </div>

          {/* Application -> Recruiter */}

          {dataJob?.recruiter_id !== user.id && (
            <ApplyJobDrawer
              className="w-full items-center"
              dataJob={dataJob}
              user={user}
              fetchJob={fnJob}
              applied={dataJob?.applications?.find(
                (appli) => appli.candidate_id === user.id,
              )}
            />
          )}

          {dataJob?.recruiter_id === user.id && (
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold pb-2">
                Applications
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {dataJob?.applications?.length > 0 ? (
                  dataJob.applications.map((appli) => (
                    <ApplicationCard key={appli.id} application={appli} />
                  ))
                ) : (
                  <p>No applications yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Job;
