import Jobcard from "@/components/Jobcard";
import { useFetch } from "@/hooks/useFetch";
import { getJobs } from "@/services/apiJobs";
import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

const JobListing = () => {
  const { isLoaded } = useUser();
  const [location, setLocation] = useState("");
  const [company, setComapny] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    fn: fnJobs,
    data: dataJobs,
    loading: loadingJobs,
    error: errorJobs,
  } = useFetch(getJobs, { location, company, searchQuery });

  useEffect(() => {
    if (isLoaded) fnJobs();
  }, [isLoaded, location, company, searchQuery]);

  // Loading State
  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#85D055" />;
  }

  return (
    <div>
      <h1 className="gradient-title font-extrabold text-6xl sm:text-7xl tex-center pb-8">
        Latest Jobs
      </h1>

      {/* Add Filter here */}

      {loadingJobs && (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      )}

      {loadingJobs === false && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataJobs?.length ? (
            dataJobs.map((job) => {
              return <Jobcard key={job.id} job={job} />;
            })
          ) : (
            <div>No Jobs Found 😢</div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobListing;
