import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileUp, RefreshCw, Sparkles, Target, XCircle } from "lucide-react";

import { getAtsScore } from "@/services/apiJobs";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function AtsMatchCard({ jobId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setResult(await getAtsScore({ job_id: jobId })); }
    catch (requestError) { setError(requestError); }
    finally { setLoading(false); }
  }, [jobId]);

  useEffect(() => { checkScore(); }, [checkScore]);

  if (loading) return <Card className="overflow-hidden border-primary/20"><CardContent className="flex min-h-40 items-center gap-3 p-6" role="status"><Sparkles aria-hidden="true" className="animate-pulse text-primary" /><span>Comparing your default resume with this role…</span></CardContent></Card>;

  if (error?.status === 404) return <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-950/40 dark:to-cyan-950/20"><CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center"><span className="rounded-2xl bg-white p-3 text-primary shadow-sm dark:bg-card"><FileUp aria-hidden="true" /></span><div className="flex-1"><h2 className="text-xl font-bold">See how well your resume matches</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Upload a resume and set it as default. TrackHire will compare its skills and language with this job description.</p></div><Button asChild><Link to="/resumes">Add a resume</Link></Button></CardContent></Card>;

  if (error) return <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><p role="alert">Your ATS match could not be calculated. {error.message}</p><Button variant="outline" onClick={checkScore}><RefreshCw aria-hidden="true" />Try again</Button></CardContent></Card>;

  return <Card className="overflow-hidden border-primary/25">
    <div className="bg-gradient-to-r from-violet-100 via-fuchsia-50 to-cyan-50 px-6 py-5 dark:from-violet-950/60 dark:via-fuchsia-950/25 dark:to-cyan-950/25">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2" style={{ background: `conic-gradient(hsl(var(--primary)) ${result.score * 3.6}deg, hsl(var(--muted)) 0deg)` }} aria-label={`ATS match score ${result.score} out of 100`}>
          <div className="grid h-full w-full place-items-center rounded-full bg-card"><span className="text-3xl font-extrabold tabular-nums">{result.score}</span></div>
        </div>
        <div className="flex-1"><p className="flex items-center gap-2 text-sm font-semibold text-primary"><Target aria-hidden="true" className="h-4 w-4" />Resume match</p><h2 className="mt-1 text-2xl font-bold">{result.label}</h2><p className="mt-1 text-sm text-muted-foreground">Using {result.resume.file_name}. This is an explainable estimate, not a hiring decision.</p></div>
        <Button variant="outline" onClick={checkScore}><RefreshCw aria-hidden="true" />Recheck</Button>
      </div>
    </div>
    <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
      <div><h3 className="font-semibold">Skills found</h3><div className="mt-3 flex flex-wrap gap-2">{result.matched_skills.length ? result.matched_skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />{skill}</span>) : <p className="text-sm text-muted-foreground">No explicit required skills were found in the resume.</p>}</div></div>
      <div><h3 className="font-semibold">Skills to strengthen</h3><div className="mt-3 flex flex-wrap gap-2">{result.missing_skills.length ? result.missing_skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"><XCircle aria-hidden="true" className="h-4 w-4" />{skill}</span>) : <p className="text-sm text-muted-foreground">All listed skills appear in your resume.</p>}</div></div>
      <div className="lg:col-span-2"><h3 className="font-semibold">How to improve this match</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">{result.recommendations.map((item) => <li key={item} className="flex gap-2"><Sparkles aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul></div>
    </CardContent>
  </Card>;
}
