import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BarLoader } from "react-spinners";
import { useFetch } from "@/services/useFetch";
import { updateApplicationStatus, selectApplication, rejectApplication, withdrawApplication, downloadApplicantResume, getApplicationHistory } from "@/services/apiApplications";
import InterviewPanel from "@/components/InterviewPanel";
import { getApplicationInterviews } from "@/services/apiInterviews";
import { useEffect } from "react";

const transitions = {
  applied: ["screening", "rejected"],
  screening: ["shortlisted", "rejected"],
  shortlisted: ["rejected"],
};
const label = (value) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";

export default function ApplicationCard({ application, isCandidate = false }) {
  const [status, setStatus] = useState(application.status);
  const [error, setError] = useState("");
  const { loading, fn: updateStatus } = useFetch(updateApplicationStatus, { application_id: application.id });
  const { loading: decisionLoading, fn: decide } = useFetch(async ({ action, reason }) => action === "select" ? selectApplication(application.id) : rejectApplication(application.id, reason));
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [interviews, setInterviews] = useState(null);
  const [interviewsError, setInterviewsError] = useState("");

  const changeStatus = async (next) => {
    const before = status; setStatus(next); setError("");
    try { await updateStatus({ status: next }); }
    catch (err) { setStatus(before); setError(err.message); }
  };
  const decision = async (action) => {
    const verb = action === "select" ? "select this candidate" : "reject this application";
    if (!window.confirm(`Are you sure you want to ${verb}? This decision may be final.`)) return;
    setError("");
    try { await decide({ action }); setStatus(action === "select" ? "selected" : "rejected"); }
    catch (err) { setError(err.message); }
  };
  const download = async () => {
    setDownloading(true); setError("");
    try {
      const blob = await downloadApplicantResume(application.id);
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = application.resume_file_name || "resume"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.message); }
    finally { setDownloading(false); }
  };
  const withdraw = async () => {
    if (!window.confirm("Withdraw this application? You may not be able to apply again.")) return;
    setError("");
    try { await withdrawApplication(application.id); setStatus("withdrawn"); }
    catch (err) { setError(err.message); }
  };
  const profile = application.profile;
  useEffect(() => {
    if (isCandidate || status !== "interview") return;
    let active = true;
    getApplicationInterviews({ application_id: application.id })
      .then((items) => { if (active) setInterviews(items); })
      .catch((err) => { if (active) setInterviewsError(err.message); });
    return () => { active = false; };
  }, [application.id, isCandidate, status]);
  const loadHistory = async () => {
    try { setHistory(await getApplicationHistory(application.id)); setHistoryError(""); }
    catch (err) { setHistoryError(err.message); }
  };

  return <Card>
    {(loading || decisionLoading) && <BarLoader width="100%" color="#85D055" />}
    <CardHeader className="px-5 pb-2 pt-3">
      <CardTitle className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg">{isCandidate ? "Your application" : application.candidate_name}</span>
        {!isCandidate && <Button variant="outline" size="sm" disabled={downloading} onClick={download}>{downloading ? "Loading…" : `Download ${application.resume_file_name || "resume"}`}</Button>}
      </CardTitle>
      {!isCandidate && <p className="text-sm text-muted-foreground">{application.candidate_email}</p>}
    </CardHeader>
    <CardContent className="space-y-2 px-5 pb-4 text-sm">
      {!isCandidate && profile && <div className="space-y-1">
        {profile.headline && <p className="font-medium">{profile.headline}</p>}
        {profile.location && <p>Location: {profile.location}</p>}
        {profile.experience_years != null && <p>Experience: {profile.experience_years} years</p>}
        {profile.bio && <p>{profile.bio}</p>}
        <div className="flex gap-3">{profile.linkedin_url && <a className="underline" href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}{profile.github_url && <a className="underline" href={profile.github_url} target="_blank" rel="noreferrer">GitHub</a>}{profile.portfolio_url && <a className="underline" href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}</div>
      </div>}
      {application.cover_letter && <p className="whitespace-pre-wrap">{application.cover_letter}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span>Status: {label(status)}</span>
        {application.applied_at && <time className="text-xs text-muted-foreground">Applied {new Date(application.applied_at).toLocaleString()}</time>}
      </div>
      <div><Button size="sm" variant="ghost" onClick={loadHistory}>Load status history</Button>{historyError && <p role="alert" className="text-red-500">{historyError}</p>}{history.length > 0 && <ol className="mt-2 space-y-1 border-l pl-3 text-xs">{history.map((event) => <li key={event.id}>{event.from_status ? `${label(event.from_status)} → ` : ""}{label(event.to_status)} · {new Date(event.created_at).toLocaleString()}{event.notes ? ` · ${event.notes}` : ""}</li>)}</ol>}</div>
      {isCandidate && !["selected", "rejected", "withdrawn"].includes(status) && <Button size="sm" variant="outline" onClick={withdraw}>Withdraw application</Button>}
      {!isCandidate && transitions[status] && <Select value={status} onValueChange={changeStatus}>
        <SelectTrigger aria-label="Application status" className="mt-2 w-48"><SelectValue /></SelectTrigger>
        <SelectContent><SelectGroup>{transitions[status].map((value) => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>}
      {!isCandidate && status === "interview" && <div className="flex flex-wrap gap-2">{interviewsError && <p role="alert" className="text-red-500">Unable to verify interview completion: {interviewsError}</p>}{interviews === null && !interviewsError && <p role="status">Checking interview status…</p>}{interviews?.length > 0 && interviews.every((interview) => interview.status === "completed") && <Button size="sm" variant="blue" disabled={decisionLoading} onClick={() => decision("select")}>Select candidate</Button>}<Button size="sm" variant="destructive" disabled={decisionLoading} onClick={() => decision("reject")}>Reject candidate</Button></div>}
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {status !== "withdrawn" && <InterviewPanel application={{ ...application, status }} onScheduled={() => { setStatus("interview"); setInterviews(null); }} />}
    </CardContent>
  </Card>;
}
