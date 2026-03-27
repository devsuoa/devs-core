import { useState, useCallback, useRef, useEffect } from "react";
import PixelatedButton from "./PixelatedButton";
import GenericRSVPDialog from "./GenericRSVPDialog";
import { rsvpToEvent } from "../lib/eventsRSVPController";
import { NotMemberError } from "../lib/eventsRSVPController";
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
        rsvpQuestions={rsvpQuestions}
        onConfirm={async ({ leaderEmail, groupEmails, dietaryRequirements, answers }) => {
          try {
            await rsvpToEvent({
              eventId: id,
              leaderEmail,
              groupEmails,
              dietaryRequirements: dietaryRequirements || null,
              answers,
            });
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
