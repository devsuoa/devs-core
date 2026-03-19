import React, { useState, useEffect } from "react";
import { AlreadyRSVPedError } from "../lib/eventsRSVPController";
import { createPortal } from "react-dom";

type GenericRSVPDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (email: string, dietaryRequirements: string | null) => Promise<void> | void;
};

const GenericRSVPDialog: React.FC<GenericRSVPDialogProps> = ({ open, onClose, onConfirm }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dietaryRequirements, setDietaryRequirements] = useState("");

  const handleConfirm = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await onConfirm(email, dietaryRequirements);

      setLoading(false);
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
        setDietaryRequirements("");
        onClose();
      }, 3000);
    } catch (err) {
      setLoading(false);

      if (err instanceof AlreadyRSVPedError) {
        setError("You have already RSVP'd to this event");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

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
  }, [open, submitted, loading, email, dietaryRequirements]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 p-4 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border-2 border-white bg-[#04060f] p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {!submitted ? (
          <>
            <h2 className="font-silkscreen text-xl mb-6">RSVP</h2>

            {/* EMAIL INPUT */}
            <div className="mb-6 text-left">
              <label htmlFor="email" className="font-pixelify block" style={{ marginBottom: "16px" }}>
                email address<span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-rethink w-full bg-transparent border-white/20 border-2 p-2 rounded focus:border-white outline-none transition-colors"
                placeholder="admin@devsuoa.com"
                required
                disabled={loading}
              />

              <label htmlFor="dietaryRequirements" className="font-pixelify block my-4">
                dietary requirements
              </label>
              <textarea
                id="dietaryRequirements"
                className="w-full font-rethink bg-transparent border-white/20 border-2 p-2 rounded focus:border-white outline-none min-h-[100px]"
                placeholder="Dietary requirements (e.g. vegetarian, halal, allergies)"
                value={dietaryRequirements}
                onChange={(e) => setDietaryRequirements(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 font-pixelify text-sm mb-4">{error}</p>}

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
            <p className="font-silkscreen text-xl text-white mb-2">Response submitted</p>
            <p className="font-pixelify text-sm text-white/70">See you there!</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default GenericRSVPDialog;
