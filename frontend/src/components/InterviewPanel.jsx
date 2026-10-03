import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFetch } from "@/services/useFetch";
import { getApplicationInterviews, interviewAction, scheduleInterview, updateInterview, getInterviewFeedback, submitInterviewFeedback } from "@/services/apiInterviews";

function FeedbackForm({ interview }) {
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getInterviewFeedback(interview.id).then(setFeedback).catch((err) => {
      if (err.status !== 404) setError(err.message);
    });
  }, [interview.id]);
  if (feedback) return <p className="mt-2 text-sm">Feedback submitted: {feedback.recommendation.replaceAll("_", " ")} · {feedback.rating}/5</p>;
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await submitInterviewFeedback(interview.id, {
        rating: Number(data.get("rating")), recommendation: data.get("recommendation"),
        strengths: data.get("strengths") || null, weaknesses: data.get("weaknesses") || null, comments: data.get("comments") || null,
      }); setFeedback(result);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={submit}>
    <select className="h-10 rounded-md border bg-background px-3" name="recommendation" aria-label="Recommendation"><option value="hire">Hire</option><option value="strong_hire">Strong hire</option><option value="no_hire">No hire</option><option value="strong_no_hire">Strong no hire</option></select>
    <Input name="rating" type="number" min="1" max="5" defaultValue="3" aria-label="Rating (1 to 5)" required />
    <Textarea name="strengths" placeholder="Strengths" />
    <Textarea name="weaknesses" placeholder="Areas to improve" />
    <Textarea className="sm:col-span-2" name="comments" placeholder="Additional feedback" />
    {error && <p role="alert" className="text-red-500 sm:col-span-2">{error}</p>}
    <Button className="sm:col-span-2" variant="blue" disabled={saving}>{saving ? "Submitting…" : "Submit feedback"}</Button>
  </form>;
}

export default function InterviewPanel({ application, onScheduled = () => {} }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data: interviews, fn: loadInterviews, loading } = useFetch(getApplicationInterviews);
  const manager = user?.role === "hr" || user?.role === "admin";
  useEffect(() => { loadInterviews({ application_id: application.id }).catch((err) => setError(err.message)); }, [application.id, loadInterviews]);

  const schedule = async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const form = event.currentTarget;
    setBusy(true); setError("");
    try {
      await scheduleInterview(application.id, {
        interviewer_id: user.id,
        scheduled_at: new Date(data.get("scheduled_at")).toISOString(),
        duration_minutes: Number(data.get("duration_minutes")),
        interview_type: data.get("interview_type"), meeting_url: data.get("meeting_url") || null,
        notes: data.get("notes") || null,
      }); form.reset(); onScheduled(); await loadInterviews({ application_id: application.id });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const runAction = async (interview, action) => {
    setBusy(true); setError("");
    try { await interviewAction(interview.id, action); await loadInterviews({ application_id: application.id }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const saveUpdate = async (event, interview) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await updateInterview(interview.id, {
        scheduled_at: new Date(data.get("scheduled_at")).toISOString(),
        duration_minutes: Number(data.get("duration_minutes")),
      });
      setEditing(null); await loadInterviews({ application_id: application.id });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <div className="mt-3 border-t pt-3">
    <h4 className="font-semibold">Interviews</h4>
    {loading && <p role="status">Loading interviews…</p>}
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {interviews?.map((interview) => <div key={interview.id} className="mt-2 rounded-md border p-3 text-sm">
      <p className="font-medium">Round {interview.round_number} · {interview.interview_type} · {interview.status.replaceAll("_", " ")}</p>
      <p>{new Date(interview.scheduled_at).toLocaleString()} · {interview.duration_minutes} minutes</p>
      {interview.meeting_url && <a className="underline" href={interview.meeting_url} target="_blank" rel="noreferrer">Meeting link</a>}
      {manager && interview.status === "scheduled" && <div className="mt-2 flex flex-wrap gap-2">{["complete", "cancel", "no-show"].map((action) => <Button key={action} size="sm" variant="outline" disabled={busy} onClick={() => runAction(interview, action)}>{action === "no-show" ? "Mark no-show" : action}</Button>)}</div>}
      {manager && interview.status === "scheduled" && <Button className="mt-2" size="sm" variant="outline" onClick={() => setEditing(editing === interview.id ? null : interview.id)}>{editing === interview.id ? "Stop editing" : "Update schedule"}</Button>}
      {editing === interview.id && <form className="mt-2 grid gap-2 sm:grid-cols-2" onSubmit={(event) => saveUpdate(event, interview)}>
        <Input name="scheduled_at" type="datetime-local" aria-label="Updated interview date and time" required />
        <Input name="duration_minutes" type="number" min="1" max="480" defaultValue={interview.duration_minutes} aria-label="Updated duration in minutes" required />
        <Button size="sm" variant="blue" disabled={busy}>Save schedule</Button>
      </form>}
      {interview.status === "completed" && interview.interviewer_id === user?.id && <FeedbackForm interview={interview} />}
    </div>)}
    {user?.role === "hr" && ["shortlisted", "interview"].includes(application.status) && <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={schedule}>
      <Input name="scheduled_at" type="datetime-local" aria-label="Interview date and time" min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} required />
      <Input name="duration_minutes" type="number" min="1" max="480" defaultValue="45" aria-label="Duration in minutes" required />
      <select className="h-10 rounded-md border bg-background px-3" name="interview_type"><option value="video">Video</option><option value="phone">Phone</option><option value="onsite">Onsite</option><option value="technical">Technical</option><option value="hr">HR</option></select>
      <Input name="meeting_url" type="url" placeholder="Meeting URL (optional)" />
      <Textarea className="sm:col-span-2" name="notes" placeholder="Interview notes" />
      <Button variant="blue" disabled={busy}>{busy ? "Scheduling…" : interviews?.length ? "Schedule next round" : "Schedule interview"}</Button>
    </form>}
  </div>;
}
