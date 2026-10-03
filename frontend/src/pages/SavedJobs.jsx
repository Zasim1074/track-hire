import Jobcard from "@/components/Jobcard";
import { fetchSavedJobs } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";
import { useUser } from "@clerk/clerk-react";
import React, { useEffect } from "react";
import { BarLoader } from "react-spinners";

const SavedJobs = () => {
  const { isLoaded } = useUser();
  const {
    loading: loadingSavedJobs,
    data: dataSavedJobs,
    error: errorSavedJobs,
    fn: fnSavedjobs,
  } = useFetch(fetchSavedJobs);

  useEffect(() => {
    if (!isLoaded) return;
    fnSavedjobs();
  }, [isLoaded]);

  return (
    <div>
      <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">
        Saved Jobs
      </h1>

      {loadingSavedJobs ? (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSavedJobs?.length ? (
            dataSavedJobs.map((saved) => {
              return (
                <Jobcard
                  key={saved.id}
                  job={saved?.job}
                  savedInit={true}
                  onJobSaved={() => fnSavedjobs()}
                />
              );
            })
          ) : (
            <div>No Saved Jobs Found 👀</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
