import { supabaseUrl } from "@/utils/supabase";

export const applyToJob = async (supabase, application) => {
  const random = Math.floor(Math.random() * 99999);
  const filename = `resume_${random}_${Date.now()}`;

  const { error: errorStorage } = await supabase.storage
    .from("resumes")
    .upload(filename, application.resume);

  if (errorStorage) {
    console.error("Upload error:", errorStorage);
    throw errorStorage;
  }

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${filename}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([{ ...application, resume }])
    .select();

  if (error) {
    console.error("Application error:", error);
    throw error;
  }

  return data;
};

export const updateApplicationStatus = async (
  supabase,
  { application_id },
  status,
) => {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", application_id)
    .select();

  if (error) {
    console.error("Error updating application status:", error);
    throw error;
  }

  return data;
};

export const getAppliedJobs = async (supabase, { user_id }) => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(title, company:companies(name))")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }

  return data;
};

export const getPostedJobs = async (supabase, { recruiter_id }) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*,  company:companies(name, logo_url)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }

  return data;
};
