export const getJobs = async (supabase, { location, company, searchQuery }) => {
  let query = supabase
    .from("jobs")
    .select("*, company:companies(name, logo_url), saved: saved_jobs(id)");

  if (location) {
    query = query.eq("location", location);
  }
  if (company) {
    query = query.eq("company_id", company);
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

export const getSavedJobs = async (
  supabase,
  { alreadySaved, user_id, job_id },
) => {
  if (alreadySaved) {
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", job_id);

    if (deleteError) {
      console.error(`Error while deleting job : ${deleteError}`);
      throw deleteError;
    }
    return data;
  } else {
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([{ user_id, job_id }])
      .select();

    if (insertError) {
      console.error(`Error while saving/removing job : ${insertError}`);
      throw insertError;
    }
    return data;
  }
};

export const getSingleJob = async (supabase, { job_id }) => {
  const { data, error: jobError } = await supabase
    .from("jobs")
    .select(
      "*, company:companies(name, logo_url), applications:applications(*)",
    )
    .eq("id", job_id)
    .single();

  if (jobError) {
    console.error(`Error while fetching job : ${jobError}`);
    return null;
  }
  return data;
};

export const getHiringStatus = async (supabase, { job_id, isOpen }) => {
  const { data, error } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .select() // REQUIRED
    .single();

  if (error) {
    console.error("Error while updating hiring status:", error);
    throw error;
  }

  return data;
};

export const postNewJob = async (supabase, dataJob) => {
  console.log(`DATA RECIEVED: ${dataJob}`);

  const { data, error } = await supabase
    .from("jobs")
    .insert([dataJob])
    .select();

  if (error) {
    console.error("Error while posting job:", error);
    throw error;
  }

  return data;
};

export const fetchSavedJobs = async (supabase) => {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job:jobs(*, company:companies(name, logo_url))");

  if (error) {
    console.error(`Error while fetching saved job : ${error}`);
    throw error;
  }
  return data;
};

export const deleteJob = async (supabase, { job_id }) => {
  const { data, error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (error) {
    console.error(`Error while deleting job : ${error}`);
    throw error;
  }
  return data;
};
