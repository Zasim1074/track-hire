import supabaseClient from "@/utils/supabase";

export const getJobs = async (token, { location, company, searchQuery }) => {
  const supabase = await supabaseClient(token);

  let query = supabase
    .from("jobs")
    .select("*, company:companies(name, logo_url), saved: saved_jobs(id)");

    // Todo: company : returns null | problem | here | correct it

  if (location) {
    query = query.eq("location", location);
  }
  if (company) {
    query = query.eq("company", company);
  }
  if (searchQuery) {
    query = query.eq("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.log("error while fetching jobs: " + error);
    return error;
  }

  return data;
};
