import { DegreeBlock } from "../pages/Signup";
import { Gender, signupMember, University } from "./memberSignup";

export async function submitSignupForm(payload: {
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  university: University;
  universityYear: number;
  upi: string | null;
  studentId: number;
  degreeBlocks: DegreeBlock[];
}) {
  const formattedDegrees = payload.degreeBlocks
    .filter((b) => b.degree && b.majors.some(Boolean))
    .map((b) => ({
      degreeId: b.degree!.id,
      majorIds: b.majors.filter(Boolean).map((m) => m!.id),
    }));

  if (formattedDegrees.length === 0) {
    throw new Error("No degrees provided");
  }

  return await signupMember({
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    university: payload.university,
    universityYear: payload.universityYear,
    upi: payload.upi,
    studentId: payload.studentId,
    degrees: formattedDegrees,
  });
}
