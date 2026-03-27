import React, { useState, useEffect } from "react";
import {
    AlreadyRSVPedError,
    EventFullError,
    GroupRSVPSizeExceededError,
    RSVPAnswers,
} from "../lib/eventsRSVPController";
import { RSVPQuestion } from "../lib/eventRsvpTypes";

type GenericRSVPDialogProps = {
    open: boolean;
    onClose: () => void;
    groupRSVPEnabled: boolean;
    groupRSVPMaxEmails: number | null;
    rsvpQuestions: RSVPQuestion[];
    onConfirm: (payload: {
        leaderEmail: string;
        groupEmails: string[];
        dietaryRequirements: string | null;
        answers: RSVPAnswers;
    }) => Promise<void> | void;
};

const GenericRSVPDialog: React.FC<GenericRSVPDialogProps> = ({
    open,
    onClose,
    groupRSVPEnabled,
    groupRSVPMaxEmails,
    rsvpQuestions,
    onConfirm,
}) => {
    const [leaderEmail, setLeaderEmail] = useState("");
    const [groupEmails, setGroupEmails] = useState<string[]>([""]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dietaryRequirements, setDietaryRequirements] = useState("");
    const [answers, setAnswers] = useState<RSVPAnswers>({});

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
                if (normalizedGroupEmails.length === 0) {
                    setError("Please provide at least one group email.");
                    setLoading(false);
                    return;
                }

                if (
                    groupRSVPMaxEmails !== null &&
                    normalizedGroupEmails.length > groupRSVPMaxEmails
                ) {
                    setError(`Maximum ${groupRSVPMaxEmails} emails allowed for this event.`);
                    setLoading(false);
                    return;
                }
            }

            await onConfirm({
                leaderEmail: leaderEmail.trim().toLowerCase(),
                groupEmails: groupRSVPEnabled ? normalizedGroupEmails : [],
                dietaryRequirements,
                answers,
            });

            setLoading(false);
            setSubmitted(true);

            setTimeout(() => {
                setSubmitted(false);
                setLeaderEmail("");
                setGroupEmails([""]);
                setDietaryRequirements("");
                setAnswers({});
                onClose();
            }, 3000);
        } catch (err) {
            setLoading(false);

            if (err instanceof AlreadyRSVPedError) {
                setError("You have already RSVP'd to this event");
            } else if (err instanceof EventFullError) {
                setError("This event is full.");
            } else if (err instanceof GroupRSVPSizeExceededError) {
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
    }, [open, submitted, loading, leaderEmail, dietaryRequirements, groupEmails, answers]);

    if (!open) return null;

    const visibleGroupFields = groupRSVPEnabled
        ? groupRSVPMaxEmails ?? groupEmails.length
        : 0;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-xl border-2 border-white bg-[#04060f] p-6 text-center max-h-[90vh] overflow-y-auto">
                {!submitted ? (
                    <>
                        <h2 className="font-silkscreen text-xl mb-6">RSVP</h2>

                        {/* EMAIL INPUT */}
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
                                            disabled={loading || groupEmails.length <= 1}
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
                                className="pixel-input w-full mb-12 font-rethink"
                                placeholder="Dietary requirements (e.g. vegetarian, halal, allergies)"
                                value={dietaryRequirements}
                                onChange={(e) => setDietaryRequirements(e.target.value)}
                            />

                            {rsvpQuestions.length > 0 && (
                                <div className="mt-6 text-left">
                                    <p className="font-silkscreen text-sm mb-4">Additional questions</p>
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

                                                            return (
                                                                <label
                                                                    key={`${question.id}-${option}`}
                                                                    className="font-pixelify text-sm flex items-center gap-2"
                                                                >
                                                                    <input
                                                                        type={question.type === "single_select" ? "radio" : "checkbox"}
                                                                        name={question.id}
                                                                        checked={checked}
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
                                                                    {option}
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
                        </div>

                        {error && (
                            <p className="text-red-400 font-pixelify text-sm mb-4">
                                {error}
                            </p>
                        )}

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="font-pixelify hover:cursor-pointer px-4 py-2 rounded-lg border-2 border-white/40 hover:border-white transition"
                            >
                                cancel
                            </button>

                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="hover:cursor-pointer font-pixelify px-4 py-2 rounded-lg border-2 border-white bg-white text-black hover:bg-gray-200 transition"
                            >
                                {loading ? "submitting..." : "confirm"}
                            </button>
                        </div>
                    </>
                ) : (
                    /* SUCCESS MESSAGE */
                    <div className="py-12">
                        <p className="font-silkscreen text-xl text-white mb-2">
                            Response submitted
                        </p>
                        <p className="font-pixelify text-sm text-white/70">
                            See you there!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenericRSVPDialog;
