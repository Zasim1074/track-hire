import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CompanySetupForm from "@/components/CompanySetupForm";
import { useAuth } from "@/auth/AuthContext";
import { getMyCompany } from "@/services/apiCompanies";
import { getSingleJob, postNewJob, updateJob } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";

const optionalInteger = z.preprocess(
  (value) => value === "" || value === undefined ? null : Number(value),
  z.number().int().min(0).nullable(),
);
const requiredInteger = z.preprocess(
  (value) => value === "" || value === undefined ? 0 : Number(value),
  z.number().int().min(0),
);

const schema = z.object({
  title: z.string().trim().min(1, "Please add job title"),
  description: z.string().trim().min(200, "Job description must be at least 200 characters"),
  location: z.string().trim().min(1, "Please provide the job location"),
  work_mode: z.enum(["remote", "hybrid", "onsite"]),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship"]),
  experience_level: z.enum(["entry", "junior", "mid", "senior", "lead"]),
  min_experience: requiredInteger,
  max_experience: optionalInteger,
  min_salary: optionalInteger,
  max_salary: optionalInteger,
  skills: z.string().optional(),
}).superRefine((job, context) => {
  if (job.max_experience !== null && job.max_experience < job.min_experience) {
    context.addIssue({ code: "custom", path: ["max_experience"], message: "Maximum experience must be at least the minimum" });
  }
  if (job.min_salary !== null && job.max_salary !== null && job.max_salary < job.min_salary) {
    context.addIssue({ code: "custom", path: ["max_salary"], message: "Maximum salary must be at least the minimum" });
  }
});

