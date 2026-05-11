import React, { useState, useEffect, useCallback, useRef } from "react";
import { posthog } from "../lib/posthog";
import { createPortal } from "react-dom";
import {
    AlreadyRSVPedError,
    attendeeSeatCount,
    EventFullError,
    GroupRSVPSizeExceededError,
    NotMemberError,
    RSVPAnswers,
} from "../lib/eventsRSVPController";
import { RSVPQuestion } from "../lib/eventRsvpTypes";
import { showSiteToast } from "./SiteToast";
import {
    cardCheckoutTotalFromBaseAmount,
    formatNzd,
} from "../lib/cardProcessingFee";
import {
    SITE_BANK_ACCOUNT_NAME,
    SITE_BANK_ACCOUNT_NUMBER,
} from "../lib/bankTransferDetails";
import { DegreeOrMajor, fetchDegrees, fetchMajorsForDegree } from "../lib/degreeData";
import { Gender, University } from "../lib/memberSignup";

export type RSVPSignupDegreeBlock = {
    degree: DegreeOrMajor | null;
    majors: (DegreeOrMajor | null)[];
};

export type RSVPSignupValues = {
    firstName: string;
    lastName: string;
    email: string;
    gender: Gender | undefined;
    university: University | "";
    upi: string | null;
    studentId: number | null;
    year: number | undefined;
    degreeBlocks: RSVPSignupDegreeBlock[];
};

const EMPTY_SIGNUP_VALUES: RSVPSignupValues = {
    firstName: "",
    lastName: "",
    email: "",
    gender: undefined,
    university: "",
    upi: null,
    studentId: null,
    year: undefined,
    degreeBlocks: [{ degree: null, majors: [null] }],
};

const MAX_SIGNUP_DEGREES = 2;
const MAX_SIGNUP_MAJORS = 2;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const UNIVERSITY_OPTIONS: { value: University; label: string }[] = [
    { value: "UOA", label: "UOA" },
    { value: "AUT", label: "AUT" },
    { value: "Other", label: "Other" },
];

const YEAR_OPTIONS: { value: number; label: string }[] = [
    { value: 1, label: "1st" },
    { value: 2, label: "2nd" },
    { value: 3, label: "3rd" },
    { value: 4, label: "4th" },
    { value: 5, label: "5th+" },
];

function validateSignupValues(values: RSVPSignupValues): string | null {
    if (!values.firstName.trim()) return "Please enter your first name";
    if (!values.lastName.trim()) return "Please enter your last name";
    if (!values.gender) return "Please select a gender";
    if (!values.university) return "Please select a university";
    if (!values.year) return "Please select your year";
    if (!values.studentId) return "Please enter your student ID";
    const formattedDegrees = values.degreeBlocks.filter(
        (b) => b.degree && b.majors.some(Boolean),
    );
    if (formattedDegrees.length === 0) {
        return "Please select at least one degree and major";
    }
    return null;
}

const PaymentProofDropZone: React.FC<{
    disabled: boolean;
    file: File | null;
    onFile: (file: File | null) => void;
    onValidationError: (msg: string) => void;
}> = ({ disabled, file, onFile, onValidationError }) => {
    const [dragOver, setDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFile = useCallback(
        (next: File) => {
            if (!next.type.startsWith("image/")) {
                onValidationError("Only image files are supported.");
                return;
            }
            onFile(next);
        },
        [onFile, onValidationError],
    );

    const onDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);
            if (disabled) return;
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
        },
        [disabled, handleFile],
    );

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = "";
    };

    return (
        <div className="mb-0">
            <div
                className={`pixel-input w-full flex flex-col items-center justify-center gap-3 transition-colors ${
                    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${dragOver ? "opacity-70" : ""}`}
                style={{ minHeight: "120px", borderStyle: "dashed", padding: "16px" }}
                onClick={() => !disabled && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
            >
                {file && previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Payment confirmation preview"
                            className="max-h-32 max-w-full object-contain"
                            style={{ imageRendering: "auto" }}
                        />
                        <p className="font-pixelify text-xs text-white/50 md:hidden">Click to replace</p>
                        <p className="font-pixelify text-xs text-white/50 hidden md:block">
                            Click or drop to replace
                        </p>
                    </>
                ) : (
                    <>
                        <p className="font-pixelify text-xs text-white/70 md:hidden">Click to upload</p>
                        <p className="font-pixelify text-xs text-white/70 hidden md:block">
                            Drag & drop or click to upload
                        </p>
                        <p className="font-pixelify text-xs text-white/40">PNG, JPG, GIF, WEBP</p>
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled}
                onChange={onInputChange}
            />
        </div>
    );
};

const CopyIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden
    >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const SignupChoiceGroup: React.FC<{
    label: string;
    required?: boolean;
    rightAction?: React.ReactNode;
    children: React.ReactNode;
}> = ({ label, required, rightAction, children }) => (
    <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
            <label className="font-pixelify block">
                {label}
                {required ? <span className="text-red-400">*</span> : null}
            </label>
            {rightAction}
        </div>
        {children}
    </div>
);

const SignupOptionGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-wrap gap-2">{children}</div>
);

