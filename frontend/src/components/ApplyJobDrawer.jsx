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
import { deleteResume, uploadResume } from "@/services/apiResumes";

const schema = z.object({
  resume: z.any().refine((files) => Boolean(files?.[0]), "Choose a resume")
    .refine((files) => [".pdf", ".doc", ".docx"].includes(`.${files?.[0]?.name.split(".").pop().toLowerCase()}`), "Only PDF, DOC, or DOCX files are supported")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, "Resume must be 5 MB or smaller"),
  cover_letter: z.string().optional(),
  terms: z.boolean().refine(Boolean, "Please confirm your application information is accurate"),
});

export default function ApplyJobDrawer({ dataJob, fetchJob, applied = false }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { cover_letter: "", terms: false } });

  const submit = async (values) => {
    setLoading(true); setError("");
    let resume;
    try {
      resume = await uploadResume(values.resume[0]);
      await applyToJob({ job_id: dataJob.id, resume_id: resume.id, cover_letter: values.cover_letter });
      await fetchJob(); reset(); setOpen(false);
    } catch (err) {
      if (resume?.id) await deleteResume(resume.id).catch(() => {});
      setError(err.message);
    } finally { setLoading(false); }
  };

  return <Drawer open={open} onOpenChange={setOpen}>
    <DrawerTrigger asChild><Button size="lg" variant="blue" disabled={dataJob?.status !== "published" || applied}>{applied ? "Applied" : dataJob?.status === "published" ? "Apply" : "Hiring Closed"}</Button></DrawerTrigger>
    <DrawerContent className="mx-auto w-[95vw] px-8 sm:w-[80vw] md:w-[70vw]">
      <DrawerHeader><DrawerTitle>Apply for {dataJob.title}</DrawerTitle><DrawerDescription>Upload your resume and add an optional cover letter.</DrawerDescription></DrawerHeader>
      <form className="grid gap-4 overflow-y-auto px-5 pb-5" onSubmit={handleSubmit(submit)}>
        <div><Label htmlFor="resume-file">Resume (PDF, DOC, or DOCX; max 5 MB)</Label><Input id="resume-file" type="file" accept=".pdf,.doc,.docx" {...register("resume")} />{errors.resume && <p className="text-sm text-red-500">{errors.resume.message}</p>}</div>
        <div><Label htmlFor="cover-letter">Cover letter (optional)</Label><Textarea id="cover-letter" {...register("cover_letter")} /></div>
        <div className="flex items-center gap-2"><Input id="terms" type="checkbox" className="h-4 w-4" {...register("terms")} /><Label htmlFor="terms">I confirm my application information is accurate.</Label></div>
        {errors.terms && <p className="text-sm text-red-500">{errors.terms.message}</p>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3"><Button type="submit" variant="blue" disabled={loading}>{loading ? "Submitting…" : "Submit application"}</Button><DrawerClose asChild><Button type="button" variant="outline">Cancel</Button></DrawerClose></div>
      </form>
    </DrawerContent>
  </Drawer>;
}
