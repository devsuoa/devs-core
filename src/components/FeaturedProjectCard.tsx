import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelatedButton from "./PixelatedButton";
import CachedImage from "./CachedImage";
import { FeaturedProject } from "../lib/projectsController";

type FeaturedProjectCardProps = {
  /** The project to display */
  project: FeaturedProject;

  /**
   * Additional CSS classes
   * @example "max-w-5xl"
   */
  className?: string;
};

/** Minimum drag distance, in px, that counts as a swipe between photos. */
const SWIPE_THRESHOLD = 50;

/**
 * Full-width showcase card for a single featured project.
 *
 * Front face is the cover shot; clicking it flips the card, matching the
 * interaction in `EventsCard`. The back face pairs a photo gallery -- each
 * photo carrying its own caption -- with the write-up and the team list.
 * The gallery is interactive, so the back face flips closed only via its
 * explicit close control or the Escape key, never by clicking the photos.
 */
const FeaturedProjectCard = ({ project, className }: FeaturedProjectCardProps) => {
  const { id, title, event, period, award, coverImage, coverAlt, team, stack, description, url, photos } =
    project;

  const [flipped, setFlipped] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [frontHeight, setFrontHeight] = useState(0);
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const [swipeEnd, setSwipeEnd] = useState<number | null>(null);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const total = photos.length;
  const activePhoto = photos[photoIndex];

  // Track the front face height so the back face can match it exactly, keeping
  // the card a stable rectangle instead of growing to fit the write-up.
  useEffect(() => {
    const el = frontRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setFrontHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (next: number) => setPhotoIndex(((next % total) + total) % total),
    [total],
  );
  const nextPhoto = useCallback(() => goTo(photoIndex + 1), [goTo, photoIndex]);
  const prevPhoto = useCallback(() => goTo(photoIndex - 1), [goTo, photoIndex]);

  const open = useCallback(() => setFlipped(true), []);

  const close = useCallback(() => {
    setFlipped(false);
    setPhotoIndex(0);
  }, []);

  // Escape closes the card; arrow keys move through the gallery while it is open.
  useEffect(() => {
    if (!flipped) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") nextPhoto();
      else if (e.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, close, nextPhoto, prevPhoto]);

  // Move focus onto the open face so keyboard users land inside the gallery.
  useEffect(() => {
    if (flipped) backRef.current?.focus();
  }, [flipped]);

  const onFrontKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    open();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setSwipeEnd(null);
    setSwipeStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setSwipeEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (swipeStart === null || swipeEnd === null) return;
    const distance = swipeStart - swipeEnd;
    if (distance > SWIPE_THRESHOLD) nextPhoto();
    else if (distance < -SWIPE_THRESHOLD) prevPhoto();
    setSwipeStart(null);
    setSwipeEnd(null);
  };

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center border-2 border-white bg-[#0e1026]/70 font-silkscreen text-white transition-colors hover:bg-[#622ACB]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9060F0]";

  return (
    <div
      id={`project-${id}`}
      className={`relative mx-auto w-[92vw] max-w-[1100px] ${className || ""}`}
    >
      <div
        className={`relative aspect-4/5 md:aspect-16/10 perspective preserve-3d transition-all duration-500 ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* ---------- FRONT ---------- */}
        <div
          ref={frontRef}
          role="button"
          tabIndex={flipped ? -1 : 0}
          aria-hidden={flipped}
          aria-label={`${title}, ${event}. Show project details`}
          onClick={open}
          onKeyDown={onFrontKeyDown}
          className="absolute inset-0 backface-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9060F0]"
        >
          <div className="relative h-full w-full overflow-hidden border-2 border-white">
            <CachedImage
              src={coverImage}
              alt={coverAlt}
              className="h-full w-full object-cover pixelated"
            />

            {/* Legibility wash */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0e1026] via-[#0e1026]/85 to-transparent" />

            {/* Chips */}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="border border-[#9060F0] bg-[#622ACB]/80 px-2 py-1 font-pixelify text-xs uppercase tracking-wide text-white sm:text-sm">
                {event}
              </span>
              {award && (
                <span className="border border-[#EB75C5] bg-[#9D4CB7]/70 px-2 py-1 font-pixelify text-xs uppercase tracking-wide text-white sm:text-sm">
                  {award}
                </span>
              )}
            </div>

            {/* Caption block */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 md:p-9">
              <h2 className="font-silkscreen text-2xl leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {title}
              </h2>
              <p className="mt-2 font-pixelify text-sm text-[#B8C0E7] sm:text-base md:text-lg">
                {period} &middot; {team.length} members
              </p>
              <p className="mt-3 font-pixelify text-xs text-white/50 sm:text-sm">
                click to view the build &rarr;
              </p>
            </div>
          </div>
        </div>

        {/* ---------- BACK ---------- */}
        <div
          ref={backRef}
          tabIndex={-1}
          aria-hidden={!flipped}
          className="absolute inset-0 backface-hidden rotate-y-180 focus:outline-none"
          style={{ height: frontHeight || undefined }}
        >
          <div className="relative flex h-full flex-col overflow-hidden border-2 border-white bg-[#0e1026]">
            {/* Diagonal scan lines */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, white 2px, white 3px)",
              }}
            />
            {/* Corner glow accents */}
            <div className="pointer-events-none absolute left-0 top-0 h-24 w-24 bg-[#9D4CB7]/10 blur-xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 bg-[#6E80DA]/10 blur-xl" />

            {/* Title bar */}
            <div className="relative flex shrink-0 items-center justify-between gap-3 border-b-2 border-white/60 px-4 py-3 md:px-6 md:py-4">
              <div className="min-w-0">
                <h2 className="truncate font-silkscreen text-base text-white sm:text-lg md:text-2xl">
                  {title}
                </h2>
                <p className="mt-1 font-pixelify text-xs text-[#B8C0E7] sm:text-sm">
                  {event} &middot; {period}
                  {award ? ` · ${award}` : ""}
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Close project details"
                className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-white font-silkscreen text-white transition-colors hover:bg-[#622ACB]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9060F0]"
              >
                &times;
              </button>
            </div>

            {/* Body: gallery + details */}
            <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
              {/* ----- Gallery ----- */}
              <div className="flex min-h-0 flex-col border-b-2 border-white/60 md:w-[58%] md:border-b-0 md:border-r-2">
                <div
                  className="relative min-h-0 flex-1 overflow-hidden bg-black/40"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={photoIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <CachedImage
                        src={activePhoto.src}
                        alt={activePhoto.alt}
                        className="h-full w-full object-cover pixelated"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {total > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        aria-label="Previous photo"
                        className={`${arrowClass} left-3`}
                      >
                        {"<"}
                      </button>
                      <button
                        onClick={nextPhoto}
                        aria-label="Next photo"
                        className={`${arrowClass} right-3`}
                      >
                        {">"}
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  <span className="absolute right-3 top-3 border border-white/40 bg-[#0e1026]/80 px-2 py-1 font-pixelify text-xs text-[#B8C0E7]">
                    {photoIndex + 1} / {total}
                  </span>
                </div>

                {/* Caption for the active photo */}
                <div className="relative shrink-0 border-t-2 border-white/60 px-4 py-3 md:px-5">
                  <div className="min-h-[2.75rem] sm:min-h-[3rem]">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={photoIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="font-rethink text-xs leading-relaxed text-white sm:text-sm md:text-base"
                      >
                        {activePhoto.caption}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Dots */}
                  {total > 1 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {photos.map((photo, i) => (
                        <button
                          key={photo.src + i}
                          onClick={() => goTo(i)}
                          aria-label={`Go to photo ${i + 1}`}
                          aria-current={i === photoIndex}
                          className={`h-2.5 w-2.5 border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9060F0] ${
                            i === photoIndex
                              ? "border-[#9060F0] bg-[#9060F0]"
                              : "border-white/40 bg-transparent hover:border-white"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ----- Details ----- */}
              <div className="flex min-h-0 flex-1 flex-col md:w-[42%]">
                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                  {description.split("\n\n").map((paragraph, i) => (
                    <p
                      key={i}
                      className="mb-3 font-rethink text-xs leading-relaxed text-white last:mb-0 sm:text-sm md:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Team */}
                <div className="shrink-0 border-t-2 border-white/60 px-4 py-3 md:px-6">
                  <p className="font-pixelify text-xs uppercase tracking-wide text-white/50">
                    Team
                  </p>
                  <p className="mt-1 font-rethink text-xs text-white sm:text-sm md:text-base">
                    {team.join(", ")}
                  </p>
                </div>

                {/* Stack */}
                <div className="flex shrink-0 flex-wrap gap-1.5 border-t-2 border-white/60 px-4 py-3 md:px-6">
                  {stack.map((tech) => (
                    <span
                      key={tech}
                      className="border border-[#6E80DA] px-2 py-0.5 font-pixelify text-[0.7rem] text-[#B8C0E7] sm:text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action */}
                {url && (
                  <div className="flex shrink-0 items-center justify-end border-t-2 border-white/60 px-4 py-3 md:px-6">
                    <PixelatedButton
                      inactive="/buttons/learn/learn_more_inactive.png"
                      hover="/buttons/learn/learn_more_hover.png"
                      clicked="/buttons/learn/learn_more_click.png"
                      className="w-[110px] md:w-[140px]"
                      alt={`Visit ${title}`}
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProjectCard;
