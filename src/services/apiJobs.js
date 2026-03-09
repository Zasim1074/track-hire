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

export const getSavedJobs = async (supabase, { alreadySaved }, saveData) => {
  if (alreadySaved) {
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (deleteError) {
      console.error(`Error while deleting job : ${deleteError}`);
      return null;
    }
    return data;
  } else {
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (insertError) {
      console.error(`Error while saving job : ${insertError}`);
      return null;
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

export const getHiringStatus = async (supabase, { job_id }, isOpen) => {
  const { data, error: jobError } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .single();

  if (jobError) {
    console.error(`Error while updating job : ${jobError}`);
    return null;
  }
  return data;
};
