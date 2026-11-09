import { api } from "./api";

export type DegreeOrMajor = {
  id: string;
  name: string;
};

export async function fetchDegrees(excludeIds: string[] = []): Promise<DegreeOrMajor[]> {
  const degrees = await api<DegreeOrMajor[]>("/api/degrees");
  return degrees.filter((d) => !excludeIds.includes(d.id));
}

export async function fetchMajorsForDegree(
  degreeId: string,
  excludeIds: string[] = [],
): Promise<DegreeOrMajor[]> {
  const majors = await api<DegreeOrMajor[]>(`/api/degrees/${encodeURIComponent(degreeId)}/majors`);
  return majors.filter((m) => !excludeIds.includes(m.id));
}
