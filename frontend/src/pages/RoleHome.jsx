import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { useAuth } from "@/auth/AuthContext";
import { getMyCompany } from "@/services/apiCompanies";
import { getPostedJobs } from "@/services/apiApplications";
import CompanySetupForm from "@/components/CompanySetupForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { BriefcaseBusiness, Plus, Radio } from "lucide-react";

export default function RoleHome() {
  const { user } = useAuth();
  const [company, setCompany] = useState(undefined);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (user?.role !== "hr") return;
    let active = true;
    getMyCompany().then(async (currentCompany) => {
      if (!active) return;
      setCompany(currentCompany);
      if (currentCompany) {
        const response = await getPostedJobs();
        if (active) { setJobs(response.items || []); setTotalJobs(response.total || 0); }
      }
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.role, retry]);

  if (user?.role === "candidate") return <Navigate to="/my-applications" replace />;
  if (user?.role === "admin") return <Navigate to="/my-jobs" replace />;
  if (user?.role !== "hr") return <Navigate to="/unauthorized" replace />;
  if (loading) return <BarLoader className="mb-4" width="100%" color="#85D055" />;
  if (error) return <div role="alert" className="rounded-lg border p-6"><p className="text-red-500">Unable to load your recruiter dashboard: {error}</p><Button className="mt-3" variant="outline" onClick={() => { setError(""); setLoading(true); setRetry((value) => value + 1); }}>Try again</Button></div>;
  if (!company) return <CompanySetupForm onCreated={async (created) => {
    setCompany(created);
    setError("");
    try { const response = await getPostedJobs(); setJobs(response.items || []); setTotalJobs(response.total || 0); }
    catch (err) { setError(err.message); }
  }} />;

  return <main>
    <PageHeader eyebrow="Recruiter dashboard" title={company.name} description="A live overview of your company’s job pipeline." action={<Button asChild><Link to="/post-job"><Plus aria-hidden="true" />Post a job</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Total jobs</CardTitle><BriefcaseBusiness aria-hidden="true" className="text-muted-foreground" /></CardHeader><CardContent><p className="text-4xl font-bold tabular-nums">{totalJobs}</p><p className="mt-2 text-sm text-muted-foreground">Draft, published, and closed roles</p></CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Currently hiring</CardTitle><Radio aria-hidden="true" className="text-emerald-600" /></CardHeader><CardContent><p className="text-4xl font-bold tabular-nums">{jobs.filter((job) => job.status === "published" && job.is_active).length}</p><p className="mt-2 text-sm text-muted-foreground">Published roles accepting applications{totalJobs > jobs.length ? " in the latest 100 jobs" : ""}</p></CardContent></Card>
    </div>
    <Card className="mt-6"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Manage your recruitment pipeline</h2><p className="mt-1 text-sm text-muted-foreground">Open a job to review candidates, schedule interviews, and record decisions.</p></div><Button asChild variant="outline"><Link to="/my-jobs">Manage jobs and applicants</Link></Button></CardContent></Card>
  </main>;
}
