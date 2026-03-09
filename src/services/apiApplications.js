import { supabaseUrl } from "@/utils/supabase";

export const applyToJob = async (supabase, _, jobData) => {
  const random = Math.floor(Math.random() * 99999);
  const filename = `resume_${random}_${jobData.candidate_id}`;

  const { error: errorStorage } = await supabase.storage
    .from("comapnies")
    .upload(filename, jobData.resume);

  if (errorStorage) {
    console.error("Error fetching jobs:", errorStorage);
    throw error;
  }

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${filename}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([{ ...jobData, resume }])
    .select();

  if (error) {
    console.log(`Error submitting appplication : ${error}`);
  }

  return data;
};
