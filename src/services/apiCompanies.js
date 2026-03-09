export async function getCompanies(supabase) {
  let query = supabase.from("companies").select("*");
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Companies:", error);
    throw error;
  }

  return data;
}
