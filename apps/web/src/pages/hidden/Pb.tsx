import React from "react";
import { isFeatureEnabled } from "../../lib/featureFlags";
import { onPageNotFound } from "../../lib/pageNotFoundController";

const Pb: React.FC = () => {
  React.useEffect(() => {
    if (!isFeatureEnabled("pb_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled("pb_page_is_enabled")) {
    return null;
  }

  return (
    <div className="bg-black text-white font-serif">
      {/* HERO VIDEO */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src="https://videos.pexels.com/video-files/857195/857195-hd_1280_720_25fps.mp4"
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center text-center px-6">
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wide">
              PHOEBE FUNG
            </h1>
            <p className="uppercase tracking-[0.25em] text-xs sm:text-sm opacity-80">
              Elegance, Clarity, Grace
            </p>
            <p className="italic opacity-70 text-sm sm:text-base">Est. effortlessly</p>
          </div>
        </div>
      </section>

      {/* STATEMENT SECTION */}
      <section className="py-20 sm:py-28 md:py-32 px-6 max-w-4xl mx-auto text-center">
        <p className="text-xl sm:text-2xl leading-relaxed">
          Some people build careers.
          <br className="hidden sm:block" />
          Phoebe builds presence.
        </p>
        <p className="mt-6 sm:mt-8 opacity-70 text-sm sm:text-base">
          This is not a portfolio.
          <br className="hidden sm:block" />
          This is recognition.
        </p>
      </section>

      {/* IMAGE GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-2 px-2">
        <img
          src="/hidden/pb_1.jpg"
          className="h-[280px] sm:h-[360px] md:h-[500px] w-full object-cover"
        />
        <img
          src="/hidden/pb_3.jpg"
          className="h-[280px] sm:h-[360px] md:h-[500px] w-full object-cover"
        />
        <img
          src="/hidden/pb_2.jpg"
          className="h-[280px] sm:h-[360px] md:h-[500px] w-full object-cover"
        />
      </section>

      {/* QUOTE SECTION */}
      <section className="py-24 sm:py-32 md:py-40 px-6 bg-neutral-950 text-center">
        <blockquote className="max-w-3xl mx-auto text-xl sm:text-2xl md:text-3xl italic leading-snug">
          “Competence, composure, and confidence —
          <br className="hidden sm:block" />
          without needing to announce it.”
        </blockquote>
        <p className="mt-6 text-xs sm:text-sm uppercase tracking-widest opacity-60">
          — Observed phenomenon
        </p>
      </section>

      {/* SECOND VIDEO — ELEGANCE */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src="https://videos.pexels.com/video-files/855265/855265-hd_1920_1080_24fps.mp4"
        />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 py-16">
          <p className="uppercase tracking-[0.35em] text-xs sm:text-sm opacity-60 mb-4 sm:mb-6">
            Invitation Only
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-6xl leading-tight mb-8 sm:mb-10">
            Elegance
            <br />
            does not announce itself.
          </h2>

          <div className="max-w-xl space-y-5 sm:space-y-6 text-base sm:text-lg opacity-80">
            <p>
              It arrives early.
              <br />
              Listens closely.
              <br />
              Speaks with intention.
            </p>

            <p>
              It is felt in timing,
              <br />
              restraint,
              <br />
              and quiet confidence.
            </p>

            <p className="italic opacity-70">
              Some people have it.
              <br />
              Phoebe embodies it.
            </p>
          </div>

          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-8 text-[10px] sm:text-xs uppercase tracking-widest opacity-50">
            <span>Composure</span>
            <span>Clarity</span>
            <span>Grace</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 sm:py-24 text-center text-xs sm:text-sm opacity-50 px-6">
        <p>This page is a compliment.</p>
        <p className="mt-2">
          Please note that this page is an internal joke used by the DEVS Team.
        </p>
      </footer>
    </div>
  );
};

export default Pb;
