import { supabase } from "./supabase";

export type MemberRow = {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  university: string;
  university_year: number;
  gender: string;
  created_at: string;

  degrees: string[];
  majors: string[];
};

export function mapYearLevel(year: number | null) {
  if (!year) return "Unknown";
  if (year >= 5) return "5+";
  return `Year ${year}`;
}

export function groupBy(
  rows: MemberRow[],
  key: keyof MemberRow,
): { name: string; value: number }[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const value = row[key];

    if (Array.isArray(value)) {
      for (const v of value) {
        map.set(v, (map.get(v) ?? 0) + 1);
      }
      continue;
    }

    if (value === null || value === undefined) continue;

    const label = value ?? "Unknown";
    map.set(String(label), (map.get(String(label)) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}

export async function fetchMemberRegistry(): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from("member_registry")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMemberRegistry failed:", error);
    throw error;
  }

  return data ?? [];
}
