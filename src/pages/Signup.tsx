import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { PageTitle } from "../components/PageTitle";
import Footer from "../components/Footer";
import "../main.css";

import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";

import { Autocomplete, TextField } from "@mui/material";
import { fetchDegrees, fetchMajorsForDegree } from "../lib/degreeData";
import { Gender, University } from "../lib/memberSignup";
import { DegreeOrMajor } from "../lib/degreeData";

import { ToastContainer, Zoom, toast } from "react-toastify";
import { SocialLinks } from "../components/SocialLinks";
import { submitSignupForm } from "../lib/signupController";
import BinaryBackground from "../components/BinaryBackground";

export type DegreeBlock = {
  degree: DegreeOrMajor | null;
  majors: (DegreeOrMajor | null)[];
};

const MAX_DEGREES = 2;
const MAX_MAJORS = 2;

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [upi, setUpi] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);

  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(undefined);
  const [selectedUniversity, setSelectedUniversity] = useState<University | "">("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const [isOpenUniversity, setIsOpenUniversity] = useState(false);
  const [isOpenYear, setIsOpenYear] = useState(false);

  const [allDegrees, setAllDegrees] = useState<DegreeOrMajor[]>([]);
  const [majorsMap, setMajorsMap] = useState<Record<string, DegreeOrMajor[]>>({});

  const [degreeBlocks, setDegreeBlocks] = useState<DegreeBlock[]>([{ degree: null, majors: [null] }]);

  const [login, setLogin] = useState(false);

  //! default error message

  const optionsUniversity = [
    { label: "UOA", value: "UOA" },
    { label: "AUT", value: "AUT" },
    { label: "Other", value: "Other" },
  ];

  const optionsYear = [
    { label: "1st", value: 1 },
    { label: "2nd", value: 2 },
    { label: "3rd", value: 3 },
    { label: "4th", value: 4 },
    { label: "5th or more", value: 5 },
  ];

  const muiInputSx = {
    "& .MuiInputBase-root": {
      height: "3rem",
      padding: "0 1rem",
      color: "white",
      fontFamily: "Pixelify Sans, monospace",
      borderRadius: "1rem",
      backgroundColor: "transparent",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "white",
      borderWidth: "1px",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "white",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "white",
    },
    "& .MuiInputLabel-root": {
      display: "none",
    },
    "& .MuiAutocomplete-endAdornment": {
      color: "white",
    },
    "& .MuiSvgIcon-root": {
      color: "white",
    },
    "& .MuiAutocomplete-popupIndicator": {
      color: "white",
      transition: "transform 0.3s ease-in-out",
    },

    "& .MuiAutocomplete-popupIndicatorOpen": {
      transform: "rotate(180deg)",
    },
  };

  const muiPaperSx = {
    backgroundColor: "#1a1a1a",
    color: "white",
    borderRadius: "1rem",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "none",
    marginTop: "0.5rem",
    overflow: "hidden",
    fontFamily: "Pixelify Sans, monospace",
  };

  const muiListboxSx = {
    padding: "0.5rem",
    "& .MuiAutocomplete-option": {
      color: "white",
      fontFamily: "Pixelify Sans, monospace",
      borderRadius: "0.75rem",
      padding: "0.75rem 1rem",
      "&[aria-selected='true']": {
        backgroundColor: "rgba(110,128,218,0.25)",
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(255,255,255,0.10)",
      },
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.12)",
      },
    },
  };

  const selectedDegreeIds = degreeBlocks.map((b) => b.degree?.id).filter(Boolean) as string[];
  const degrees = allDegrees.filter((d) => !selectedDegreeIds.includes(d.id));

  useEffect(() => {
    fetchDegrees([])
      .then((all) => {
        setAllDegrees(all);
        all.forEach((degree) => {
          fetchMajorsForDegree(degree.id, [])
            .then((majors) =>
              setMajorsMap((prev) => ({ ...prev, [degree.id]: majors }))
            )
            .catch(() => {});
        });
      })
      .catch(() => toast.error("Failed to load degrees. Please refresh."));
  }, []);

  const loadMajors = async (degreeId: string, excludeMajorIds: string[] = []) => {
    if (majorsMap[degreeId]) return;
    try {
      const data = await fetchMajorsForDegree(degreeId, excludeMajorIds);
      setMajorsMap((prev) => ({ ...prev, [degreeId]: data }));
    } catch {
      toast.error("Could not fetch majors for this degree.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      const formattedDegrees = degreeBlocks
        .filter((b) => b.degree && b.majors.some(Boolean))
        .map((b) => ({
          degreeId: b.degree!.id,
          majorIds: b.majors.filter(Boolean).map((m) => m!.id),
        }));

      if (!selectedGender || !selectedUniversity || !selectedYear || !studentId || formattedDegrees.length === 0) {
        if (!selectedGender) toast.error("Please select a gender");
        else if (!selectedUniversity) toast.error("Please select a university");
        else if (!selectedYear) toast.error("Please select your year");
        else if (!studentId) toast.error("Please enter your student ID");
        else if (formattedDegrees.length === 0) toast.error("Please select at least one degree and major");
        return;
      }

      const { status, error } = await submitSignupForm({
        email,
        firstName,
        lastName,
        gender: selectedGender,
        university: selectedUniversity,
        universityYear: selectedYear,
        upi,
        studentId,
        degreeBlocks,
      });

      if (!status) {
        const pgError = error as { code?: string };
        if (pgError?.code === "23505") {
          toast.error("You're already signed up!");
        } else {
          console.error(error);
          toast.error("An error occurred. Please try again.");
        }
      }
      setLogin(status);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (!isFeatureEnabled("join_us_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled("join_us_page_is_enabled")) {
    return null;
  }

  return (
    <>
    <BinaryBackground />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={2}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Zoom}
      />
      <Header />

      <PageTitle
        title="Become a DEVS Member"
        subtext="Hey 👋 Thank you for your interest in joining DEVS 💻 Join our growing community of tech enthusiasts and connect with like-minded people! Becoming a DEVS member also gives you access to our exciting social, educational, and technical events. Signing up is completely FREE ✨"
        className="sign-up-title"
      />

      <div className="w-full flex justify-center items-center mb-[10vh]">
        {!login ? (
          <form className="font-pixelify glow bg-black/40 sign-up-form sign-up-container grid rounded-lg border border-2 border-[#6E80DA] ring-4 ring-[#6E80DA]/60 shadow-[0_0_18px_4px_rgba(110,128,218,0.35)]" onSubmit={handleSubmit}>
            {/* FIRST NAME */}
            <div className="relative w-full sign-up-col-span-large">
              <input
                required
                maxLength={30}
                className="h-[3rem] w-full outline-none bg-transparent border-1 border-white rounded-[1rem] text-white p-[1rem] "
                onChange={(e) => setFirstName(e.target.value)}
              />
              <label className="absolute left-1">
                first name <span>*</span>
              </label>
            </div>

            {/* Last Name */}
            <div className="relative w-full sign-up-col-span-large">
              <input
                required
                maxLength={30}
                className="h-[3rem] w-full outline-none bg-transparent border-1 border-white rounded-[1rem] text-white p-[1rem]"
                onChange={(e) => setLastName(e.target.value)}
              />
              <label className="absolute left-1">
                last name <span>*</span>
              </label>
            </div>

            {/* EMAIL */}
            <div className="relative w-full sign-up-col-span-large">
              <input
                type="email"
                required
                maxLength={60}
                className="h-[3rem] w-full outline-none bg-transparent border-1 border-white rounded-[1rem] text-white p-[1rem]"
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="absolute left-1">
                email <span>*</span>
              </label>
            </div>

            {/* Gender */}

            <div className="relative w-full sign-up-col-span-large sign-up-gender">
              {/* The segmented control container */}
              <div className="flex justify-around items-center text-white tracking-widest select-none">
                {/* MALE Segment */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="male"
                    checked={selectedGender === "male"}
                    onChange={(e) => setSelectedGender(e.target.value as Gender)}
                    className="hidden"
                  />
                  <span
                    className={`underline-offset-8 px-4 py-2 transition-all duration-200 ${
                      selectedGender === "male" ? "underline border-white" : "hover:underline"
                    }`}
                  >
                    MALE
                  </span>
                </label>

                <span className="mx-2">/</span>

                {/* FEMALE Segment */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="female"
                    checked={selectedGender === "female"}
                    onChange={(e) => setSelectedGender(e.target.value as Gender)}
                    className="hidden"
                  />
                  <span
                    className={`underline-offset-8 px-4 py-2 transition-all duration-200 ${
                      selectedGender === "female" ? "underline border-white" : "hover:underline"
                    }`}
                  >
                    FEMALE
                  </span>
                </label>

                <span className="mx-2">/</span>

                {/* OTHER Segment */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="prefer-not-to-say"
                    checked={selectedGender === "prefer-not-to-say"}
                    onChange={(e) => setSelectedGender(e.target.value as Gender)}
                    className="hidden"
                  />
                  <span
                    className={`underline-offset-8 px-4 py-2 transition-all duration-200 ${
                      selectedGender === "prefer-not-to-say" ? "underline border-white" : "hover:underline"
                    }`}
                  >
                    OTHER
                  </span>
                </label>
              </div>
            </div>

            {/* UNIVERSITY */}
            <div className="relative w-full sign-up-col-span-large">
              <div
                onClick={() => setIsOpenUniversity(!isOpenUniversity)}
                className="h-[3rem] w-full border-1 border-white rounded-[1rem] flex items-center justify-between px-[1rem] text-white cursor-pointer"
              >
                <span>{selectedUniversity || "--Please-select-an-option"}</span>
                <span
                  className={`transition-transform duration-300 ease-in-out ${
                    isOpenUniversity ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </div>

              {isOpenUniversity && (
                <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] rounded-[1rem] border border-white/15 p-2">
                  {optionsUniversity.map((option) => (
                    <div
                      key={option.value}
                      className={`px-4 py-3 rounded-[0.75rem] cursor-pointer text-white hover:bg-white/10 ${
                        selectedUniversity === option.value ? "bg-[#6E80DA]/30" : ""
                      }`}
                      onClick={() => {
                        setSelectedUniversity(option.value as University);
                        setIsOpenUniversity(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}

              <label className="absolute left-1">
                university <span>*</span>
              </label>
            </div>

            {/* UPI */}
            <div className="relative w-full sign-up-col-span-medium">
              <input
                maxLength={7}
                className="h-[3rem] w-full outline-none bg-transparent border-1 border-white rounded-[1rem] text-white p-[1rem]"
                onChange={(e) => setUpi(e.target.value || null)}
              />
              <label className="absolute left-1">upi</label>
            </div>

            {/* STUDENT ID */}
            <div className="relative w-full sign-up-col-span-medium">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                required
                className="h-[3rem] w-full outline-none bg-transparent border-1 border-white rounded-[1rem] text-white p-[1rem] font-silkscreen"
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  e.target.value = digitsOnly;
                  setStudentId(digitsOnly ? Number(digitsOnly) : null);
                }}
              />
              <label className="absolute left-1">
                student-id <span>*</span>
              </label>
            </div>

            {/* YEAR */}
            <div className="relative w-full sign-up-col-span-medium">
              <div
                onClick={() => setIsOpenYear(!isOpenYear)}
                className="h-[3rem] w-full border-1 border-white rounded-[1rem] flex items-center justify-between px-[1rem] text-white cursor-pointer"
              >
                <span>{selectedYear ? optionsYear.find((o) => o.value === selectedYear)?.label : "--Year--"}</span>
                <span
                  className={`transition-transform duration-300 ease-in-out ${isOpenYear ? "rotate-180" : "rotate-0"}`}
                >
                  ▼
                </span>
              </div>

              {isOpenYear && (
                <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] rounded-[1rem] border border-white/15 p-2">
                  {optionsYear.map((option) => (
                    <div
                      key={option.value}
                      className={`px-4 py-3 rounded-[0.75rem] cursor-pointer text-white hover:bg-white/10 ${
                        selectedYear === option.value ? "bg-[#6E80DA]/30" : ""
                      }`}
                      onClick={() => {
                        setSelectedYear(option.value);
                        setIsOpenYear(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}

              <label className="absolute left-1">
                year <span>*</span>
              </label>
            </div>

            {/* DEGREE / MAJOR BLOCKS */}
            {degreeBlocks.map((block, dIdx) => (
              <React.Fragment key={dIdx}>
                <div className="relative w-full sign-up-col-span-medium">
                  {dIdx > 0 && (
                    <button
                      type="button"
                      className="absolute -left-7 lg:-left-8 top-[1.5rem] -translate-y-1/2 text-white/80 hover:text-red-500 transition text-xl"
                      onClick={() => {
                        const copy = degreeBlocks.filter((_, i) => i !== dIdx);
                        setDegreeBlocks(copy);
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <Autocomplete
                      options={degrees}
                      value={block.degree}
                      getOptionLabel={(o) => o.name}
                      onChange={(_, v) => {
                        const copy = [...degreeBlocks];
                        copy[dIdx] = { degree: v, majors: [null] };
                        setDegreeBlocks(copy);

                        if (v) {
                          loadMajors(v.id, []);
                      }
                      }}
                      popupIcon={<span>▼</span>}
                      sx={muiInputSx}
                      slotProps={{
                        paper: { sx: muiPaperSx },
                        listbox: { sx: muiListboxSx },
                      }}
                      renderInput={(params) => <TextField {...params} placeholder="--Please-select-an-option" />}
                    />
                    <label className="absolute left-1">
                      degree <span>*</span>
                    </label>
                </div>

                {block.majors.map((m, mIdx) => (
                  <div key={mIdx} className="relative w-full sign-up-col-span-medium">
                    <Autocomplete
                      options={
                        block.degree
                          ? [
                              ...(mIdx > 0 ? [{ id: "__none__", name: "None" }] : []),
                              ...(majorsMap[block.degree.id] || []).filter(
                                (m) =>
                                  !block.majors
                                    .map((x) => x?.id)
                                    .filter(Boolean)
                                    .includes(m.id)
                              ),
                            ]
                          : []
                      }
                      value={m}
                      getOptionLabel={(o) => o.name}
                      onChange={(_, v) => {
                        const copy = [...degreeBlocks];
                        if (v?.id === "__none__") {
                          if (copy[dIdx].majors.length === 1) {
                            // If it's the only major, set it to null instead of removing
                            copy[dIdx].majors[mIdx] = null;
                          } else {
                            copy[dIdx].majors.splice(mIdx, 1);
                          }
                        } else {
                          copy[dIdx].majors[mIdx] = v;
                        }
                        setDegreeBlocks(copy);
                      }}
                      popupIcon={<span>▼</span>}
                      sx={{
                        ...muiInputSx,
                        opacity: block.degree ? 1 : 0.4,
                      }}
                      slotProps={{
                        paper: { sx: muiPaperSx },
                        listbox: { sx: muiListboxSx },
                      }}
                      renderInput={(params) => <TextField {...params} placeholder="--Please-select-an-option" />}
                    />
                    <label className="absolute left-1">
                      major <span>*</span>
                    </label>
                  </div>
                ))}

                {block.majors.length < MAX_MAJORS && (
                  <button
                    type="button"
                    className="h-[3rem] w-full border-1 border-dashed border-white/60 rounded-[1rem] text-white/80 hover:bg-white/10 transition sign-up-col-span-medium"
                    onClick={() => {
                      const copy = [...degreeBlocks];
                      copy[dIdx].majors.push(null);
                      setDegreeBlocks(copy);
                    }}
                  >
                    + add major
                  </button>
                )}
              </React.Fragment>
            ))}

            {degreeBlocks.length < MAX_DEGREES && (
              <button
                type="button"
                className="sign-up-col-span-medium h-[3rem] border-1 border-dashed border-white/60 rounded-[1rem] text-white/80 hover:bg-white/10 transition"
                onClick={() => setDegreeBlocks([...degreeBlocks, { degree: null, majors: [null] }])}
              >
                + add degree
              </button>
            )}

            {/* SUBMIT */}
            <div className="sign-up-col-span-submit">
              <button
                type="submit"
                className="h-[5rem] px-10 border-2 border-[#6E80DA] rounded-[1rem] text-white text-[2rem] hover:bg-[#6E80DA] transition"
              >
                SUBMIT
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12 h-full bg-black/40 sign-up-container rounded-lg rounded-4 border border-2 border-[#6E80DA] ring-[#6E80DA]/60 shadow-[0_0_18px_4px_rgba(110,128,218,0.35)]">
            <div className="flex justify-center items-center">
              <img
                src="/branding/deva_wave.png"
                alt="DEVA Waving"
                className="w-24 sm:w-48 md:w-full max-w-[320px] h-auto object-contain opacity-90"
              />
            </div>

            <div className="flex flex-col gap-8 text-white">
              <div className="font-silkscreen text-3xl flex flex-col gap-2 tracking-widest leading-none uppercase">
                <span>YAY!</span>
                <span>YOU'RE SIGNED UP!</span>
              </div>

              <div className="font-rethink text-base md:text-sm opacity-90 max-w-[400px] leading-relaxed">
                <p className="mb-4">
                  Be sure to connect with us on our social media platforms & connect with us on Engage to stay up to
                  date with DEVS' latest updates
                </p>
                <p>See you at the next event!</p>
              </div>

              <div className="flex justify-end">
                <SocialLinks />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default Signup;