const SignupOption: React.FC<{
    name: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    label: string;
}> = ({ name, checked, onChange, disabled, label }) => (
    <label
        className={`font-silkscreen text-xs tracking-wide flex items-center gap-2 rounded-md border-2 px-3 py-2 transition cursor-pointer ${
            checked
                ? "border-white bg-white/12 text-white"
                : "border-white/40 bg-transparent text-white/85 hover:border-white/70"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
        <input
            type="radio"
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
        />
        <span
            aria-hidden="true"
            className={`inline-flex h-4 w-4 items-center justify-center border-2 rounded-full ${
                checked ? "border-white bg-white text-black" : "border-white/60 bg-transparent"
            }`}
        >
            {checked ? "•" : ""}
        </span>
        <span>{label}</span>
    </label>
);

type GenericRSVPDialogProps = {
    open: boolean;
    onClose: () => void;
    initialLeaderEmail?: string;
    groupRSVPEnabled: boolean;
    groupRSVPMaxEmails: number | null;
    paymentEnabled?: boolean;
    chargeAmount?: number | null;
    bankTransferEnabled?: boolean;
    rsvpQuestions: RSVPQuestion[];
    onConfirm: (payload: {
        leaderEmail: string;
        groupEmails: string[];
        dietaryRequirements: string | null;
        answers: RSVPAnswers;
        paymentMethod?: "stripe" | "bank_transfer";
        bankPaymentProofFile?: File | null;
        signupInfo?: RSVPSignupValues;
    }) => Promise<void> | void;
};

const GenericRSVPDialog: React.FC<GenericRSVPDialogProps> = ({
    open,
    onClose,
    initialLeaderEmail,
    groupRSVPEnabled,
    groupRSVPMaxEmails,
    paymentEnabled = false,
    chargeAmount = null,
    bankTransferEnabled = false,
    rsvpQuestions,
    onConfirm,
}) => {
    const [leaderEmail, setLeaderEmail] = useState("");
    const [groupEmails, setGroupEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dietaryRequirements, setDietaryRequirements] = useState("");
    const [answers, setAnswers] = useState<RSVPAnswers>({});
    const [paymentChoice, setPaymentChoice] = useState<"stripe" | "bank_transfer">("stripe");
    const [bankProofFile, setBankProofFile] = useState<File | null>(null);
    const [needsSignup, setNeedsSignup] = useState(false);
    const [signupValues, setSignupValues] = useState<RSVPSignupValues>(EMPTY_SIGNUP_VALUES);
    const [allDegrees, setAllDegrees] = useState<DegreeOrMajor[]>([]);
    const [majorsMap, setMajorsMap] = useState<Record<string, DegreeOrMajor[]>>({});
    /** Desktop / mouse-primary: allow tap-outside to close. Touch-primary (typical phones): off — avoids Android/iOS stray events while typing or scrolling. */
    const [backdropTapDismiss, setBackdropTapDismiss] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
    );
    /** Tailwind `md` breakpoint: phones / narrow layouts only dismiss via explicit cancel (no backdrop, no Escape). */
    const [narrowViewport, setNarrowViewport] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
    );
    /** Backdrop + Escape dismiss — disabled on mobile-sized viewports and on touch-primary wide screens. */
    const allowChromeDismiss = backdropTapDismiss && !narrowViewport;
    /** Only close on backdrop when press started and ended on overlay — extra guard when backdrop tap is enabled. */
    const backdropCloseGestureRef = useRef(false);

    useEffect(() => {
        if (!open || initialLeaderEmail === undefined || initialLeaderEmail === "") return;
        setLeaderEmail(initialLeaderEmail.trim().toLowerCase());
    }, [open, initialLeaderEmail]);

    useEffect(() => {
        if (!open) return;
        setPaymentChoice("stripe");
        setBankProofFile(null);
        setNeedsSignup(false);
        setSignupValues(EMPTY_SIGNUP_VALUES);
    }, [open]);

    // Load degree list on demand the first time the signup step is revealed.
    useEffect(() => {
        if (!needsSignup || allDegrees.length > 0) return;
        fetchDegrees([])
            .then((all) => {
                setAllDegrees(all);
                all.forEach((degree) => {
                    fetchMajorsForDegree(degree.id, [])
                        .then((majors) =>
                            setMajorsMap((prev) => ({ ...prev, [degree.id]: majors })),
                        )
                        .catch(() => {});
                });
            })
            .catch(() =>
                showSiteToast("Failed to load degrees. Please refresh.", {
                    variant: "error",
                }),
            );
    }, [needsSignup, allDegrees.length]);

    useEffect(() => {
        const mq = window.matchMedia("(pointer: fine)");
        const sync = () => setBackdropTapDismiss(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const sync = () => setNarrowViewport(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    /** Stop page scroll behind the modal (especially on mobile). */
    useEffect(() => {
        if (!open) return;

        const html = document.documentElement;
        const body = document.body;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlOverscroll = html.style.overscrollBehavior;
        const prevBodyOverscroll = body.style.overscrollBehavior;

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.overscrollBehavior = "none";
        body.style.overscrollBehavior = "none";

        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.overscrollBehavior = prevHtmlOverscroll;
            body.style.overscrollBehavior = prevBodyOverscroll;
        };
    }, [open]);

    const handleConfirm = async () => {
        if (!leaderEmail) {
            setError("Email is required");
            
            return;
        }

        if (loading) return;

        setError(null);
        setLoading(true);

        try {
            for (const question of rsvpQuestions) {
                if (!question.required) continue;
                const value = answers[question.id];
                if (question.type === "text" && (!value || String(value).trim().length === 0)) {
                    setError(`Please answer "${question.prompt}".`);
                    setLoading(false);
                    return;
                }
                if (
                    question.type === "single_select" &&
                    (typeof value !== "string" || value.trim().length === 0)
                ) {
                    setError(`Please answer "${question.prompt}".`);
                    setLoading(false);
                    return;
                }
                if (
                    question.type === "multi_select" &&
                    (!Array.isArray(value) || value.length === 0)
                ) {
                    setError(`Please answer "${question.prompt}".`);
                    setLoading(false);
                    return;
                }
            }

            const normalizedGroupEmails = groupEmails
                .map((email) => email.trim().toLowerCase())
                .filter(Boolean);

            if (groupRSVPEnabled) {
                if (
                    groupRSVPMaxEmails !== null &&
                    normalizedGroupEmails.length > groupRSVPMaxEmails
                ) {
                    setError(`Maximum ${groupRSVPMaxEmails} emails allowed for this event.`);
                    setLoading(false);
                    return;
                }
            }

            const showCost =
                paymentEnabled &&
                chargeAmount !== null &&
                chargeAmount !== undefined &&
                Number(chargeAmount) > 0;

            if (showCost && paymentChoice === "bank_transfer") {
                if (!bankTransferEnabled) {
                    setError("Bank transfer is not available for this event.");
                    setLoading(false);
                    return;
                }
                if (!bankProofFile) {
                    setError("Please upload a screenshot of your payment confirmation.");
                    setLoading(false);
                    return;
                }
            }

            const resolvedPaymentMethod: "stripe" | "bank_transfer" | undefined = showCost
                ? paymentChoice
                : undefined;

            const normalizedLeaderEmail = leaderEmail.trim().toLowerCase();

            let signupInfo: RSVPSignupValues | undefined;
            if (needsSignup) {
                const signupValidationError = validateSignupValues(signupValues);
                if (signupValidationError) {
                    setError(signupValidationError);
                    setLoading(false);
                    return;
                }
                signupInfo = { ...signupValues, email: normalizedLeaderEmail };
            }

            await onConfirm({
                leaderEmail: normalizedLeaderEmail,
                groupEmails: groupRSVPEnabled ? normalizedGroupEmails : [],
                dietaryRequirements,
                answers,
                paymentMethod: resolvedPaymentMethod,
                bankPaymentProofFile:
                    showCost && paymentChoice === "bank_transfer" ? bankProofFile : null,
                signupInfo,
            });

            setLoading(false);
            setSubmitted(true);

            setTimeout(() => {
                setSubmitted(false);
                setLeaderEmail("");
                setGroupEmails([]);
                setDietaryRequirements("");
                setAnswers({});
                setNeedsSignup(false);
                setSignupValues(EMPTY_SIGNUP_VALUES);
                onClose();
            }, 3000);
        } catch (err) {
            setLoading(false);

            // Non-member: reveal signup fields inline and keep all RSVP data in place.
            if (err instanceof NotMemberError) {
                setNeedsSignup(true);
                setError(null);
                return;
            }

            let reason = "unknown";
            if (err instanceof AlreadyRSVPedError) {
                reason = "already_rsvped";
            } else if (err instanceof EventFullError) {
                reason = "event_full";
            } else if (err instanceof GroupRSVPSizeExceededError) {
                reason = "group_size_exceeded";
            } else if (err instanceof Error) {
                reason = err.name || "error";
            }

            if (posthog && posthog.capture) {
                posthog.capture("rsvp_failed", {
                    error: err instanceof Error ? err.message : String(err),
                    reason,
                    leaderEmail,
                    groupEmails,
                    dietaryRequirements,
                    answers,
                });
            }

            if (reason === "already_rsvped") {
                setError("You have already RSVP'd to this event");
            } else if (reason === "event_full") {
                setError("This event is full.");
            } else if (reason === "group_size_exceeded") {
                setError("Your group exceeds the maximum allowed for this event.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
    };

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (!allowChromeDismiss) return;
                e.preventDefault();
                onClose();
            }

            if (e.key === "Enter" && !submitted && !loading) {
                e.preventDefault();
                handleConfirm();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, submitted, loading, allowChromeDismiss, leaderEmail, dietaryRequirements, groupEmails, answers]);

    if (!open) return null;

    const visibleGroupFields = groupRSVPEnabled
        ? groupRSVPMaxEmails ?? groupEmails.length
        : 0;

    const showCost =
        paymentEnabled && chargeAmount !== null && chargeAmount !== undefined && Number(chargeAmount) > 0;
    const bankDetailsReady = Boolean(bankTransferEnabled);
    const attendeeCount = attendeeSeatCount(leaderEmail, groupEmails, groupRSVPEnabled);
    const perPersonPrice = showCost ? Number(chargeAmount) : 0;
    const subtotalAmount =
        showCost ? Math.round(perPersonPrice * attendeeCount * 100) / 100 : 0;
    const cardTotalWithFee = showCost ? cardCheckoutTotalFromBaseAmount(subtotalAmount) : 0;
    const cardFeePortion = showCost ? Math.round((cardTotalWithFee - subtotalAmount) * 100) / 100 : 0;

    const copyToClipboard = async (_label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            // showSiteToast(`${label} copied`, { variant: "success", autoClose: 2000 });
        } catch {
            // showSiteToast("Could not copy", { variant: "error", autoClose: 2500 });
        }
    };

    const confirmLabel = (() => {
        if (needsSignup) {
            if (!showCost) return "Sign up & RSVP";
            if (paymentChoice === "bank_transfer") return "Sign up & confirm RSVP";
            return "Sign up, pay & confirm";
        }
        if (!showCost) return "confirm";
        if (paymentChoice === "bank_transfer") return "confirm RSVP";
        return "Pay & Confirm";
    })();

    const onBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!allowChromeDismiss || loading) return;
        if (e.target === e.currentTarget) {
            backdropCloseGestureRef.current = true;
        }
    };

    const onBackdropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (
            allowChromeDismiss &&
            backdropCloseGestureRef.current &&
            e.target === e.currentTarget &&
            !loading
        ) {
            onClose();
        }
        backdropCloseGestureRef.current = false;
    };

    const onBackdropPointerCancel = () => {
        backdropCloseGestureRef.current = false;
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-9999 flex items-center justify-center bg-black/60 px-3 py-6 pt-12 sm:pt-16 touch-manipulation overscroll-none ${!allowChromeDismiss ? "touch-none" : ""}`}
            onPointerDown={onBackdropPointerDown}
            onPointerUp={onBackdropPointerUp}
            onPointerCancel={onBackdropPointerCancel}
            role="presentation"
        >
            <div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-xl border-2 border-white bg-[#04060f] p-6 text-left sm:p-8 touch-pan-y"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="rsvp-dialog-title"
            >
                {!submitted ? (
                    <>
                        <h2
                            id="rsvp-dialog-title"
                            className="font-silkscreen text-xl sm:text-2xl text-white text-center mb-6 tracking-wide"
                        >
                            {needsSignup ? "Almost there, just a few more details" : "RSVP"}
                        </h2>
                        {needsSignup && (
                            <p className="font-pixelify text-sm text-white/75 text-center mb-6 leading-relaxed">
                                We couldn't find a DEVS account for that email.
                            </p>
                        )}
                        <div className="mb-6 text-left">
                            <label
                                htmlFor="email"
                                className="font-pixelify block"
                                style={{ marginBottom: "16px" }}
                            >
                                Email address<span className="text-red-400">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={leaderEmail}
                                onChange={(e) => setLeaderEmail(e.target.value)}
                                className="pixel-input font-rethink w-full"
                                placeholder="admin@devsuoa.com"
                                required
                                disabled={loading}
                            />

                            {groupRSVPEnabled && (
                                <div className="mt-4">
                                    <label className="font-pixelify block mb-3">
                                        Group emails
                                        {groupRSVPMaxEmails !== null && (
                                            <span className="text-white/60"> (up to {groupRSVPMaxEmails})</span>
                                        )}
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        {groupEmails.slice(0, visibleGroupFields).map((email, index) => (
                                            <input
                                                key={`group-email-${index}`}
                                                type="email"
                                                className="pixel-input font-rethink w-full"
                                                placeholder={`Group attendee email ${index + 1}`}
                                                value={email}
                                                onChange={(e) =>
                                                    setGroupEmails((prev) => {
                                                        const next = [...prev];
                                                        next[index] = e.target.value;
                                                        return next;
                                                    })
                                                }
                                                disabled={loading}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            type="button"
                                            className="pixel-button text-xs px-3 py-2"
                                            disabled={
                                                loading ||
                                                (groupRSVPMaxEmails !== null && groupEmails.length >= groupRSVPMaxEmails)
                                            }
                                            onClick={() => setGroupEmails((prev) => [...prev, ""])}
                                        >
                                            Add email
                                        </button>
                                        <button
                                            type="button"
                                            className="pixel-button text-xs px-3 py-2"
                                            disabled={loading || groupEmails.length === 0}
                                            onClick={() => setGroupEmails((prev) => prev.slice(0, -1))}
                                        >
                                            Remove last
                                        </button>
                                    </div>
                                </div>
                            )}

                            <label
                                htmlFor="dietaryRequirements"
                                className="font-pixelify block my-4"
                            >
                                Dietary requirements
                            </label>
                            <textarea
                                id="dietaryRequirements"
                                className="pixel-input w-full mb-6 font-rethink min-h-[80px]"
                                placeholder="Dietary requirements (e.g. vegetarian, halal, allergies)"
                                value={dietaryRequirements}
                                onChange={(e) => setDietaryRequirements(e.target.value)}
                            />

                            {rsvpQuestions.length > 0 && (
                                <div className="mt-2 text-left">
                                    <h3 className="font-silkscreen text-white text-xs sm:text-sm mb-4 tracking-wide">
                                        Additional questions
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        {rsvpQuestions.map((question) => (
                                            <div key={question.id}>
                                                <label className="font-pixelify block mb-2">
                                                    {question.prompt}
                                                    {question.required ? <span className="text-red-400">*</span> : null}
                                                </label>
                                                {question.type === "text" ? (
                                                    <input
                                                        className="pixel-input w-full font-rethink"
                                                        value={typeof answers[question.id] === "string" ? answers[question.id] : ""}
                                                        onChange={(e) =>
                                                            setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                                                        }
                                                    />
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {question.options.map((option) => {
                                                            const currentAnswer = answers[question.id];
                                                            const currentMulti = Array.isArray(currentAnswer) ? currentAnswer : [];
                                                            const checked =
                                                                question.type === "single_select"
                                                                    ? currentAnswer === option
                                                                    : currentMulti.includes(option);
                                                            const inputId = `${question.id}-${option}`;

                                                            return (
                                                                <label
                                                                    key={inputId}
                                                                    htmlFor={inputId}
                                                                    className={`font-silkscreen text-xs tracking-wide flex items-center gap-3 rounded-md border-2 px-3 py-2 transition cursor-pointer ${
                                                                        checked
                                                                            ? "border-white bg-white/12 text-white"
                                                                            : "border-white/40 bg-transparent text-white/85 hover:border-white/70"
                                                                    } ${loading ? "pointer-events-none opacity-60" : ""}`}
                                                                >
                                                                    <input
                                                                        id={inputId}
                                                                        type={question.type === "single_select" ? "radio" : "checkbox"}
                                                                        name={question.id}
                                                                        checked={checked}
                                                                        className="sr-only"
                                                                        disabled={loading}
                                                                        onChange={(e) => {
                                                                            if (question.type === "single_select") {
                                                                                setAnswers((prev) => ({
                                                                                    ...prev,
                                                                                    [question.id]: option,
                                                                                }));
                                                                                return;
                                                                            }

                                                                            setAnswers((prev) => {
                                                                                const existing = Array.isArray(prev[question.id])
                                                                                    ? (prev[question.id] as string[])
                                                                                    : [];
                                                                                if (e.target.checked) {
                                                                                    return {
                                                                                        ...prev,
                                                                                        [question.id]: [...existing, option],
                                                                                    };
                                                                                }
                                                                                return {
                                                                                    ...prev,
                                                                                    [question.id]: existing.filter(
                                                                                        (item) => item !== option
                                                                                    ),
                                                                                };
                                                                            });
                                                                        }}
                                                                    />
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className={`inline-flex h-5 w-5 items-center justify-center border-2 ${
                                                                            question.type === "single_select" ? "rounded-full" : "rounded-sm"
                                                                        } ${checked ? "border-white bg-white text-black" : "border-white/60 bg-transparent"}`}
                                                                    >
                                                                        {checked ? (question.type === "single_select" ? "•" : "✓") : ""}
                                                                    </span>
                                                                    <span>{option}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showCost && (
                                <div className="mt-8 border border-white/20 rounded-lg p-4 sm:p-5 bg-black/20">
                                    <h3 className="font-silkscreen text-white text-xs sm:text-sm mb-4 tracking-wide">
                                        Payment method
                                    </h3>
                                    <div className="flex flex-col gap-2 mb-4">
                                        <label
                                            htmlFor="payment-method-stripe"
                                            className={`font-silkscreen text-xs tracking-wide flex items-center gap-3 rounded-md border-2 px-3 py-2 transition cursor-pointer ${
                                                paymentChoice === "stripe"
                                                    ? "border-white bg-white/12 text-white"
                                                    : "border-white/40 bg-transparent text-white/85 hover:border-white/70"
                                            } ${loading ? "pointer-events-none opacity-60" : ""}`}
                                        >
                                            <input
                                                id="payment-method-stripe"
                                                type="radio"
                                                name="payment-method-choice"
                                                className="sr-only"
                                                checked={paymentChoice === "stripe"}
                                                onChange={() => {
                                                    setPaymentChoice("stripe");
                                                    setBankProofFile(null);
                                                }}
                                                disabled={loading}
                                            />
                                            <span
                                                aria-hidden="true"
                                                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 rounded-full ${
                                                    paymentChoice === "stripe"
                                                        ? "border-white bg-white text-black"
                                                        : "border-white/60 bg-transparent"
                                                }`}
                                            >
                                                {paymentChoice === "stripe" ? "•" : ""}
                                            </span>
                                            <span>Pay with card</span>
                                        </label>
                                        {paymentChoice === "stripe" && (
                                            <div className="ml-4 pl-3 border-l-2 border-white/25 space-y-1 mb-1">
                                                <p className="font-rethink text-sm text-white/70">
                                                    {groupRSVPEnabled ? (
                                                        <>
                                                            {attendeeCount} attendee{attendeeCount === 1 ? "" : "s"} ×{" "}
                                                            {formatNzd(perPersonPrice)}
                                                            {" = "}
                                                            <span className="text-white">{formatNzd(subtotalAmount)}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Price per person:{" "}
                                                            <span className="text-white">{formatNzd(perPersonPrice)}</span>
                                                        </>
                                                    )}
                                                </p>
                                                <p className="font-rethink text-sm text-white/70">
                                                    Total Cost: {" "}
                                                    <span className="text-white font-semibold">
                                                        {formatNzd(cardTotalWithFee)}
                                                    </span>
                                                </p>
                                                <p className="font-rethink text-sm text-white/45">
                                                    Includes ~{formatNzd(cardFeePortion)} processing fee
                                                </p>
                                                <p className="font-rethink text-sm text-amber-200/85 mt-1.5 leading-snug">
                                                    The card processing fee is non-refundable.
                                                </p>
                                            </div>
                                        )}
                                        <label
                                            htmlFor="payment-method-bank"
                                            className={`font-silkscreen text-xs tracking-wide flex items-center gap-3 rounded-md border-2 px-3 py-2 transition ${
                                                bankDetailsReady ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                                            } ${
                                                paymentChoice === "bank_transfer"
                                                    ? "border-white bg-white/12 text-white"
                                                    : "border-white/40 bg-transparent text-white/85 hover:border-white/70"
                                            } ${loading ? "pointer-events-none opacity-60" : ""}`}
                                        >
                                            <input
                                                id="payment-method-bank"
                                                type="radio"
                                                name="payment-method-choice"
                                                className="sr-only"
                                                checked={paymentChoice === "bank_transfer"}
                                                onChange={() => setPaymentChoice("bank_transfer")}
                                                disabled={loading || !bankDetailsReady}
                                            />
                                            <span
                                                aria-hidden="true"
                                                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 rounded-full ${
                                                    paymentChoice === "bank_transfer"
                                                        ? "border-white bg-white text-black"
                                                        : "border-white/60 bg-transparent"
                                                }`}
                                            >
                                                {paymentChoice === "bank_transfer" ? "•" : ""}
                                            </span>
                                            <span>Bank transfer</span>
                                        </label>
                                        {!bankDetailsReady && (
                                            <p className="font-pixelify text-[10px] text-amber-200/90 ml-1">
                                                Bank transfer is not enabled for this event.
                                            </p>
                                        )}
                                    </div>

                                    {bankDetailsReady && paymentChoice === "bank_transfer" && (
                                        <div className="space-y-4">
                                            <p className="font-rethink text-sm text-white/75">
                                                Transfer{" "}
                                                <span className="text-white font-semibold">
                                                    {formatNzd(subtotalAmount)}
                                                </span>{" "}
                                                total (
                                                {groupRSVPEnabled ? (
                                                    <>
                                                        {attendeeCount} × {formatNzd(perPersonPrice)}
                                                    </>
                                                ) : (
                                                    <>1 × {formatNzd(perPersonPrice)}</>
                                                )}
                                                ), then upload a screenshot of your confirmation.
                                            </p>
                                            <p className="font-rethink text-sm text-amber-200/85">
                                                Put your <span className="text-amber-200 font-bold">name</span> or{" "}
                                                <span className="text-amber-200 font-bold">UPI</span> in the transfer reference so we can match your payment.
                                            </p>
                                            <div>
                                                <p className="font-pixelify text-xs text-white/60 mb-2">Account name</p>
                                                <div className="relative pixel-input flex min-h-[44px] items-center py-2 pl-3 pr-11">
                                                    <span className="font-rethink text-sm text-white min-w-0 flex-1 break-all text-left">
                                                        {SITE_BANK_ACCOUNT_NAME}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="absolute right-1 top-1/2 flex h-9 w-9 shrink-0 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-white/85 transition-colors hover:text-white disabled:opacity-50"
                                                        onClick={() =>
                                                            copyToClipboard("Account name", SITE_BANK_ACCOUNT_NAME)
                                                        }
                                                        disabled={loading}
                                                        aria-label="Copy account name"
                                                    >
                                                        <CopyIcon />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-pixelify text-xs text-white/60 mb-2">Account number</p>
                                                <div className="relative pixel-input flex min-h-[44px] items-center py-2 pl-3 pr-11">
                                                    <span className="font-rethink text-sm text-white min-w-0 flex-1 break-all text-left tracking-wide">
                                                        {SITE_BANK_ACCOUNT_NUMBER}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="absolute right-1 top-1/2 flex h-9 w-9 shrink-0 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-white/85 transition-colors hover:text-white disabled:opacity-50"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                "Account number",
                                                                SITE_BANK_ACCOUNT_NUMBER,
                                                            )
                                                        }
                                                        disabled={loading}
                                                        aria-label="Copy account number"
                                                    >
                                                        <CopyIcon />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="font-pixelify block mb-2 text-xs text-white/80">
                                                    Payment confirmation screenshot<span className="text-red-400">*</span>
                                                </label>
                                                <PaymentProofDropZone
                                                    disabled={loading}
                                                    file={bankProofFile}
                                                    onFile={setBankProofFile}
                                                    onValidationError={(msg) => {
                                                        setError(msg);
                                                        showSiteToast(msg, { variant: "error", autoClose: 3000 });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {needsSignup && (
                            <div className="mt-2 mb-6 border-t-2 border-white/20 pt-6 text-left">
                                <SignupChoiceGroup
                                    label="First name"
                                    required
                                >
                                    <input
                                        type="text"
                                        className="pixel-input font-rethink w-full"
                                        value={signupValues.firstName}
                                        onChange={(e) =>
                                            setSignupValues((prev) => ({
                                                ...prev,
                                                firstName: e.target.value,
                                            }))
                                        }
                                        maxLength={30}
                                        disabled={loading}
                                    />
                                </SignupChoiceGroup>

                                <SignupChoiceGroup label="Last name" required>
                                    <input
                                        type="text"
                                        className="pixel-input font-rethink w-full"
                                        value={signupValues.lastName}
                                        onChange={(e) =>
                                            setSignupValues((prev) => ({
                                                ...prev,
                                                lastName: e.target.value,
                                            }))
                                        }
                                        maxLength={30}
                                        disabled={loading}
                                    />
                                </SignupChoiceGroup>

                                <SignupChoiceGroup label="Gender" required>
                                    <SignupOptionGrid>
                                        {GENDER_OPTIONS.map((option) => (
                                            <SignupOption
                                                key={option.value}
                                                name="signup-gender"
                                                checked={signupValues.gender === option.value}
                                                onChange={() =>
                                                    setSignupValues((prev) => ({
                                                        ...prev,
                                                        gender: option.value,
                                                    }))
                                                }
                                                disabled={loading}
                                                label={option.label}
                                            />
                                        ))}
                                    </SignupOptionGrid>
                                </SignupChoiceGroup>

                                <SignupChoiceGroup label="University" required>
                                    <SignupOptionGrid>
                                        {UNIVERSITY_OPTIONS.map((option) => (
                                            <SignupOption
                                                key={option.value}
                                                name="signup-university"
                                                checked={signupValues.university === option.value}
                                                onChange={() =>
                                                    setSignupValues((prev) => ({
                                                        ...prev,
                                                        university: option.value,
                                                    }))
                                                }
                                                disabled={loading}
                                                label={option.label}
                                            />
                                        ))}
                                    </SignupOptionGrid>
                                </SignupChoiceGroup>

                                <SignupChoiceGroup label="Year of study" required>
                                    <SignupOptionGrid>
                                        {YEAR_OPTIONS.map((option) => (
                                            <SignupOption
                                                key={option.value}
                                                name="signup-year"
                                                checked={signupValues.year === option.value}
                                                onChange={() =>
                                                    setSignupValues((prev) => ({
                                                        ...prev,
                                                        year: option.value,
                                                    }))
                                                }
                                                disabled={loading}
                                                label={option.label}
                                            />
                                        ))}
                                    </SignupOptionGrid>
                                </SignupChoiceGroup>

                                <SignupChoiceGroup label="Student ID" required>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={12}
                                        className="pixel-input font-rethink w-full"
                                        value={signupValues.studentId !== null ? String(signupValues.studentId) : ""}
                                        onChange={(e) => {
                                            const digitsOnly = e.target.value.replace(/\D/g, "");
                                            setSignupValues((prev) => ({
                                                ...prev,
                                                studentId: digitsOnly ? Number(digitsOnly) : null,
                                            }));
                                        }}
                                        disabled={loading}
                                    />
                                </SignupChoiceGroup>

                                <SignupChoiceGroup label="UPI">
                                    <input
                                        type="text"
                                        className="pixel-input font-rethink w-full"
                                        value={signupValues.upi ?? ""}
                                        onChange={(e) =>
                                            setSignupValues((prev) => ({
                                                ...prev,
                                                upi: e.target.value || null,
                                            }))
                                        }
                                        maxLength={7}
                                        disabled={loading}
                                    />
                                </SignupChoiceGroup>

                                {signupValues.degreeBlocks.map((block, dIdx) => {
                                    const usedDegreeIds = signupValues.degreeBlocks
                                        .map((b, i) => (i === dIdx ? null : b.degree?.id))
                                        .filter(Boolean) as string[];
                                    const availableDegrees = allDegrees.filter(
                                        (d) => !usedDegreeIds.includes(d.id),
                                    );
                                    const blockMajors = block.degree
                                        ? majorsMap[block.degree.id] ?? []
                                        : [];

                                    return (
                                        <div key={dIdx} className="mb-4">
                                            <SignupChoiceGroup
                                                label={`Degree${signupValues.degreeBlocks.length > 1 ? ` ${dIdx + 1}` : ""}`}
                                                required
                                                rightAction={
                                                    dIdx > 0 ? (
                                                        <button
                                                            type="button"
                                                            disabled={loading}
                                                            className="font-pixelify text-xs text-white/60 hover:text-red-400 transition"
                                                            onClick={() =>
                                                                setSignupValues((prev) => ({
                                                                    ...prev,
                                                                    degreeBlocks: prev.degreeBlocks.filter(
                                                                        (_, i) => i !== dIdx,
                                                                    ),
                                                                }))
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : null
                                                }
                                            >
                                                <select
                                                    className="pixel-input font-rethink w-full"
                                                    value={block.degree?.id ?? ""}
                                                    disabled={loading}
                                                    onChange={(e) => {
                                                        const id = e.target.value;
                                                        const next = availableDegrees.find((d) => d.id === id) ?? null;
                                                        setSignupValues((prev) => {
                                                            const copy = [...prev.degreeBlocks];
                                                            copy[dIdx] = { degree: next, majors: [null] };
                                                            return { ...prev, degreeBlocks: copy };
                                                        });
                                                        if (next && !majorsMap[next.id]) {
                                                            fetchMajorsForDegree(next.id, [])
                                                                .then((majors) =>
                                                                    setMajorsMap((prev) => ({
                                                                        ...prev,
                                                                        [next.id]: majors,
                                                                    })),
                                                                )
                                                                .catch(() => {});
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select a degree</option>
                                                    {block.degree && !availableDegrees.some((d) => d.id === block.degree!.id) && (
                                                        <option value={block.degree.id}>{block.degree.name}</option>
                                                    )}
                                                    {availableDegrees.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </SignupChoiceGroup>

                                            {block.majors.map((m, mIdx) => {
                                                const otherSelected = block.majors
                                                    .map((x, i) => (i === mIdx ? null : x?.id))
                                                    .filter(Boolean) as string[];
                                                const availableMajors = blockMajors.filter(
                                                    (mm) => !otherSelected.includes(mm.id),
                                                );
                                                return (
                                                    <SignupChoiceGroup
                                                        key={mIdx}
                                                        label={`Major${block.majors.length > 1 ? ` ${mIdx + 1}` : ""}`}
                                                        required={mIdx === 0}
                                                        rightAction={
                                                            mIdx > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={loading}
                                                                    className="font-pixelify text-xs text-white/60 hover:text-red-400 transition"
                                                                    onClick={() =>
                                                                        setSignupValues((prev) => {
                                                                            const copy = [...prev.degreeBlocks];
                                                                            copy[dIdx] = {
                                                                                ...copy[dIdx],
                                                                                majors: copy[dIdx].majors.filter(
                                                                                    (_, i) => i !== mIdx,
                                                                                ),
                                                                            };
                                                                            return { ...prev, degreeBlocks: copy };
                                                                        })
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            ) : null
                                                        }
                                                    >
                                                        <select
                                                            className="pixel-input font-rethink w-full"
                                                            value={m?.id ?? ""}
                                                            disabled={loading || !block.degree}
                                                            onChange={(e) => {
                                                                const id = e.target.value;
                                                                const next = availableMajors.find((mm) => mm.id === id) ?? null;
                                                                setSignupValues((prev) => {
                                                                    const copy = [...prev.degreeBlocks];
                                                                    const majors = [...copy[dIdx].majors];
                                                                    majors[mIdx] = next;
                                                                    copy[dIdx] = { ...copy[dIdx], majors };
                                                                    return { ...prev, degreeBlocks: copy };
                                                                });
                                                            }}
                                                        >
                                                            <option value="">
                                                                {block.degree ? "Select a major" : "Select a degree first"}
                                                            </option>
                                                            {availableMajors.map((mm) => (
                                                                <option key={mm.id} value={mm.id}>
                                                                    {mm.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </SignupChoiceGroup>
                                                );
                                            })}

                                            {block.degree && block.majors.length < MAX_SIGNUP_MAJORS && (
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    className="pixel-button text-xs px-3 py-2"
                                                    onClick={() =>
                                                        setSignupValues((prev) => {
                                                            const copy = [...prev.degreeBlocks];
                                                            copy[dIdx] = {
                                                                ...copy[dIdx],
                                                                majors: [...copy[dIdx].majors, null],
                                                            };
                                                            return { ...prev, degreeBlocks: copy };
                                                        })
                                                    }
                                                >
                                                    Add major
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {signupValues.degreeBlocks.length < MAX_SIGNUP_DEGREES && (
                                    <button
                                        type="button"
                                        disabled={loading}
                                        className="pixel-button text-xs px-3 py-2"
                                        onClick={() =>
                                            setSignupValues((prev) => ({
                                                ...prev,
                                                degreeBlocks: [
                                                    ...prev.degreeBlocks,
                                                    { degree: null, majors: [null] },
                                                ],
                                            }))
                                        }
                                    >
                                        Add another degree
                                    </button>
                                )}
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 font-pixelify text-sm mb-4 text-center sm:text-left">
                                {error}
                            </p>
                        )}

                        <div className="flex justify-end gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="font-pixelify hover:cursor-pointer px-4 py-2 rounded-lg border-2 border-white/40 hover:border-white transition"
                            >
                                cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={loading}
                                className="hover:cursor-pointer font-pixelify px-4 py-2 rounded-lg border-2 border-white bg-white text-black hover:bg-gray-200 transition"
                            >
                                {loading ? "submitting..." : confirmLabel}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <p className="font-silkscreen text-xl text-white mb-2">
                            Response submitted
                        </p>
                        <p className="font-pixelify text-sm text-white/70">
                            See you there!
                        </p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default GenericRSVPDialog;
