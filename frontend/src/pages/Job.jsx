import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { BriefcaseBusiness, Building2, CalendarDays, IndianRupee, MapPin, Radio, Sparkles } from "lucide-react";

import ApplicationCard from "@/components/ApplicationCard";
import ApplyJobDrawer from "@/components/ApplyJobDrawer";
import AtsMatchCard from "@/components/AtsMatchCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/auth/AuthContext";
import { getAppliedJobs, getJobApplications } from "@/services/apiApplications";
import { fetchSavedJobs, getHiringStatus, getSavedJobs, getSingleJob } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";

const formatSalary = (minimum, maximum) => {
  if (!minimum && !maximum) return "Not disclosed";
  const value = (amount) => `₹${Math.round(amount / 100000)}L`;
  return `${minimum ? value(minimum) : ""}${minimum && maximum ? " – " : ""}${maximum ? value(maximum) : ""}`;
};

export default function Job() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { fn: loadJob, data: job, loading, error } = useFetch(getSingleJob, { job_id: id });
  const { fn: setHiringStatus, loading: changingStatus, error: statusError } = useFetch(getHiringStatus, { job_id: id });
  const { fn: loadApplications, data: applications, error: applicationsError, loading: applicationsLoading } = useFetch(getJobApplications);
  const { fn: loadMyApplications, data: myApplications, loading: checkingApplication, error: myApplicationsError } = useFetch(getAppliedJobs);

  useEffect(() => { loadJob().catch(() => {}); }, [id, loadJob]);
  useEffect(() => { if (job && (user?.role === "hr" || user?.role === "admin")) loadApplications({ job_id: job.id }).catch(() => {}); }, [job, user?.role, loadApplications]);
  useEffect(() => { if (user?.role === "candidate") loadMyApplications().catch(() => {}); }, [user?.role, loadMyApplications]);
  useEffect(() => {
    setSaved(false);
    if (!job?.id || user?.role !== "candidate") return undefined;
    let active = true;
    fetchSavedJobs().then((items) => { if (active) setSaved(items.some((item) => item.job_id === job.id)); }).catch(() => {});
    return () => { active = false; };
  }, [job?.id, user?.role]);

  const toggleSaved = async () => {
    setSaving(true); setSaveError("");
    try { await getSavedJobs({ job_id: job.id, alreadySaved: saved }); setSaved((value) => !value); }
    catch (requestError) { setSaveError(requestError.message); }
    finally { setSaving(false); }
  };
  const changeStatus = (value) => setHiringStatus({ isOpen: value === "open" }).then(() => loadJob()).catch(() => {});

  if (authLoading) return <BarLoader width="100%" color="hsl(var(--primary))" />;

  return <div className="grid gap-6">
    {loading && <BarLoader width="100%" color="hsl(var(--primary))" />}
    {error && <p role="alert" className="rounded-xl border bg-card p-5 text-destructive">{error.message}</p>}
    {statusError && <p role="alert" className="text-destructive">{statusError.message}</p>}
    {job && <>
      <section className="brand-panel overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-primary/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold ring-1 ring-white/25">{(job.company?.name || "H").charAt(0)}</div><div><p className="flex items-center gap-2 text-sm font-semibold text-white/75"><Building2 aria-hidden="true" className="h-4 w-4" />{job.company?.name || "Hiring company"}</p><h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">{job.title}</h1><div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-white/15 px-3 py-1.5"><MapPin aria-hidden="true" className="mr-1 inline h-4 w-4" />{job.location}</span><span className="rounded-full bg-white/15 px-3 py-1.5"><BriefcaseBusiness aria-hidden="true" className="mr-1 inline h-4 w-4" />{job.employment_type.replaceAll("_", " ")}</span><span className="rounded-full bg-emerald-300/20 px-3 py-1.5"><Radio aria-hidden="true" className="mr-1 inline h-4 w-4" />{job.status === "published" ? "Actively hiring" : "Hiring closed"}</span></div></div></div>
          {user?.role === "candidate" && <div className="flex flex-wrap gap-3 lg:justify-end"><Button variant="secondary" disabled={saving} onClick={toggleSaved}>{saving ? "Saving…" : saved ? "Remove saved job" : "Save job"}</Button><ApplyJobDrawer dataJob={job} user={user} fetchJob={loadJob} applied={myApplications?.items?.some((application) => application.job_id === job.id)} checkingApplication={checkingApplication} /></div>}
        </div>
      </section>

      {user?.role === "candidate" && <AtsMatchCard jobId={job.id} />}
      {myApplicationsError && user?.role === "candidate" && <p className="text-xs text-muted-foreground">Application status could not be checked; the server will still prevent duplicate applications.</p>}
      {saveError && <p role="alert" className="text-destructive">{saveError}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card><CardHeader><CardTitle className="text-2xl">About this opportunity</CardTitle></CardHeader><CardContent className="space-y-8"><div><h2 className="font-semibold">Job description</h2><p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">{job.description}</p></div><div><h2 className="font-semibold">Skills and requirements</h2>{job.skills?.length ? <ul className="mt-3 flex flex-wrap gap-2">{job.skills.map((skill) => <li key={skill} className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground">{skill}</li>)}</ul> : <p className="mt-2 text-muted-foreground">No listed requirements.</p>}</div></CardContent></Card>
        <aside className="grid gap-4 lg:sticky lg:top-24"><Card><CardHeader><CardTitle>Role snapshot</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm"><p className="flex gap-3"><BriefcaseBusiness aria-hidden="true" className="h-5 w-5 text-primary" /><span><strong className="block">Experience</strong><span className="text-muted-foreground">{job.min_experience}–{job.max_experience ?? job.min_experience}+ years</span></span></p><p className="flex gap-3"><IndianRupee aria-hidden="true" className="h-5 w-5 text-primary" /><span><strong className="block">Salary range</strong><span className="text-muted-foreground">{formatSalary(job.min_salary, job.max_salary)}</span></span></p><p className="flex gap-3"><CalendarDays aria-hidden="true" className="h-5 w-5 text-primary" /><span><strong className="block">Apply by</strong><span className="text-muted-foreground">{job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : "Open until filled"}</span></span></p></CardContent></Card>
          {(user?.role === "hr" || user?.role === "admin") && <Card><CardHeader><CardTitle>Recruiting controls</CardTitle></CardHeader><CardContent><Select disabled={changingStatus} onValueChange={changeStatus}><SelectTrigger><SelectValue placeholder={`Hiring is ${job.status === "published" ? "open" : "closed"}`} /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="open">Open hiring</SelectItem><SelectItem value="closed">Close hiring</SelectItem></SelectGroup></SelectContent></Select><p className="mt-4 flex items-center gap-2 text-sm"><Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />{applications?.total ?? 0} applicants</p></CardContent></Card>}
        </aside>
      </div>

      {(user?.role === "hr" || user?.role === "admin") && <section><h2 className="text-2xl font-bold">Applications</h2>{applicationsLoading && <BarLoader className="my-4" width="100%" color="hsl(var(--primary))" />}{applicationsError && <p role="alert" className="text-destructive">{applicationsError.message}</p>}<div className="mt-4 grid gap-4 md:grid-cols-2">{applications?.items?.length ? applications.items.map((application) => <ApplicationCard key={application.id} application={application} />) : !applicationsLoading && !applicationsError && <p>No applications yet.</p>}</div></section>}
    </>}
  </div>;
}
