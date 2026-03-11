import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFetch } from "@/services/useFetch";
import { applyToJob } from "@/services/apiApplications";

const schema = z.object({
  experience: z
    .number()
    .min(0, { message: "Experience must be at least 0" })
    .int(),
  skills: z.string().min(1, { message: "Skills are required" }),
  education: z.enum(["diploma", "graduate", "post-graduate"], {
    message: "Please choose your education",
  }),
  degree: z.string().min(1, {
    message: "Please specify your degree and specialization if applicable",
  }),
  resume: z.any().refine((files) => {
    const file = files?.[0];
    if (!file) return false;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    return allowed.includes(file.type);
  }, "Only PDF or DOC/DOCX allowed"),
  location: z.enum(
    [
      "I'm already there",
      "Not there, but moving to / will relocate if hired",
      "I am not comfortable with this location.",
    ],
    {
      message: "Please select your location preference",
    },
  ),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms",
  }),
});

const ApplyJobDrawer = ({ dataJob, user, fetchJob, applied = false }) => {
  const [open, setOpen] = React.useState(false);
  const {
    loading: loadingApply,
    error: errorApply,
    fn: fnApply,
  } = useFetch(applyToJob);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { education: "diploma", location: "moved", terms: false },
  });

  const onSubmit = (formData) => {
    console.log("Form Data:", formData);
    // TODO: Submit application with formData
    fnApply({
      ...formData,
      job_id: dataJob.id,
      candidate_id: user.id,
      name: user.fullName,
      status: "applied",
      resume: formData?.resume[0],
    }).then(() => {
      fetchJob();
      reset();
      setOpen(false);
    });
  };

  return (
    <Drawer open={applied ? false : undefined} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          variant={dataJob.isOpen ? "blue" : "destructive"}
          disabled={!dataJob?.isOpen || applied}
        >
          {dataJob.isOpen ? (applied ? "Applied" : "Apply") : "Hiring Closed"}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="mx-auto w-[95vw] sm:w-[85vw] md:w-[70vw] px-10">
        <DrawerHeader className="pb-5">
          <DrawerTitle>
            Apply for {dataJob?.title} at {dataJob?.company?.name}
          </DrawerTitle>
          <DrawerDescription>Please fill the form below</DrawerDescription>
        </DrawerHeader>
        {/* =============== Form Start ========================= */}
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <form
            className="flex flex-col gap-7 px-5 pb-0"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-1">
              <Input
                {...register("experience", { valueAsNumber: true })}
                type="number"
                placeholder="years of experience"
                className="flex-1 py-2"
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Input
                {...register("skills")}
                name="skills"
                type="text"
                placeholder="skills (comma separated)"
                className="flex-1 py-2"
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3>Highest Education:</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="pl-2"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="diploma" id="diploma" />
                      <Label htmlFor="diploma">Diploma</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="graduate" id="graduate" />
                      <Label htmlFor="graduate">Graduate</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="post-graduate"
                        id="post-graduate"
                      />
                      <Label htmlFor="post-graduate">Post Graduate</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Input
                {...register("degree")}
                type="text"
                placeholder="Degree (specialization)"
                className="flex-1 py-2"
              />
              {errors.degree && (
                <p className="text-sm text-red-500">{errors.degree.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Input
                {...register("resume")}
                type="file"
                accept=".pdf, .doc, .docx"
                className="flex-1 file:text-gray-500 py-4 hover:cursor-pointer"
                placeholder="upload resume"
              />
              {errors.resume && (
                <p className="text-sm text-red-500">{errors.resume.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="">This Job is in {dataJob?.location}.</h3>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="pl-2"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="I'm already there"
                        id="I'm already there"
                      />
                      <Label htmlFor="I'm already there">
                        I'm already there
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="Not there, but moving to / will relocate if hired"
                        id="Not there, but moving to / will relocate if hired"
                      />
                      <Label htmlFor="Not there, but moving to / will relocate if hired">
                        Not there, but moving to / will relocate if hired
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="I am not comfortable with this location"
                        id="I am not comfortable with this location"
                      />
                      <Label htmlFor="I am not comfortable with this location">
                        I am not comfortable with this location
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.location && (
                <p className="text-sm text-red-500">
                  {errors.location.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-3 p-0">
                <Input
                  {...register("terms")}
                  type="checkbox"
                  id="terms"
                  className="bg-tranparent h-5 w-5 hover:cursor-pointer"
                />
                <Label htmlFor="terms">
                  I accept all the information provided above is correct.
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-500">{errors.terms.message}</p>
              )}
            </div>

            <div className="flex flex-row sm:flex-col items-center w-full gap-5 mb-5">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                variant={dataJob.isOpen ? "blue" : "destructive"}
                disabled={loadingApply || !dataJob?.isOpen || applied}
              >
                {loadingApply ? "Submitting..." : applied ? "Applied" : "Apply"}
              </Button>
              {errorApply?.message && (
                <p className="text-sm text-red-500">{errorApply?.message}</p>
              )}

              <DrawerClose asChild>
                <Button className="w-full" size="lg" variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
            </div>
          </form>
        </div>
        {/* =============== Form End ========================= */}
      </DrawerContent>
    </Drawer>
  );
};

export default ApplyJobDrawer;
