import { supabase } from "./supabase";

export type DegreeOrMajor = {
  id: string;
  name: string;
};

export async function fetchDegrees(
  excludeIds: string[] = []
): Promise<DegreeOrMajor[]> {
  const { data, error } = await supabase
    .from("degrees")
    .select("id, name")
    .order("name");

  if (error) {
    throw error;
  }

  return (
    data
      ?.filter((d) => !excludeIds.includes(d.id))
      ?? []
  );
}

export async function fetchMajorsForDegree(
  degreeId: string,
  excludeIds: string[] = []
): Promise<DegreeOrMajor[]> {
  const { data, error } = await supabase
    .from("degree_major")
    .select(`
        majors!degree_major_major_id_fkey (
          id,
          name
        )
      `)
    .eq("degree_id", degreeId);

  if (error) throw error;

  return (
    data
      ?.map((row: any) => row.majors)
      .filter(
        (m): m is DegreeOrMajor =>
          Boolean(m) && !excludeIds.includes(m.id)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? []
  );  
}
