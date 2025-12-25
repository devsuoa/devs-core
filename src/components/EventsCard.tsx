import { useState } from "react";
import PixelatedButton from "./PixelatedButton";
import GenericRSVPDialog from "./GenericRSVPDialog";
import { rsvpToEvent } from "../lib/eventsRSVPController";
import { NotMemberError } from "../lib/eventsRSVPController";
import { useNavigate } from "react-router-dom";

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

  /**
   * Additional CSS Classes
   * @example "w-[320px] h-[460px]"
   */
  className?: string;
};

const EventsCard = ({
  id,
  title,
  image,
  imageAlt,
  tag,
  date,
  time,
  location,
  description,
  registerUrl,
  className,
}: EventsCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const navigate = useNavigate();
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPastEvent = eventDate < today;

  return (
    <div
      className={`relative w-[320px] h-[460px] perspective ${className || ""}`}
      onClick={() => {
        if (isTouchDevice && !rsvpOpen) setFlipped(!flipped);
      }}
      onMouseEnter={() => {
        if (!isTouchDevice && !rsvpOpen) setFlipped(true);
      }}
      onMouseLeave={() => {
        if (!isTouchDevice && !rsvpOpen) setFlipped(false);
      }}
    >

      <div
        className={`relative w-full h-full transition-transform duration-500 preserve-3d
        ${flipped ? "rotate-y-180" : ""}`}
      >
        {/* FRONT */}
        <div className="absolute inset-0 backface-hidden">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full pixelated border-2 border-white"
          />
        </div>

        {/* BACK */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full border-2 border-white bg-[#0e1026] flex flex-col">
            {/* top row - title & tag */}
            <div className="p-6 border-b-2 border-white flex justify-between items-start">
              <h3 className="font-silkscreen text-white text-lg leading-tight">
                {title}
              </h3>
              <div className="border-2 border-white bg-[#6b7fd7] px-3 py-1 font-pixelify text-xs text-white">
                {tag}
              </div>
            </div>

            {/* Mid row - date & time */}
            <div className="flex border-b-2 border-white">
              <div className="w-1/2 p-4 border-r-2 border-white font-pixelify text-sm text-white">
                {date}
              </div>
              <div className="w-1/2 p-4 font-pixelify text-sm text-white">
                {time}
              </div>
            </div>

            {/* location */}
            <div className="p-4 border-b-2 border-white font-pixelify text-sm text-white">
              {location}
            </div>

            {/* Description - LIMITED TO 6 LINES */}
            <div className="flex-1 px-6 py-4 font-rethink text-white text-sm leading-relaxed overflow-hidden">
              <p className="line-clamp-6">{description}</p>
            </div>

            {/* Register button */}
            <div className="p-6">
              {registerUrl && !isPastEvent && (
                <PixelatedButton
                  inactive="/buttons/register/register_inactive.png"
                  hover="/buttons/register/register_hover.png"
                  clicked="/buttons/register/register_click.png"
                  className="w-[140px]"
                  onClick={() => {
                    setFlipped(true);
                    setRsvpOpen(true);
                  }}
                />
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
        }}
        onConfirm={async (email) => {
          try {
            await rsvpToEvent(id, email);
          } catch (error) {
            if (error instanceof NotMemberError) {
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