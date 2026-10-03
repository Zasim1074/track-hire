import { getPostedJobs } from "@/services/apiApplications";
import React, { useEffect } from "react";
import { useFetch } from "@/services/useFetch";
import { BarLoader } from "react-spinners";
import Jobcard from "./Jobcard";

const PostedJobs = () => {
  const {
    loading: loadingPostedJobs,
    data: dataPostedJobs,
    fn: fnPostedJobs,
    error: errorPostedJobs,
  } = useFetch(getPostedJobs);

  useEffect(() => {
    fnPostedJobs().catch(() => {});
  }, [fnPostedJobs]);

  if (loadingPostedJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }
  if (errorPostedJobs) return <p role="alert" className="text-red-500">{errorPostedJobs.message}</p>;

  return (
    <div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2  gap-4">
        {dataPostedJobs?.length ? (
          dataPostedJobs.map((job) => {
            return (
              <Jobcard
                key={job.id}
                job={job}
                // savedInit={job?.saved?.length > 0}
                onJobSaved={fnPostedJobs}
                isMyJob
              />
            );
          })
        ) : (
          <div>No Posted Jobs Found 👀</div>
        )}
      </div>
    </div>
  );
};

export default PostedJobs;
