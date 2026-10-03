import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHiringStatus, getSingleJob } from "@/services/apiJobs";
import { getCompany } from "@/services/apiCompanies";
import { useFetch } from "@/services/useFetch";
import { useAuth } from "@/auth/AuthContext";
import MDEditor from "@uiw/react-md-editor";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import ApplyJobDrawer from "@/components/ApplyJobDrawer";
import ApplicationCard from "@/components/ApplicationCard";
import { getJobApplications, getAppliedJobs } from "@/services/apiApplications";

const Job = () => {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();

  const {
    fn: fnJob,
    data: dataJob,
    loading: loadingJob,
    error: errorJob,
  } = useFetch(getSingleJob, { job_id: id });

  const {
    fn: fnHiringStatus,
    loading: loadingHiringStatus,
    error: errorHiringStatus,
  } = useFetch(getHiringStatus, { job_id: id });
  const { fn: fnCompany, data: company } = useFetch(getCompany);
  const { fn: fnApplications, data: applications, error: applicationsError, loading: applicationsLoading } = useFetch(getJobApplications);
  const { fn: fnMyApplications, data: myApplications } = useFetch(getAppliedJobs);

  useEffect(() => {
    fnJob().catch(() => {});
  }, [id, fnJob]);

  useEffect(() => {
    if (dataJob?.company_id) fnCompany({ company_id: dataJob.company_id }).catch(() => {});
  }, [dataJob?.company_id, fnCompany]);

  useEffect(() => {
    if (dataJob && (user?.role === "hr" || user?.role === "admin")) fnApplications({ job_id: dataJob.id }).catch(() => {});
    if (dataJob && user?.role === "candidate") fnMyApplications().catch(() => {});
  }, [dataJob, user?.role, fnApplications, fnMyApplications]);

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus({ isOpen }).then(() => fnJob()).catch(() => {});
  };

  // =================================== UI ==========================================
  if (authLoading) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  return (
    <>
      {loadingJob && (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      )}
      {errorJob && <p role="alert" className="text-red-500">{errorJob.message}</p>}
      {errorHiringStatus && <p role="alert" className="text-red-500">{errorHiringStatus.message}</p>}
      {dataJob && (
        <div className="flex flex-col gap-8 mt-5">
          <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
            <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">
              {dataJob?.title}
            </h1>
            {company?.logo_url && (
              <div>
                <img
                  src={company.logo_url}
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

            {user?.role === "candidate" && (
              <div className="flex gap-2">
              {dataJob?.status === "published" ? (
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
              {applications?.length ?? "—"}
              {"  "}Applicants
            </div>
          </div>

          {/* hiring status */}
              {(user?.role === "hr" || user?.role === "admin") && (
            <Select
              disabled={loadingHiringStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
              className={`w-auto h-full gap-4 ${dataJob.status === "published" ? "bg-green-950" : "bg-red-950"}`}
              >
                <SelectValue
                  placeholder={`Hiring Status : ${dataJob.status === "published" ? "Open" : "Closed"}`}
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
              source={(dataJob?.skills || []).join(", ") || "No listed requirements"}
              className="bg-transparent sm:text-lg"
            />
          </div>

          {/* Application -> Recruiter */}

          {user?.role === "candidate" && (
            <ApplyJobDrawer
              className="w-full items-center"
              dataJob={dataJob}
              user={user}
              fetchJob={fnJob}
              applied={myApplications?.some((appli) => appli.job_id === dataJob.id)}
            />
          )}

          {(user?.role === "hr" || user?.role === "admin") && (
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold pb-2">
                Applications
              </h2>

              {applicationsLoading && <BarLoader className="mb-4" width="100%" color="#85D055" />}
              {applicationsError && <p role="alert" className="text-red-500">{applicationsError.message}</p>}
              <div className="grid md:grid-cols-2 gap-4">
                {applications?.length > 0 ? (
                  applications.map((appli) => (
                    <ApplicationCard key={appli.id} application={appli} />
                  ))
                ) : (
                  !applicationsLoading && !applicationsError && <p>No applications yet</p>
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
