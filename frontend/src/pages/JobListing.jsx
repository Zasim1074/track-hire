import { useEffect, useState } from "react";
import Jobcard from "@/components/Jobcard";
import { getJobPage } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";

export default function JobListing() {
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [filters, setFilters] = useState({ searchQuery: "" });
  const { fn: loadJobs, data, loading, error } = useFetch(getJobPage);
  useEffect(() => {
    loadJobs(filters).catch(() => {});
  }, [filters, loadJobs]);
  const submit = (event) => {
    event.preventDefault();
    setFilters({
      searchQuery: search.trim(),
      work_mode: workMode,
      employment_type: employmentType,
      experience_level: experienceLevel,
      page: 1,
    });
  };
  const reset = () => {
    setSearch("");
    setWorkMode("");
    setEmploymentType("");
    setExperienceLevel("");
    setFilters({ searchQuery: "", page: 1 });
  };

  return (
    <section>
      <h1 className="gradient-title pb-5 text-5xl font-extrabold">
        Latest Jobs
      </h1>
      <form
        onSubmit={submit}
        className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end"
      >
        <Input
          aria-label="Search jobs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or keyword"
        />
        <label className="grid gap-1 text-xs text-muted-foreground">
          Work mode
          <select
            aria-label="Work mode filter"
            className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
            value={workMode}
            onChange={(event) => setWorkMode(event.target.value)}
          >
            <option value="">Any mode</option>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Employment type
          <select
            aria-label="Employment type filter"
            className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
          >
            <option value="">Any type</option>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Experience
          <select
            aria-label="Experience filter"
            className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
            value={experienceLevel}
            onChange={(event) => setExperienceLevel(event.target.value)}
          >
            <option value="">Any level</option>
            <option value="entry">Entry</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="blue">
            Search
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
      </form>
      {loading && <BarLoader className="mb-4" width="100%" color="#85D055" />}
      {error && (
        <div role="alert" className="rounded-lg border p-5">
          Unable to load jobs. {error.message}
          <Button
            className="ml-3"
            variant="outline"
            onClick={() => loadJobs(filters).catch(() => {})}
          >
            Try again
          </Button>
        </div>
      )}
      {!loading &&
        !error &&
        (data?.items?.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((job) => (
                <Jobcard key={job.id} job={job} />
              ))}
            </div>
            {data.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={data.page <= 1 || loading}
                  onClick={() =>
                    loadJobs({ ...filters, page: data.page - 1 }).catch(
                      () => {},
                    )
                  }
                >
                  Previous
                </Button>
                <span>
                  Page {data.page} of {data.total_pages}
                </span>
                <Button
                  variant="outline"
                  disabled={data.page >= data.total_pages || loading}
                  onClick={() =>
                    loadJobs({ ...filters, page: data.page + 1 }).catch(
                      () => {},
                    )
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          !loading &&
          !error && (
            <div className="mt-8 rounded-lg border p-8 text-center">
              <h2 className="text-xl font-semibold">No jobs found</h2>
              <p className="mt-2 text-muted-foreground">
                Try another keyword, or check back soon.
              </p>
            </div>
          )
        ))}
    </section>
  );
}
