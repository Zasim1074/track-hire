import { supabaseUrl } from "@/utils/supabase";

export async function getCompanies(supabase) {
  let query = supabase.from("companies").select("*");
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Companies:", error);
    throw error;
  }

  return data;
}

export async function addNewCompany(supabase, dataCompany) {
  const file = dataCompany.logo;

  const random = Math.floor(Math.random() * 100000);
  const filename = `logo_${random}_${file.name}`;

  const { error: errorStorage } = await supabase.storage
    .from("company-logo")
    .upload(filename, file);

  if (errorStorage) {
    console.error("Error uploading company logo:", errorStorage);
    throw errorStorage;
  }

  const logo_url = `${supabaseUrl}/storage/v1/object/public/company-logo/${filename}`;

  const { data, error } = await supabase
    .from("companies")
    .insert([{ name: dataCompany.name, logo_url }])
    .select()
    .single();

  if (error) {
    console.error("Error creating company:", error);
    throw error;
  }

  return data;
}
