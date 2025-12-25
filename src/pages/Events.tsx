import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PageTitle } from "../components/PageTitle";
import EventsCard from "../components/EventsCard";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import { useEvents, formatEventDate } from "../lib/eventsController";

const Events = () => {
  const { upcomingEvents, pastEvents, loading, error } = useEvents();

  React.useEffect(() => {
    if (!isFeatureEnabled("events_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled("events_page_is_enabled")) {
    return null;
  }

  if (loading) {
    return (
      <>
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
        <Header />
        <div className="flex justify-center mt-[20vh] min-h-[80vh]">
          <p className="font-pixelify text-red-400">{error}</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* UPCOMING */}
      <PageTitle title="Upcoming Events" className="mt-[5vh]" />

      <section className="px-12 mb-[10vh] min-h-[30vh]">
        {upcomingEvents.length === 0 ? (
          <p className="font-pixelify text-white text-center">
            No upcoming events.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center">
            {upcomingEvents.map((event) => (
              <EventsCard
                id={event.id}
                key={event.id}
                title={event.title}
                image={event.image_url || "/events/placeholder_event.png"}
                imageAlt={event.title}
                tag={event.tag || "Event"}
                date={formatEventDate(event.event_date)}
                time={event.event_time || ""}
                location={event.location || ""}
                description={event.description || ""}
                registerUrl={event.register_url || ""}
              />
            ))}
          </div>
        )}
      </section>

      {/* PAST */}
      {pastEvents.length > 0 && (
        <>
          <PageTitle title="Past Events" className="mt-4" />

          <section className="px-12 mb-[10vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center opacity-70">
              {pastEvents.map((event) => (
                <EventsCard
                  id={event.id}
                  key={event.id}
                  title={event.title}
                  image={event.image_url || "/events/placeholder_event.png"}
                  imageAlt={event.title}
                  tag={event.tag || "Event"}
                  date={formatEventDate(event.event_date)}
                  time={event.event_time || ""}
                  location={event.location || ""}
                  description={event.description || ""}
                  registerUrl="" // disable CTA for past events
                />
              ))}
            </div>
          </section>
        </>
      )}

      <Footer />
    </>
  );
};

export default Events;
