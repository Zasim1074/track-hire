import React, { useEffect } from "react";
import Jobcard from "@/components/Jobcard";
import { fetchSavedJobs } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";
import { BarLoader } from "react-spinners";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export default function SavedJobs() {
  const { fn, data, loading, error } = useFetch(fetchSavedJobs);
  useEffect(() => { fn().catch(() => {}); }, [fn]);

  return <div>
    <PageHeader eyebrow="Candidate workspace" title="Saved jobs" description="Keep promising roles close while you compare requirements and prepare your application." />
    {loading && <BarLoader width="100%" color="#85D055" />}
    {error && <p role="alert" className="text-red-500">{error.message}</p>}
    {!loading && !error && (data?.length ? <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((saved) => <Jobcard key={saved.id} job={saved.job} savedInit onJobSaved={() => fn().catch(() => {})} />)}
    </div> : <EmptyState title="No saved jobs yet" description="Save roles while browsing so you can return to them here." actionLabel="Browse open roles" actionTo="/jobs" />)}
  </div>;
}
