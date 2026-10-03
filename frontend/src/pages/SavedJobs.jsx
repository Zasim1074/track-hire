import React, { useEffect } from "react";
import Jobcard from "@/components/Jobcard";
import { fetchSavedJobs } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";
import { BarLoader } from "react-spinners";

export default function SavedJobs() {
  const { fn, data, loading, error } = useFetch(fetchSavedJobs);
  useEffect(() => { fn().catch(() => {}); }, [fn]);

  return <div>
    <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">Saved Jobs</h1>
    {loading && <BarLoader width="100%" color="#85D055" />}
    {error && <p role="alert" className="text-red-500">{error.message}</p>}
    {!loading && !error && (data?.length ? <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((saved) => <Jobcard key={saved.id} job={saved.job} savedInit onJobSaved={() => fn().catch(() => {})} />)}
    </div> : <p className="mt-8">No Saved Jobs Found 👀</p>)}
  </div>;
}
