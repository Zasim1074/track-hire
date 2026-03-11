import {  getAppliedJobs } from "@/services/apiApplications";
import { useFetch } from "@/services/useFetch";
import React, { useEffect } from "react";
import Jobcard from "./Jobcard";
import { BarLoader } from "react-spinners";
import ApplicationCard from "./ApplicationCard";

const AppliedJobs = ({ user_id }) => {
  const {
    loading: loadingAppliedJobs,
    data: dataAppliedJobs,
    error: errorAppliedJobs,
    fn: fnAppliedJobs,
  } = useFetch(getAppliedJobs, { user_id });

  useEffect(() => {
    if (!user_id) return;
    fnAppliedJobs();
  }, [user_id]);

  if (loadingAppliedJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  return (
    <div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2  gap-4">
        {dataAppliedJobs?.length ? (
          dataAppliedJobs.map((application) => {
            return (
              <ApplicationCard
                key={application.id}
                application={application}
                isCandidate
              />
            );
          })
        ) : (
          <div>No Applied Jobs Found 👀</div>
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;
