export const applyToJob = async (supabase, { location, company, searchQuery }) => {


    const random = Math.floor(Math.random() * 99999);
    const filename= `resume_${random}_${jobData.candidate_id}`



  let query = supabase
    .from("jobs")
    .select("*, company:companies(name, logo_url), saved: saved_jobs(id)");

  if (location) {
    query = query.eq("location", location);
  }
  if (company) {
    query = query.eq("company", company);
  }
  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }

  return data;
};
