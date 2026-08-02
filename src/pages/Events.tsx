import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PageTitle } from "../components/PageTitle";
import EventsCard from "../components/EventsCard";
import Pagination from "../components/Pagination";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import { useEvents } from "../lib/eventsController";
import { showSiteToast } from "../components/SiteToast";
import BinaryBackground from "../components/BinaryBackground";

const Events = () => {
  const { upcomingEvents, pastEvents, loading, error } = useEvents();
  pastEvents.reverse().slice();

  // Screen size helpers
  const getScreenSize = () => {
    const width = window.innerWidth;
    if (width < 640) return "mobile"; // < sm
    if (width < 768) return "sm"; // sm - md
    if (width < 1024) return "tablet"; // md - lg (iPad portrait/landscape)
    if (width < 1280) return "desktop"; // lg - xl
    return "large"; // xl+
  };

  // Determine events per page based on screen size
  const getEventsPerPage = (isUpcoming: boolean) => {
    const screen = getScreenSize();
    if (isUpcoming) {
      // Upcoming events: mobile=2, sm=2, tablet=2, desktop+=3
      if (screen === "mobile") return 2;
      if (screen === "sm") return 2;
      if (screen === "tablet") return 2;
      return 3;
    } else {
      // Past events: mobile=3, sm=4, tablet=4, desktop=6, large=6
      if (screen === "mobile") return 3;
      if (screen === "sm") return 4;
      if (screen === "tablet") return 4;
      return 6;
    }
  };

  // state for current page of upcoming and past events
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);

  // state for tag filters
  const [upcomingTagFilter, setUpcomingTagFilter] = useState<string | null>(
    null,
  );
  const [pastTagFilter, setPastTagFilter] = useState<string | null>(null);

  // state for focused event card (for overlay)
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Stripe Checkout success: show confirmation after return (webhook completes RSVP in background)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("rsvp_paid") !== "1") return;

    showSiteToast("RSVP submitted. See you at the event!", {
      variant: "success",
      position: "top-center",
    });
    params.delete("rsvp_paid");
    const next = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: next ? `?${next}` : "",
        hash: location.hash,
      },
      { replace: true },
    );
  }, [location.search, location.pathname, location.hash, navigate]);

  // Extract unique tags from events
  const upcomingTags = useMemo(() => {
    const tags = new Set<string>();
    upcomingEvents.forEach((e) => {
      if (e.tag) {
        e.tag.split(",").forEach((t) => tags.add(t.trim()));
      }
    });
    return Array.from(tags).filter(Boolean);
  }, [upcomingEvents]);

  const pastTags = useMemo(() => {
    const tags = new Set<string>();
    pastEvents.forEach((e) => {
      if (e.tag) {
        e.tag.split(",").forEach((t) => tags.add(t.trim()));
      }
    });
    return Array.from(tags).filter(Boolean);
  }, [pastEvents]);

  // Filter events by tag
  const filteredUpcomingEvents = useMemo(() => {
    if (!upcomingTagFilter) return upcomingEvents;
    return upcomingEvents.filter((e) => {
      if (!e.tag) return false;
      const eventTags = e.tag.split(",").map((t) => t.trim());
      return eventTags.includes(upcomingTagFilter);
    });
  }, [upcomingEvents, upcomingTagFilter]);

  const filteredPastEvents = useMemo(() => {
    if (!pastTagFilter) return pastEvents;
    return pastEvents.filter((e) => {
      if (!e.tag) return false;
      const eventTags = e.tag.split(",").map((t) => t.trim());
      return eventTags.includes(pastTagFilter);
    });
  }, [pastEvents, pastTagFilter]);

  // state for number of events loaded per page based on screen size
  const [upcomingPerPage, setUpcomingPerPage] = useState(() =>
    getEventsPerPage(true),
  );
  const [pastPerPage, setPastPerPage] = useState(() => getEventsPerPage(false));
  // state for animation direction
  const [upcomingDirection, setUpcomingDirection] = useState(1);
  const [pastDirection, setPastDirection] = useState(1);

  // Swipe state
  const [upcomingTouchStart, setUpcomingTouchStart] = useState<number | null>(
    null,
  );
  const [upcomingTouchEnd, setUpcomingTouchEnd] = useState<number | null>(null);
  const [pastTouchStart, setPastTouchStart] = useState<number | null>(null);
  const [pastTouchEnd, setPastTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (!isFeatureEnabled("events_page_is_enabled")) {
      onPageNotFound();
    }

    const handleResize = () => {
      const nextUpcoming = getEventsPerPage(true);
      const nextPast = getEventsPerPage(false);

      setUpcomingPerPage((prev) => {
        if (prev === nextUpcoming) return prev;
        setUpcomingPage((p) => {
          // clamps current page so that it doesnt exceed total pages after perPage change
          const maxPage = Math.max(
            0,
            Math.ceil(filteredUpcomingEvents.length / nextUpcoming) - 1,
          );
          return Math.min(p, maxPage);
        });
        return nextUpcoming;
      });

      setPastPerPage((prev) => {
        if (prev === nextPast) return prev;
        setPastPage((p) => {
          const maxPage = Math.max(
            0,
            Math.ceil(filteredPastEvents.length / nextPast) - 1,
          );
          return Math.min(p, maxPage);
        });
        return nextPast;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onPageNotFound]);

  // Handle URL hash to auto-focus an event card (only on initial load)
  const initialHashProcessed = useRef(false);

  useEffect(() => {
    // Only process hash once on initial load
    if (initialHashProcessed.current) return;

    const hash = location.hash.slice(1); // Remove the # symbol
    if (hash && !loading) {
      // Find the event in upcoming or past events
      const allEvents = [...upcomingEvents, ...pastEvents];
      const targetEvent = allEvents.find((e) => e.id === hash);

      if (targetEvent) {
        initialHashProcessed.current = true;

        // Determine which section and page the event is on
        const isUpcoming = upcomingEvents.some((e) => e.id === hash);
        const eventList = isUpcoming
          ? filteredUpcomingEvents
          : filteredPastEvents;
        const eventIndex = eventList.findIndex((e) => e.id === hash);
        const perPage = isUpcoming ? upcomingPerPage : pastPerPage;
        const targetPage = Math.floor(eventIndex / perPage);

        // Navigate to the correct page first
        if (isUpcoming) {
          setUpcomingPage(targetPage);
        } else {
          setPastPage(targetPage);
        }

        // Set focused event after a short delay to allow page change
        setTimeout(() => {
          setFocusedEventId(hash);
          // Scroll to the card
          const cardElement = document.getElementById(`event-card-${hash}`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
  }, [
    location.hash,
    loading,
    upcomingEvents,
    pastEvents,
    filteredUpcomingEvents,
    filteredPastEvents,
    upcomingPerPage,
    pastPerPage,
  ]);

  // Close focused card when clicking overlay or pressing Escape
  const handleOverlayClick = useCallback(() => {
    setFocusedEventId(null);
    // Clear the hash from URL without page reload
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedEventId) {
        handleOverlayClick();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [focusedEventId, handleOverlayClick]);

  // Handler for card flip changes
  const handleCardFlipChange = useCallback((eventId: string, flipped: boolean) => {
    if (flipped) {
      setFocusedEventId(eventId);
      // Update URL hash
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${eventId}`,
      );
    } else {
      setFocusedEventId(null);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Pagination helper
  const paginate = (items: any[], page: number, perPage: number) => {
    const start = page * perPage;
    return {
      items: items.slice(start, start + perPage),
      totalPages: Math.ceil(items.length / perPage),
    };
  };

  const { items: paginatedUpcomingEvents, totalPages: upcomingTotalPages } = paginate(
    filteredUpcomingEvents,
    upcomingPage,
    upcomingPerPage,
  );
  const { items: paginatedPastEvents, totalPages: pastTotalPages } = paginate(
    filteredPastEvents,
    pastPage,
    pastPerPage,
  );

  // Handlers for page animation direction
  const handleUpcomingPageChange = (newPage: number) => {
    const newDirection = newPage > upcomingPage ? 1 : -1;
    setUpcomingDirection(newDirection);
    setTimeout(() => {
      setUpcomingPage(newPage);
    }, 0);
  };

  const handlePastPageChange = (newPage: number) => {
    const newDirection = newPage > pastPage ? 1 : -1;
    setPastDirection(newDirection);
    setTimeout(() => {
      setPastPage(newPage);
    }, 0);
  };

  // Swipe handlers for upcoming events
  const onUpcomingTouchStart = (e: React.TouchEvent) => {
    setUpcomingTouchEnd(null);
    setUpcomingTouchStart(e.targetTouches[0].clientX);
  };

  const onUpcomingTouchMove = (e: React.TouchEvent) => {
    setUpcomingTouchEnd(e.targetTouches[0].clientX);
  };

  const onUpcomingTouchEnd = () => {
    if (!upcomingTouchStart || !upcomingTouchEnd) return;
    const distance = upcomingTouchStart - upcomingTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && upcomingPage < upcomingTotalPages - 1) {
      handleUpcomingPageChange(upcomingPage + 1);
    }
    if (isRightSwipe && upcomingPage > 0) {
      handleUpcomingPageChange(upcomingPage - 1);
    }
  };

  // Swipe handlers for past events
  const onPastTouchStart = (e: React.TouchEvent) => {
    setPastTouchEnd(null);
    setPastTouchStart(e.targetTouches[0].clientX);
  };

  const onPastTouchMove = (e: React.TouchEvent) => {
    setPastTouchEnd(e.targetTouches[0].clientX);
  };

  const onPastTouchEnd = () => {
    if (!pastTouchStart || !pastTouchEnd) return;
    const distance = pastTouchStart - pastTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && pastPage < pastTotalPages - 1) {
      handlePastPageChange(pastPage + 1);
    }
    if (isRightSwipe && pastPage > 0) {
      handlePastPageChange(pastPage - 1);
    }
  };

  if (!isFeatureEnabled("events_page_is_enabled")) {
    return null;
  }

  if (loading) {
    return (
      <>
        <BinaryBackground />
        <Header />
        <section className="min-h-[80vh]">
          <div className="flex justify-center mt-[20vh]">
            <p className="font-pixelify text-white">Loading events...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <BinaryBackground />
        <Header />
        <div className="flex justify-center mt-[20vh] min-h-[80vh]">
          <p className="font-pixelify text-red-400">{error}</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <main className="relative min-h-screen select-none">
      {/* Focus overlay */}
      <AnimatePresence>
        {focusedEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleOverlayClick}
          />
        )}
      </AnimatePresence>

      <BinaryBackground />

      {/* Purple Star Field Background */}
      {/*<div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-50">
        {starField}
      </div>*/}

      <Header />

      {/* UPCOMING EVENTS */}
      {/* Mobile title */}
      <div className="lg:hidden min-h-[10vh]">
        <PageTitle title="Upcoming Events" className="scale-110 ml-5" />
      </div>

      {/* Desktop title with filter */}
      <div className="hidden lg:flex mx-auto w-[88.75vw] justify-between">
        <PageTitle title="Upcoming Events" className="pl-0! ml-20! scale-110" />
        <div className="flex items-center gap-3 mr-[4.725vw]">
          <span className="font-silkscreen text-white/60 text-base mr-2">
            Filter:
          </span>
          <button
            onClick={() => {
              setUpcomingTagFilter(null);
              setUpcomingPage(0);
            }}
            className={`px-4 py-2 font-silkscreen text-base border transition-colors ${
              upcomingTagFilter === null
                ? "bg-purple-500/30 border-purple-400 text-white"
                : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
            }`}
          >
            All
          </button>
          {upcomingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setUpcomingTagFilter(tag);
                setUpcomingPage(0);
              }}
              className={`px-4 py-2 font-silkscreen text-base border transition-colors ${
                upcomingTagFilter === tag
                  ? "bg-purple-500/30 border-purple-400 text-white"
                  : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <section className="transition-all duration-500 ease-in-out mx-[1vw] sm:mx-[5vw] md:mx-[6vw] lg:mx-[7.5vw] mb-[3vh] sm:mb-[4vh] md:mb-[5vh] min-h-[20vh]">
        {upcomingEvents.length === 0 ? (
          <p className="font-pixelify text-white text-center text-sm sm:text-base">
            No upcoming events.
          </p>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 sm:gap-y-10 md:gap-y-12 lg:gap-y-15 gap-x-4 sm:gap-x-6 md:gap-x-8 justify-items-center"
              onTouchStart={onUpcomingTouchStart}
              onTouchMove={onUpcomingTouchMove}
              onTouchEnd={onUpcomingTouchEnd}
            >
              <AnimatePresence mode="wait" initial={false}>
                {paginatedUpcomingEvents.map((event, index) => (
                  <motion.div
                    key={`${event.id}-${upcomingPage}`}
                    initial={{ opacity: 0, x: upcomingDirection * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: upcomingDirection * -30 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: "easeInOut",
                    }}
                  >
                    <EventsCard
                      id={event.id}
                      title={event.title}
                      image={event.image_url || "/events/placeholder_event.png"}
                      imageAlt={event.title}
                      tag={event.tag || "Event"}
                      date={event.event_date}
                      time={event.event_time || ""}
                      location={event.location || ""}
                      description={event.description || ""}
                      registerUrl={event.register_url || ""}
                      paymentEnabled={event.payment_enabled}
                      chargeAmount={event.charge_amount}
                      bankTransferEnabled={event.bank_transfer_enabled}
                      groupRSVPEnabled={event.group_rsvp_enabled}
                      groupRSVPMaxEmails={event.group_rsvp_max_emails}
                      rsvpQuestions={event.rsvp_questions}
                      isFlipped={focusedEventId === event.id}
                      onFlipChange={(flipped) =>
                        handleCardFlipChange(event.id, flipped)
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {upcomingTotalPages > 1 && (
              <div className="flex justify-center items-center mt-6 sm:mt-8 md:mt-10 font-silkscreen">
                <Pagination
                  currentPage={upcomingPage}
                  totalPages={upcomingTotalPages}
                  onPageChange={handleUpcomingPageChange}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* PAST EVENTS */}
      {/* Mobile title */}
      <div className="lg:hidden">
        <PageTitle title="Past Events" className="scale-110 ml-5" />
      </div>

      {/* Desktop title with filter */}
      <div className="hidden lg:flex mx-auto w-[88.75vw] justify-between">
        <PageTitle title="Past Events" className="pl-0! ml-20! scale-110" />
        <div className="flex items-center gap-3 mr-[4.725vw]">
          <span className="font-silkscreen text-white/60 text-base mr-2">
            Filter:
          </span>
          <button
            onClick={() => {
              setPastTagFilter(null);
              setPastPage(0);
            }}
            className={`px-4 py-2 font-silkscreen text-base border transition-colors ${
              pastTagFilter === null
                ? "bg-purple-500/30 border-purple-400 text-white"
                : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
            }`}
          >
            All
          </button>
          {pastTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setPastTagFilter(tag);
                setPastPage(0);
              }}
              className={`px-4 py-2 font-silkscreen text-base border transition-colors ${
                pastTagFilter === tag
                  ? "bg-purple-500/30 border-purple-400 text-white"
                  : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <section className="transition-all duration-500 ease-in-out mx-[6.5vw] sm:mx-[5vw] md:mx-[6vw] lg:mx-[7.5vw] mb-[3vh] sm:mb-[4vh] md:mb-[5vh] min-h-[20vh]">
        {pastEvents.length === 0 ? (
          <p className="font-pixelify text-white text-center text-sm sm:text-base">
            No past events.
          </p>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 sm:gap-y-10 md:gap-y-12 lg:gap-y-15 gap-x-4 sm:gap-x-6 md:gap-x-8 justify-items-center"
              onTouchStart={onPastTouchStart}
              onTouchMove={onPastTouchMove}
              onTouchEnd={onPastTouchEnd}
            >
              <AnimatePresence mode="wait" initial={false}>
                {paginatedPastEvents.map((event, index) => (
                  <motion.div
                    key={`${event.id}-${pastPage}`}
                    initial={{ opacity: 0, x: pastDirection * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: pastDirection * -30 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: "easeInOut",
                    }}
                  >
                    <EventsCard
                      id={event.id}
                      title={event.title}
                      image={event.image_url || "/events/placeholder_event.png"}
                      imageAlt={event.title}
                      tag={event.tag || "Event"}
                      date={event.event_date}
                      time={event.event_time || ""}
                      location={event.location || ""}
                      description={event.description || ""}
                      registerUrl=""
                      paymentEnabled={event.payment_enabled}
                      chargeAmount={event.charge_amount}
                      bankTransferEnabled={event.bank_transfer_enabled}
                      groupRSVPEnabled={event.group_rsvp_enabled}
                      groupRSVPMaxEmails={event.group_rsvp_max_emails}
                      rsvpQuestions={event.rsvp_questions}
                      isFlipped={focusedEventId === event.id}
                      onFlipChange={(flipped) =>
                        handleCardFlipChange(event.id, flipped)
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {pastTotalPages > 1 && (
              <div className="flex justify-center items-center mt-6 sm:mt-8 md:mt-10 font-silkscreen">
                <Pagination
                  currentPage={pastPage}
                  totalPages={pastTotalPages}
                  onPageChange={handlePastPageChange}
                />
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
};

export default Events;
