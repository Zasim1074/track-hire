import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { useAuth } from "@/auth/AuthContext";
import { getMyCompany } from "@/services/apiCompanies";
import { getPostedJobs } from "@/services/apiApplications";
import CompanySetupForm from "@/components/CompanySetupForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return <main className="py-5">
    <p className="text-sm text-muted-foreground">Recruiter dashboard</p>
    <h1 className="gradient-title pb-5 text-4xl font-extrabold">{company.name}</h1>
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader><CardTitle>Total jobs</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{totalJobs}</CardContent></Card>
      <Card><CardHeader><CardTitle>Currently hiring</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{jobs.filter((job) => job.status === "published" && job.is_active).length}{totalJobs > jobs.length && <span className="ml-2 text-xs font-normal text-muted-foreground">in latest 100 jobs</span>}</CardContent></Card>
    </div>
    <div className="mt-6 flex flex-wrap gap-3"><Link to="/post-job"><Button variant="blue">Post a job</Button></Link><Link to="/my-jobs"><Button variant="outline">Manage jobs and applicants</Button></Link></div>
  </main>;
}