export default function PostJob() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingJobId = searchParams.get("job_id");
  const [company, setCompany] = useState(undefined);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");

  const {
    fn: fnPostJob,
    data: dataPostJob,
    loading: loadingPostJob,
    error: errorPostJob,
  } = useFetch(postNewJob);
  const {
    fn: fnJob,
    data: currentJob,
    loading: loadingJob,
    error: errorJob,
  } = useFetch(getSingleJob, { job_id: editingJobId });
  const {
    fn: fnUpdateJob,
    data: dataUpdatedJob,
    loading: loadingUpdateJob,
    error: errorUpdateJob,
  } = useFetch(updateJob);
  const isSubmitting = loadingPostJob || loadingUpdateJob;

  useEffect(() => {
    if (authLoading || !["hr", "admin"].includes(user?.role)) return;
    let active = true;
    getMyCompany()
      .then((result) => { if (active) setCompany(result); })
      .catch((error) => { if (active) setCompanyError(error.message); })
      .finally(() => { if (active) setCompanyLoading(false); });
    return () => { active = false; };
  }, [authLoading, user?.role]);

  useEffect(() => {
    if (editingJobId) fnJob().catch(() => {});
  }, [editingJobId, fnJob]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "", location: "", work_mode: "onsite", skills: "",
      employment_type: "full_time", experience_level: "entry", min_experience: 0,
      max_experience: "", min_salary: "", max_salary: "",
    },
  });

  useEffect(() => {
    if (!currentJob) return;
    for (const field of [
      "title", "description", "location", "work_mode", "employment_type",
      "experience_level", "min_experience", "max_experience", "min_salary", "max_salary",
    ]) setValue(field, currentJob[field] ?? (field === "min_experience" ? 0 : ""));
    setValue("skills", (currentJob.skills || []).join(", "));
  }, [currentJob, setValue]);

  const onSubmit = (values) => {
    if (editingJobId) {
      fnUpdateJob({
        job_id: editingJobId,
        ...values,
        skills: values.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        application_deadline: currentJob.application_deadline ?? null,
        status: currentJob.status,
        is_active: currentJob.is_active,
      }).catch(() => {});
    } else {
      const { skills, ...jobFields } = values;
      fnPostJob({ ...jobFields, skills: skills.split(",").map((skill) => skill.trim()).filter(Boolean), status: "published" }).catch(() => {});
    }
  };

  useEffect(() => {
    if (dataPostJob?.id) navigate("/jobs");
  }, [dataPostJob, navigate]);
  useEffect(() => {
    if (dataUpdatedJob?.id) navigate("/my-jobs");
  }, [dataUpdatedJob, navigate]);

  if (authLoading) return <BarLoader className="mb-4" width="100%" color="#85D055" />;
  if (user?.role !== "hr" && user?.role !== "admin") return <Navigate to="/jobs" replace />;
  if (companyLoading || (user && !company && company === undefined) || (editingJobId && loadingJob)) return <BarLoader className="mb-4" width="100%" color="#85D055" />;
  if (companyError) return <div role="alert" className="rounded-lg border p-6"><p className="text-red-500">Unable to load your company: {companyError}</p><Button className="mt-3" variant="outline" onClick={() => { setCompanyError(""); setCompanyLoading(true); getMyCompany().then(setCompany).catch((error) => setCompanyError(error.message)).finally(() => setCompanyLoading(false)); }}>Try again</Button></div>;
  if (!company) return <CompanySetupForm onCreated={setCompany} />;

  return (
    <div>
      <h1 className="gradient-title pb-3 text-4xl font-extrabold sm:text-5xl">
        {editingJobId ? "Edit Job" : "Post a New Job"}
      </h1>
      <Card className="mb-4">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Posting for <span className="font-medium text-foreground">{company.name}</span> based on your active company membership.
        </CardContent>
      </Card>
      {errorJob && <p role="alert" className="text-red-500">{errorJob.message}</p>}
      {!editingJobId || currentJob ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-0">
          <div>
            <Input aria-label="Job title" placeholder="Job Title" {...register("title")} />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
          </div>
          <div>
            <Textarea aria-label="Job description" placeholder="Job Description" {...register("description")} />
            {errors.description && <p className="text-red-500">{errors.description.message}</p>}
          </div>
          <div>
            <Input aria-label="Job location" placeholder="Location" {...register("location")} />
            {errors.location && <p className="text-red-500">{errors.location.message}</p>}
          </div>
          <div><Input aria-label="Skills" placeholder="Skills, separated by commas" {...register("skills")} /><p className="text-xs text-muted-foreground">Add skills candidates should have.</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">Work mode
              <select aria-label="Work mode" className="h-10 rounded-md border bg-background px-3" {...register("work_mode")}>
                <option value="onsite">Onsite</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Employment type
              <select aria-label="Employment type" className="h-10 rounded-md border bg-background px-3" {...register("employment_type")}>
                <option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="internship">Internship</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Experience level
              <select aria-label="Experience level" className="h-10 rounded-md border bg-background px-3" {...register("experience_level")}>
                <option value="entry">Entry</option><option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">Minimum experience (years)
              <Input aria-label="Minimum experience" type="number" min="0" {...register("min_experience")} />
              {errors.min_experience && <p className="text-red-500">{errors.min_experience.message}</p>}
            </label>
            <label className="grid gap-1 text-sm">Maximum experience (years)
              <Input aria-label="Maximum experience" type="number" min="0" {...register("max_experience")} />
              {errors.max_experience && <p className="text-red-500">{errors.max_experience.message}</p>}
            </label>
            <label className="grid gap-1 text-sm">Minimum salary
              <Input aria-label="Minimum salary" type="number" min="0" {...register("min_salary")} />
              {errors.min_salary && <p className="text-red-500">{errors.min_salary.message}</p>}
            </label>
            <label className="grid gap-1 text-sm">Maximum salary
              <Input aria-label="Maximum salary" type="number" min="0" {...register("max_salary")} />
              {errors.max_salary && <p className="text-red-500">{errors.max_salary.message}</p>}
            </label>
          </div>
          {isSubmitting && <BarLoader className="mb-4" width="100%" color="#85D055" />}
          {(errorPostJob || errorUpdateJob) && <p role="alert" className="mt-2 text-red-500">{(errorPostJob || errorUpdateJob).message}</p>}
          <Button type="submit" variant="blue" size="lg" disabled={isSubmitting}>
            {editingJobId ? "Save changes" : "Post job"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
