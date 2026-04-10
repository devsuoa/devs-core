import { useState, useCallback, useRef, useEffect } from "react";
import PixelatedButton from "./PixelatedButton";
import GenericRSVPDialog from "./GenericRSVPDialog";
import { rsvpToEvent, startPaidEventCheckout } from "../lib/eventsRSVPController";
import { NotMemberError } from "../lib/eventsRSVPController";
import { uploadBankPaymentProofScreenshot } from "../lib/manageEventsController";
import { setNeedSignupIntent } from "../lib/eventRsvpMemberFlowStorage";
import { showSiteToast } from "./SiteToast";
import { useNavigate } from "react-router-dom";
import { formatEventDate } from "../lib/eventsController";
import { RSVPQuestion } from "../lib/eventRsvpTypes";

type EventsCardProps = {
  /** Event ID */
  id: string;

  /** Event Title */
  title: string;

  /**
   * Event Image
   * MUST BE THE SAME AS INSTAGRAM IMAGE
   */
  image: string;

  /**
   * Image Alt Text
   */
  imageAlt: string;

  /**
   * Event Tag
   * @example "Tech, Comps, Social, Industry"
   */
  tag: string;

  /**
   * Event Date
   * Format: YYYY-MM-DD
   * Note: Automatically formatted to Day-Date-Month
   * @example "2025-12-21"
   */
  date: string;

  /**
   * Event Time
   * @example "10:00 AM - 6:00 PM"
   */
  time: string;

  /**
   * Event Location
   * @example "201-311"
   */
  location: string;

  /**
   * Short Event Description
   * LIMITED TO 6 LINES
   * @example "Learn how to contribute to open source projects and collaborate effectively on GitHub."
   */
  description: string;

  /**
   * Event Registration URL
   * If null, register button will be hidden
   * @example "https://devsuoa.com/register"
   */
  registerUrl?: string;
  paymentEnabled?: boolean;
  chargeAmount?: number | null;
  bankTransferEnabled?: boolean;
  groupRSVPEnabled?: boolean;
  groupRSVPMaxEmails?: number | null;
  rsvpQuestions?: RSVPQuestion[];

  /**
   * Additional CSS Classes
   * @example "w-[320px] h-[460px]"
   */
  className?: string;

  /**
   * Controlled flip state (optional)
   * When provided, the card flip is controlled externally
   */
  isFlipped?: boolean;

  /**
   * Callback when flip state changes
   * Called with the new flip state
   */
  onFlipChange?: (flipped: boolean) => void;

  /** After returning from /join signup — prefill and open RSVP (from parent). */
  postJoinRsvpEmail?: string;
};

