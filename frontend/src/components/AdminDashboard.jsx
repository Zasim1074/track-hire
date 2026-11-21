import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Building2, CheckCircle2, ExternalLink } from "lucide-react";
import { getCompanies } from "@/services/apiCompanies";
import { getJobPage } from "@/services/apiJobs";
import PageHeader from "./PageHeader";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export default function AdminDashboard() {
  const [companies, setCompanies] = useState([]); const [jobs, setJobs] = useState({ items: [], total: 0 }); const [error, setError] = useState("");
  useEffect(() => { let active = true; Promise.all([getCompanies(), getJobPage({ page_size: 5 })]).then(([companyData, jobData]) => { if (active) { setCompanies(companyData); setJobs(jobData); } }).catch((err) => active && setError(err.message)); return () => { active = false; }; }, []);
  const verified = companies.filter((company) => company.is_verified).length;
  return <section><PageHeader eyebrow="Platform administration" title="Platform overview" description="Operational visibility using the company and job data currently available to administrators." />
    {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load platform data: {error}</div>}
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Companies" value={companies.length} icon={Building2} /><Metric label="Verified companies" value={verified} icon={CheckCircle2} /><Metric label="Jobs" value={jobs.total || 0} icon={BriefcaseBusiness} /></div>
    <Card className="mt-6 shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">Recently published jobs</h2><p className="mt-1 text-sm text-muted-foreground">Latest platform job records</p></div><Button asChild variant="outline"><Link to="/jobs">View jobs</Link></Button></div><div className="divide-y">{jobs.items?.map((job) => <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"><div><p className="font-medium">{job.title}</p><p className="mt-1 text-xs text-muted-foreground">{job.location} · {job.status}</p></div><ExternalLink aria-hidden="true" className="h-4 w-4 text-muted-foreground" /></Link>)}</div></Card>
  </section>;
}
function Metric({ label, value, icon: Icon }) { return <Card className="shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></div><span className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon aria-hidden="true" /></span></CardContent></Card>; }
