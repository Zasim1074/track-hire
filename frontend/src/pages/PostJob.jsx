import AddCompanyDrawer from "@/components/AddCompanyDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCompanies } from "@/services/apiCompanies";
import { postNewJob } from "@/services/apiJobs";
import { useFetch } from "@/services/useFetch";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import z from "zod";

const schema = z.object({
  title: z.string().min(1, { message: "Please add job title" }),
  description: z
    .string()
    .min(200, { message: "Job description is necessary, atleast 200 letters" }),
  location: z.string().min(1, {
    message: "Please provide the jo location, incase remote write remote",
  }),
  company_id: z.string().min(1, { message: "Select or add a new Company" }),
  requirements: z.string().min(50, {
    message: "Role requirements is necessary, atleast 50 letters",
  }),
});

const PostJob = () => {
  const { isLoaded, user } = useUser();
  const [company, setCompany] = useState("");
  const navigate = useNavigate();

  const {
    fn: fnCompanies,
    data: dataCompanies,
    loading: loadingCompanies,
  } = useFetch(getCompanies);

  const {
    fn: fnPostJob,
    data: dataPostJob,
    loading: loadingPostJob,
    error: errorPostJob,
  } = useFetch(postNewJob);

  useEffect(() => {
    if (!isLoaded) return;
    fnCompanies();
  }, [isLoaded]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      location: "",
      company_id: "",
      requirements: "",
      description: "",
      title: "",
    },
    resolver: zodResolver(schema),
  });

  // const onSubmit = (dataJob) => {
  //   fnPostJob({ ...dataJob, recruiter_id: user.id, isOpen: true });
  // };

  const onSubmit = (dataJob) => {
    fnPostJob({
      ...dataJob,
      recruiter_id: user.id,
      isOpen: true,
    });
  };

  useEffect(() => {
    if (dataPostJob?.length > 0) {
      navigate("/jobs");
    }
  }, [dataPostJob]);

  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to={"/jobs"} />;
  }

  return (
    <div>
      <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">
        Post a New Job
      </h1>

      {!isLoaded ||
        (loadingCompanies && (
          <BarLoader className="mb-4" width={"100%"} color="#85D055" />
        ))}

      {isLoaded && !loadingCompanies && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 pb-0"
        >
          <Input placeholder="Job Title" {...register("title")} />
          {errors.title && (
            <p className="text-red-500">{errors.title.message}</p>
          )}

          <Textarea
            placeholder="Job Description"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-red-500">{errors.description.message}</p>
          )}

          <div className="flex sm:flex-row flex-col justify-between w-[100%] sm:gap-4">
            <div className="flex flex-1 flex-col gap-2 ">
              <Input placeholder="Location" {...register("location")} />
              {errors.location && (
                <p className="text-red-500">{errors.location.message}</p>
              )}
            </div>

            <div className="flex flex-1  flex-col gap-2 ">
              <div className="flex flex-row gap-2 w-full">
                <Controller
                  name="company_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-full gap-4 text-wrap">
                        <SelectValue placeholder="Select Company " />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {!loadingCompanies && !dataCompanies?.length && (
                            <SelectItem disabled value="none">
                              No Companies
                            </SelectItem>
                          )}
                          {dataCompanies?.map((company) => (
                            <SelectItem
                              value={company.id.toString()}
                              key={company.id}
                            >
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <AddCompanyDrawer fetchCompanies={fnCompanies} />
              </div>
              {errors.company_id && (
                <p className="text-red-500">{errors.company_id.message}</p>
              )}
            </div>
          </div>

          <Controller
            name="requirements"
            control={control}
            render={({ field }) => (
              <MDEditor value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.requirements && (
            <p className="text-red-500">{errors.requirements.message}</p>
          )}

          {loadingPostJob && (
            <BarLoader className="mb-4" width={"100%"} color="#85D055" />
          )}

          {errorPostJob && (
            <p className="text-red-500 mt-2">
              {errorPostJob.message || "Failed to post job"}
            </p>
          )}

          <Button
            type="submit"
            variant="blue"
            className="mt-2"
            size="lg"
            disabled={loadingPostJob || loadingCompanies || !isLoaded}
          >
            Submit
          </Button>
        </form>
      )}
    </div>
  );
};

export default PostJob;