const EventsCard = ({
  id,
  title,
  image,
  imageAlt,
  date,
  time,
  location,
  description,
  registerUrl,
  paymentEnabled = false,
  chargeAmount = null,
  bankTransferEnabled = false,
  groupRSVPEnabled = false,
  groupRSVPMaxEmails = null,
  rsvpQuestions = [],
  className,
  isFlipped: controlledFlipped,
  onFlipChange,
  postJoinRsvpEmail,
}: EventsCardProps) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [frontHeight, setFrontHeight] = useState(0);
  const frontRef = useRef<HTMLDivElement>(null);
  const resumeHandledRef = useRef(false);
  const navigate = useNavigate();
  const [resumeRsvpEmail, setResumeRsvpEmail] = useState<string | undefined>(
    undefined,
  );

  // Track front face height so back face can use it as min-height
  useEffect(() => {
    const el = frontRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setFrontHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  
  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledFlipped !== undefined;
  const flipped = isControlled ? controlledFlipped : internalFlipped;
  
  const setFlipped = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(flipped) : value;
    if (isControlled) {
      onFlipChange?.(newValue);
    } else {
      setInternalFlipped(newValue);
    }
  }, [isControlled, flipped, onFlipChange]);

  useEffect(() => {
    resumeHandledRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!postJoinRsvpEmail || resumeHandledRef.current) return;
    resumeHandledRef.current = true;
    setResumeRsvpEmail(postJoinRsvpEmail);
    setRsvpOpen(true);
    setFlipped(true);
  }, [postJoinRsvpEmail, setFlipped]);

  const eventDate = new Date(date).getTime()/1000;
  const today = Date.now()/1000;
  const isPastEvent = eventDate < today;
  const formattedDate = formatEventDate(date);
  const showCostDisclaimer = paymentEnabled && chargeAmount !== null && chargeAmount >= 0;
  const formattedChargeAmount = showCostDisclaimer
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "NZD",
        minimumFractionDigits: 2,
      }).format(chargeAmount)
    : "";

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements inside the card
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (!rsvpOpen) {
      setFlipped(!flipped);
    }
  }, [rsvpOpen, flipped, setFlipped]);

  return (
    <div
      id={`event-card-${id}`}
      className={`relative transition-transform duration-300 ease-out cursor-pointer ${
        flipped ? 'lg:scale-115 z-50' : ''
      } ${
        className || ""
      }`}
      onClick={handleCardClick}
    >
      <div
        className={`relative w-[75vw] sm:w-[44vw] md:w-[40vw] lg:w-[28vw] xl:w-[26vw] 2xl:w-[22vw] aspect-4/5 perspective transition-all duration-500 preserve-3d overflow-visible
        ${flipped ? "rotate-y-180" : ""}`}
      >
        {/* FRONT */}
        <div ref={frontRef} className="absolute inset-0 backface-hidden">
          <img src={image} alt={imageAlt} className="w-full h-full pixelated" />
        </div>

        {/* BACK */}
        <div className="absolute left-0 right-0 top-0 backface-hidden rotate-y-180" style={{ minHeight: frontHeight || '100%' }}>
          <div className="border-2 border-white bg-[#0e1026] flex flex-col relative" style={{ minHeight: frontHeight || '100%' }}>
            {/* Subtle diagonal scan lines overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, white 2px, white 3px)",
              }}
            />
            {/* Corner glow accents */}
            <div className="absolute top-0 left-0 w-16 h-16 bg-purple-500/10 blur-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-indigo-500/10 blur-xl pointer-events-none" />

            {/* top row - title */}
            <div
              className="relative px-4 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-3 md:py-4 lg:py-5 border-b-2 border-white/60 flex justify-center items-center shrink-0">
              {/* Corner bracket - top left */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-t-2 border-white/40" />
              {/* Corner bracket - top right */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-t-2 border-white/40" />
              {/* Corner bracket - bottom left */}
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-b-2 border-white/40" />
              {/* Corner bracket - bottom right */}
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-b-2 border-white/40" />
              <h3
                className={`font-silkscreen text-white text-center ${
                  title.length > 50
                    ? "text-sm sm:text-base md:text-lg lg:text-xl leading-[1.2]"
                    : title.length > 23
                    ? "text-base sm:text-lg md:text-xl lg:text-2xl leading-[1.3]"
                    : "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-tight"
                }`}
              >
                {title}
              </h3>
            </div>

            {/* Date row */}
            <div className="relative p-2 sm:p-2.5 md:p-3 lg:p-3.5 border-b-2 border-white/60 font-silkscreen text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white flex items-center justify-start gap-2 group">
              {/* Hover accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-400/0 group-hover:bg-purple-400/60 transition-colors" />
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{formattedDate}</span>
            </div>

            {/* Time row */}
            <div className="relative p-2 sm:p-2.5 md:p-3 lg:p-3.5 border-b-2 border-white/60 font-silkscreen text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white flex items-center justify-start gap-2 group">
              {/* Hover accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-400/0 group-hover:bg-indigo-400/60 transition-colors" />
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <polyline
                  points="12 6 12 12 16 14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{time}</span>
            </div>

            {/* location */}
            <div className="relative p-2 sm:p-2.5 md:p-3 lg:p-3.5 border-b-2 border-white/60 font-silkscreen text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white flex items-center justify-start gap-2 group">
              {/* Hover accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400/0 group-hover:bg-cyan-400/60 transition-colors" />
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="3" strokeWidth="2" />
              </svg>
              <span>{location}</span>
            </div>

            {showCostDisclaimer && (
              <div className="relative p-2 sm:p-2.5 md:p-3 lg:p-3.5 border-b-2 border-white/60 font-silkscreen text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white flex items-center justify-start gap-2 group">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400/0 group-hover:bg-amber-400/60 transition-colors" />
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75ZM1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V6.31673C14.3804 6.60867 15.75 7.83361 15.75 9.5C15.75 9.91421 15.4142 10.25 15 10.25C14.5858 10.25 14.25 9.91421 14.25 9.5C14.25 8.65573 13.3765 7.75 12 7.75C10.6235 7.75 9.75 8.65573 9.75 9.5C9.75 10.3443 10.6235 11.25 12 11.25C13.9372 11.25 15.75 12.5828 15.75 14.5C15.75 16.1664 14.3804 17.3913 12.75 17.6833V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V17.6833C9.61957 17.3913 8.25 16.1664 8.25 14.5C8.25 14.0858 8.58579 13.75 9 13.75C9.41421 13.75 9.75 14.0858 9.75 14.5C9.75 15.3443 10.6235 16.25 12 16.25C13.3765 16.25 14.25 15.3443 14.25 14.5C14.25 13.6557 13.3765 12.75 12 12.75C10.0628 12.75 8.25 11.4172 8.25 9.5C8.25 7.83361 9.61957 6.60867 11.25 6.31673V6C11.25 5.58579 11.5858 5.25 12 5.25Z"
                    fill="currentColor"
                  />
                </svg>
                <span>
                  {formattedChargeAmount} per person
                </span>
              </div>
            )}

            {/* Description */}
            <div className="relative flex-1 min-h-0 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-8 pt-3 sm:pt-4 md:pt-5 lg:pt-4 pb-2 sm:pb-3 h-auto">
              <p
                className="font-rethink text-white leading-relaxed overflow-y-auto"
                style={{
                  fontSize: "clamp(0.8rem, 1.1vw, 1.05rem)",
                }}
              >
                {description}
              </p>
            </div>

            {/* Register button, share button */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 shrink-0 flex justify-between items-center gap-2 sm:gap-3">
              {/* Share button */}
              <button
                className="bg-transparent hover:bg-white/10 transition-colors w-[32px] sm:w-[40px] md:w-[45px] h-[32px] sm:h-[40px] md:h-[45px] shrink-0 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: title,
                      text: description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showSiteToast("Link copied!", {
                      variant: "success",
                      autoClose: 2500,
                      position: "bottom-center",
                    });
                  }
                }}
                title="Share event"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>

              {/* Register button */}
              {!isPastEvent ? (
                <PixelatedButton
                  inactive="/buttons/register/register_inactive.png"
                  hover="/buttons/register/register_hover.png"
                  clicked="/buttons/register/register_click.png"
                  className="w-[80px] sm:w-[100px] md:w-[120px] lg:w-[145px]"
                  onClick={() => {
                    if (registerUrl) {
                      window.open(registerUrl, "_blank", "noopener,noreferrer");
                      return;
                    }

                    setFlipped(true);
                    setRsvpOpen(true);
                  }}
                />
              ) : (
                <div />
              )}
            </div>
          </div>  
        </div>
      </div>

      <GenericRSVPDialog
        open={rsvpOpen}
        onClose={() => {
          setRsvpOpen(false);
          setFlipped(false);
          setResumeRsvpEmail(undefined);
        }}
        initialLeaderEmail={resumeRsvpEmail}
        groupRSVPEnabled={groupRSVPEnabled}
        groupRSVPMaxEmails={groupRSVPMaxEmails}
        paymentEnabled={paymentEnabled}
        chargeAmount={chargeAmount}
        bankTransferEnabled={bankTransferEnabled}
        rsvpQuestions={rsvpQuestions}
        onConfirm={async ({
          leaderEmail,
          groupEmails,
          dietaryRequirements,
          answers,
          paymentMethod,
          bankPaymentProofFile,
        }) => {
          try {
            const basePayload = {
              eventId: id,
              leaderEmail,
              groupEmails,
              dietaryRequirements: dietaryRequirements || null,
              answers,
            };

            if (paymentEnabled && chargeAmount !== null && chargeAmount > 0) {
              if (paymentMethod === "bank_transfer") {
                if (!bankPaymentProofFile) {
                  throw new Error("Payment confirmation screenshot is required.");
                }
                const proofPath = await uploadBankPaymentProofScreenshot(
                  title,
                  bankPaymentProofFile,
                  leaderEmail,
                );
                await rsvpToEvent({
                  ...basePayload,
                  paymentMethod: "bank_transfer",
                  bankPaymentProofPath: proofPath,
                });
                return;
              }
              await startPaidEventCheckout(basePayload);
              return;
            }

            await rsvpToEvent(basePayload);
          } catch (error) {
            if (error instanceof NotMemberError) {
              setNeedSignupIntent(id, leaderEmail);
              showSiteToast("Please sign up first", {
                position: "top-center",
              });
              navigate("/join");
              throw error;
            }
            throw error;
          }
        }}
      />
    </div>
  );
};


export default EventsCard;
