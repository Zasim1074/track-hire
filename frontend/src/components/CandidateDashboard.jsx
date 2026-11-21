import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CheckCircle2, Clock3, Search } from "lucide-react";
import { getAppliedJobs } from "@/services/apiApplications";
import { getJobPage } from "@/services/apiJobs";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import PageHeader from "./PageHeader";

const inProgress = new Set(["applied", "screening", "shortlisted", "interview_scheduled", "interviewed"]);

export default function CandidateDashboard() {
  const [applications, setApplications] = useState([]); const [jobs, setJobs] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; Promise.all([getAppliedJobs(), getJobPage({ page_size: 4 })]).then(([appData, jobData]) => { if (active) { setApplications(appData.items || []); setJobs(jobData.items || []); } }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const metrics = useMemo(() => [
    ["Total applications", applications.length, BriefcaseBusiness, "All submitted applications"],
    ["In progress", applications.filter((item) => inProgress.has(item.status)).length, Clock3, "Active hiring processes"],
    ["Shortlisted", applications.filter((item) => item.status === "shortlisted").length, CheckCircle2, "Applications moved forward"],
    ["Interviews", applications.filter((item) => item.status === "interview_scheduled").length, CalendarClock, "Scheduled from applications"],
  ], [applications]);
  return <section>
    <PageHeader eyebrow="Candidate overview" title="Your job search, at a glance" description="Follow active applications and discover recently published opportunities." action={<Button asChild><Link to="/jobs"><Search aria-hidden="true" />Find jobs</Link></Button>} />
    {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load dashboard data: {error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon, help]) => <Card key={label} className="shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{loading ? "—" : value}</p></div><span className="rounded-lg bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon aria-hidden="true" className="h-5 w-5" /></span></div><p className="mt-3 text-xs text-muted-foreground">{help}</p></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
      <Card className="shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">Recent applications</h2><p className="mt-1 text-sm text-muted-foreground">Latest changes in your pipeline</p></div><Button asChild variant="ghost"><Link to="/my-applications">View all<ArrowUpRight aria-hidden="true" /></Link></Button></div><div className="divide-y">{applications.slice(0, 5).map((item) => <Link key={item.id} to="/my-applications" className="flex min-h-16 items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50"><div><p className="font-medium">Application</p><p className="text-xs text-muted-foreground">Submitted {new Date(item.applied_at).toLocaleDateString()}</p></div><span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold capitalize">{item.status.replaceAll("_", " ")}</span></Link>)}{!loading && !applications.length && <div className="p-8 text-center"><p className="font-medium">No applications yet</p><p className="mt-1 text-sm text-muted-foreground">Your submitted applications will appear here.</p></div>}</div></Card>
      <Card className="shadow-sm"><div className="border-b p-5"><h2 className="font-semibold">Recently published</h2><p className="mt-1 text-sm text-muted-foreground">Live jobs from the platform</p></div><div className="divide-y">{jobs.map((job) => <Link key={job.id} to={`/jobs/${job.id}`} className="block p-4 hover:bg-muted/50"><p className="font-medium">{job.title}</p><p className="mt-1 text-xs text-muted-foreground">{job.location} · {job.work_mode?.replaceAll("_", " ")}</p></Link>)}</div></Card>
    </div>
  </section>;
}
