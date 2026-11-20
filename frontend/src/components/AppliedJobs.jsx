import {  getAppliedJobs } from "@/services/apiApplications";
import { useFetch } from "@/services/useFetch";
import React, { useEffect } from "react";
import { BarLoader } from "react-spinners";
import ApplicationCard from "./ApplicationCard";
import EmptyState from "./EmptyState";

const AppliedJobs = () => {
  const {
    loading: loadingAppliedJobs,
    data: dataAppliedJobs,
    error: errorAppliedJobs,
    fn: fnAppliedJobs,
  } = useFetch(getAppliedJobs);

  useEffect(() => {
    fnAppliedJobs().catch(() => {});
  }, [fnAppliedJobs]);

  if (loadingAppliedJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  return (
    <div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2  gap-4">
        {errorAppliedJobs ? <p role="alert">{errorAppliedJobs.message}</p> : dataAppliedJobs?.items?.length ? (
          dataAppliedJobs.items.map((application) => {
            return (
              <ApplicationCard
                key={application.id}
                application={application}
                isCandidate
              />
            );
          })
        ) : (
          <EmptyState title="No applications yet" description="Explore open roles and submit your first application when you find the right fit." actionLabel="Browse open roles" actionTo="/jobs" />
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;
