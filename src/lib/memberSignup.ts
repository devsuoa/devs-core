import { api, ApiError } from "./api";

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

/**
 * Joins the society. The API saves the member and their degrees in one transaction.
 * An existing member comes back as `{ status: false, error: { code: "23505" } }`, the shape
 * callers already handle as "already signed up".
 */
export async function signupMember(payload: SignupPayload) {
  if (!payload.degrees || payload.degrees.length === 0) {
    throw new Error("No degrees provided");
  }

  try {
    await api("/api/members", {
      method: "POST",
      body: {
        email: payload.email.trim().toLowerCase(),
        first_name: payload.firstName,
        last_name: payload.lastName,
        gender: payload.gender,
        university: payload.university,
        university_year: payload.universityYear,
        upi: payload.upi || null,
        student_id: payload.studentId,
        degrees: payload.degrees.map((d) => ({ degree_id: d.degreeId, major_ids: d.majorIds })),
      },
    });
    return { status: true, error: null };
  } catch (err) {
    if (err instanceof ApiError && err.code === "already_member") {
      return { status: false, error: { code: "23505", message: err.message } };
    }
    return { status: false, error: err };
  }
}
