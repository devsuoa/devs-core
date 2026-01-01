import { supabase } from "./supabase";

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";
export type University = "UOA" | "AUT" | "Other";

export type SignupPayload = {
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  university: University;
  universityYear: number;
  upi?: string | null;
  studentId: number;

  degrees: {
    degreeId: string;
    majorIds: string[];
  }[];
};

export async function signupMember(payload: SignupPayload) {
  const {
    email,
    firstName,
    lastName,
    gender,
    university,
    universityYear,
    upi,
    studentId,
    degrees,
  } = payload;

  if (!degrees || degrees.length === 0) {
    throw new Error("No degrees provided");
  }

  
  
  const { error: memberError } = await supabase.from("members").insert({
    email,
    first_name: firstName,
    last_name: lastName,
    gender,
    university,
    university_year: universityYear,
    upi: upi || null,
    student_id: studentId,
  });
  
  if (memberError) {
    return {status: false, error: memberError};
  }

  try {
    const uniqueDegreeIds = Array.from(
      new Set(degrees.map((d) => d.degreeId))
    );

    const studentDegreeRows = uniqueDegreeIds.map((degreeId) => ({
      student_id: studentId,
      degree_id: degreeId,
    }));

    const { error: degreeError } = await supabase
      .from("student_degree")
      .upsert(studentDegreeRows, {
        onConflict: "student_id,degree_id",
      });

    if (degreeError) {
      return {status: false, error: degreeError}
    }

    const seen = new Set<string>();

    const studentMajorRows = degrees.flatMap((d) =>
      d.majorIds
        .filter((majorId) => {
          const key = `${d.degreeId}:${majorId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((majorId) => ({
          student_id: studentId,
          degree_id: d.degreeId,
          major_id: majorId,
        }))
    );

    if (studentMajorRows.length > 0) {
      const { error: majorError } = await supabase
        .from("student_major")
        .upsert(studentMajorRows, {
          onConflict: "student_id,degree_id,major_id",
        });

      if (majorError){
        return {status: false, error: majorError} 
      } 
    }

    return {status: true, error: null}
  } catch (err) {
    await supabase.from("members").delete().eq("student_id", studentId);
    return { status: false, error: err};  
  }
}
