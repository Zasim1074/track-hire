import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { applyToJob } from "@/services/apiApplications";
import { getMyResumes, uploadResume } from "@/services/apiResumes";

const schema = z.object({
  resume_id: z.string().optional(),
  resume: z.any().optional(),
  cover_letter: z.string().optional(),
  terms: z.boolean().refine(Boolean, "Please confirm your application information is accurate"),
});

export default function ApplyJobDrawer({ dataJob, fetchJob, applied = false, checkingApplication = false }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resumes, setResumes] = React.useState([]);
  const [resumesLoading, setResumesLoading] = React.useState(false);
  const [resumeError, setResumeError] = React.useState("");
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { cover_letter: "", terms: false, resume_id: "" } });
  const selectedResumeId = watch("resume_id");
  const loadResumes = React.useCallback(async () => {
    setResumesLoading(true);
    setResumeError("");
    try { setResumes(await getMyResumes()); }
    catch (err) { setResumeError(err.message); }
    finally { setResumesLoading(false); }
  }, []);
  React.useEffect(() => {
    if (!open) return;
    loadResumes();
  }, [open, loadResumes]);

  const submit = async (values) => {
    setError("");
    const file = selectedResumeId ? null : values.resume?.[0];
    if (!values.resume_id && !file) { setError("Choose or upload a resume."); return; }
    if (file && !["pdf", "doc", "docx"].includes(file.name.split(".").pop()?.toLowerCase())) { setError("Only PDF, DOC, or DOCX files are supported"); return; }
    if (file && file.size > 5 * 1024 * 1024) { setError("Resume must be 5 MB or smaller"); return; }
    setLoading(true);
    try {
      let resumeId = values.resume_id;
      if (!resumeId && file) {
        const resume = await uploadResume(file);
        resumeId = resume.id;
      }
      if (!resumeId) throw new Error("Choose an existing resume or upload one to continue.");
      await applyToJob({ job_id: dataJob.id, resume_id: resumeId, cover_letter: values.cover_letter });
      await fetchJob(); reset(); setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return <Drawer open={open} onOpenChange={setOpen}>
    <DrawerTrigger asChild><Button size="lg" variant="blue" disabled={dataJob?.status !== "published" || applied || checkingApplication}>{checkingApplication ? "Checking application…" : applied ? "Applied" : dataJob?.status === "published" ? "Apply" : "Hiring Closed"}</Button></DrawerTrigger>
    <DrawerContent className="mx-auto max-h-[90dvh] w-[95vw] overflow-hidden px-4 sm:w-[80vw] sm:px-8 md:w-[70vw]">
      <DrawerHeader className="shrink-0"><DrawerTitle>Apply for {dataJob.title}</DrawerTitle><DrawerDescription>Choose a saved resume or upload one, then add an optional cover letter.</DrawerDescription></DrawerHeader>
      <form className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 pb-5" onSubmit={handleSubmit(submit)}>
        {resumesLoading ? <p role="status">Loading your resumes…</p> : resumeError ? <div className="rounded-md border p-3 text-sm"><p className="text-red-500">Saved resumes couldn’t be loaded: {resumeError}</p><Button className="mt-2" type="button" variant="outline" size="sm" onClick={loadResumes}>Retry</Button></div> : resumes.length > 0 ? <div><Label htmlFor="existing-resume">Use a saved resume</Label><select id="existing-resume" className="h-10 w-full rounded-md border bg-background px-3" {...register("resume_id")}><option value="">Choose a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.file_name}{resume.is_default ? " · Default" : ""}</option>)}</select></div> : <p className="text-sm text-muted-foreground">No saved resumes yet. Upload one below to continue.</p>}
        <div><Label htmlFor="resume-file">Upload a resume (PDF, DOC, or DOCX; max 5 MB)</Label><Input id="resume-file" type="file" accept=".pdf,.doc,.docx" {...register("resume")} disabled={Boolean(selectedResumeId)} />{selectedResumeId && <p className="text-xs text-muted-foreground">Clear the saved resume selection to upload a different file.</p>}</div>
        <div><Label htmlFor="cover-letter">Cover letter (optional)</Label><Textarea id="cover-letter" {...register("cover_letter")} /></div>
        <div className="flex items-center gap-2"><Input id="terms" type="checkbox" className="h-4 w-4" {...register("terms")} /><Label htmlFor="terms">I confirm my application information is accurate.</Label></div>
        {errors.terms && <p className="text-sm text-red-500">{errors.terms.message}</p>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3"><Button type="submit" variant="blue" disabled={loading}>{loading ? "Submitting…" : "Submit application"}</Button><DrawerClose asChild><Button type="button" variant="outline">Cancel</Button></DrawerClose></div>
      </form>
    </DrawerContent>
  </Drawer>;
}
