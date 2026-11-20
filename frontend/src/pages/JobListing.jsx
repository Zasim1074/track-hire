import { useEffect, useState } from "react";
import { BriefcaseBusiness, Filter, MapPin, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { BarLoader } from "react-spinners";

import EmptyState from "@/components/EmptyState";
import Jobcard from "@/components/Jobcard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getJobPage } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";

const initialFilters = { searchQuery: "", location: "", work_mode: "", employment_type: "", experience_level: "", page: 1 };

export default function JobListing() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const { fn: loadJobs, data, loading, error } = useFetch(getJobPage);

  useEffect(() => { loadJobs(filters).catch(() => {}); }, [filters, loadJobs]);

  const submitSearch = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, searchQuery: search.trim(), location: location.trim(), page: 1 }));
  };
  const applyFilters = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, work_mode: workMode, employment_type: employmentType, experience_level: experienceLevel, page: 1 }));
  };
  const clearFilters = () => {
    setWorkMode(""); setEmploymentType(""); setExperienceLevel("");
    setFilters((current) => ({ ...current, work_mode: "", employment_type: "", experience_level: "", page: 1 }));
  };

  return <section>
    <PageHeader eyebrow="Curated opportunities" title="Find work that fits your next move" description="Search by role and location, then refine the results without losing sight of the jobs." />

    <form onSubmit={submitSearch} aria-label="Search jobs" className="mb-8 rounded-2xl border bg-card p-3 shadow-[0_18px_50px_-32px_hsl(var(--primary)/0.7)]">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,.75fr)_auto]">
        <label className="relative"><span className="sr-only">Job title or keyword</span><Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-14 border-0 bg-muted/60 pl-12 text-base shadow-none" placeholder="Job title, skill, or company" /></label>
        <label className="relative"><span className="sr-only">Location</span><MapPin aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" /><Input value={location} onChange={(event) => setLocation(event.target.value)} className="h-14 border-0 bg-muted/60 pl-12 text-base shadow-none" placeholder="City, state, or remote" /></label>
        <Button type="submit" size="lg" className="h-14 px-8"><Search aria-hidden="true" />Search jobs</Button>
      </div>
    </form>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <aside className="order-1 lg:order-2 lg:sticky lg:top-24" aria-label="Job filters">
        <Card className="border-primary/15">
          <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2"><SlidersHorizontal aria-hidden="true" className="text-primary" />Filters</CardTitle><Button type="button" variant="link" className="min-h-0 p-0" onClick={clearFilters}>Clear</Button></CardHeader>
          <CardContent><form onSubmit={applyFilters} className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold">Work mode<select aria-label="Work mode filter" className="h-11 rounded-lg border bg-background px-3 font-normal" value={workMode} onChange={(event) => setWorkMode(event.target.value)}><option value="">Any mode</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
            <label className="grid gap-2 text-sm font-semibold">Employment type<select aria-label="Employment type filter" className="h-11 rounded-lg border bg-background px-3 font-normal" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}><option value="">Any type</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></label>
            <label className="grid gap-2 text-sm font-semibold">Experience level<select aria-label="Experience filter" className="h-11 rounded-lg border bg-background px-3 font-normal" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}><option value="">Any level</option><option value="entry">Entry</option><option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead</option></select></label>
            <Button type="submit" variant="secondary"><Filter aria-hidden="true" />Apply filters</Button>
          </form></CardContent>
        </Card>
      </aside>

      <div className="order-2 min-w-0 lg:order-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-semibold"><BriefcaseBusiness aria-hidden="true" className="h-5 w-5 text-primary" />{data?.total ?? 0} opportunities</p><p className="mt-1 text-sm text-muted-foreground">Most recently published first</p></div></div>
        {loading && <BarLoader className="mb-4" width="100%" color="hsl(var(--primary))" />}
        {error && <div role="alert" className="rounded-xl border bg-card p-5">Unable to load jobs. {error.message}<Button className="ml-3" variant="outline" onClick={() => loadJobs(filters).catch(() => {})}>Try again</Button></div>}
        {!loading && !error && (data?.items?.length ? <>
          <div className="grid gap-4">{data.items.map((job) => <Jobcard key={job.id} job={job} />)}</div>
          {data.total_pages > 1 && <nav aria-label="Job results pages" className="mt-7 flex items-center justify-center gap-4"><Button variant="outline" disabled={data.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: data.page - 1 }))}>Previous</Button><span className="text-sm font-medium">Page {data.page} of {data.total_pages}</span><Button variant="outline" disabled={data.page >= data.total_pages} onClick={() => setFilters((current) => ({ ...current, page: data.page + 1 }))}>Next</Button></nav>}
        </> : <EmptyState icon={SearchX} title="No roles match this search" description="Try a broader title, nearby location, or clear one of the filters." />)}
      </div>
    </div>
  </section>;
}
