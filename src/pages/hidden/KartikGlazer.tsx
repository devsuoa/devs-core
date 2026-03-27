import React from "react";
import { isFeatureEnabled } from "../../lib/featureFlags";
import { onPageNotFound } from "../../lib/pageNotFoundController";

const MARQUEE_ITEMS = [
  "certified legend behaviour ✦",
  "the vibes clock in overtime",
  "main character without the attitude",
  "if charisma was a sound it would be this",
  "everyone’s honorary favourite",
  "npcs could never",
  "best quotes of all time",
  "heard the room get louder when you walked in",
];

const KartikGlazer: React.FC = () => {
  const jennieSectionRef = React.useRef<HTMLElement>(null);
  const jennieVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!isFeatureEnabled("kartik_glazer_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  React.useEffect(() => {
    if (!isFeatureEnabled("kartik_glazer_page_is_enabled")) return;

    const section = jennieSectionRef.current;
    const video = jennieVideoRef.current;
    if (!section || !video) return;

    const tryPlayWithSound = () => {
      video.muted = false;
      return video.play().catch(() => {
        video.muted = true;
        return video.play();
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void tryPlayWithSound();
        } else {
          video.muted = true;
          video.pause();
        }
      },
      { threshold: 0.28, rootMargin: "0px 0px -5% 0px" }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      video.muted = true;
      video.pause();
    };
  }, []);

  if (!isFeatureEnabled("kartik_glazer_page_is_enabled")) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes kartik-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes kartik-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes kartik-pulse-glow {
          0%, 100% { opacity: 0.55; filter: blur(48px); }
          50% { opacity: 0.85; filter: blur(56px); }
        }
        @keyframes kartik-float {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        .kartik-marquee-track {
          animation: kartik-marquee 32s linear infinite;
        }
        .kartik-hero-glow {
          animation: kartik-pulse-glow 9s ease-in-out infinite;
        }
        .kartik-stamp {
          animation: kartik-float 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .kartik-marquee-track,
          .kartik-hero-glow,
          .kartik-stamp {
            animation: none !important;
          }
        }
      `}</style>

      <div className="relative isolate min-h-screen overflow-x-hidden bg-[#06030a] text-white font-rethink selection:bg-fuchsia-500/40 selection:text-white">
        {/* Wash out global body wallpaper for this route */}
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-[#06030a]"
          aria-hidden
        />

        <div
          className="pointer-events-none fixed -top-32 left-1/2 z-1 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-x-1/2 rounded-full kartik-hero-glow"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(251,191,36,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(217,70,239,0.28), transparent 50%), radial-gradient(circle at 50% 50%, rgba(34,211,238,0.2), transparent 45%)",
          }}
          aria-hidden
        />

        {/* SIDE STAMP */}
        <div
          className="pointer-events-none fixed right-2 top-1/2 z-5 hidden -translate-y-1/2 md:block"
          aria-hidden
        >
          <div className="kartik-stamp origin-center border-2 border-dashed border-amber-300/50 bg-black/40 px-3 py-8 font-silkscreen text-[10px] uppercase tracking-[0.4em] text-amber-200/90 [writing-mode:vertical-rl]">
            glaze index ↑
          </div>
        </div>

        {/* HERO */}
        <section className="relative z-2 min-h-svh w-full">
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full scale-105 object-cover opacity-[0.55] [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)]"
              src="/hidden/kartik_butterflies.mov"
            />
            <div
              className="absolute inset-0 bg-linear-to-b from-[#06030a]/20 via-transparent to-[#06030a]"
              aria-hidden
            />
          </div>

          <div className="relative z-10 flex min-h-svh flex-col justify-between px-5 pb-12 pt-16 sm:px-10 md:px-14">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <p className="font-silkscreen text-[10px] uppercase tracking-[0.5em] text-cyan-300/90 sm:text-xs">
                experimental / kartik sector
              </p>
              <div className="rounded-full border border-white/15 bg-black/50 px-4 py-2 font-pixelify text-xs text-amber-100 backdrop-blur-sm sm:text-sm">
                glaze meter <span className="text-fuchsia-400">████████</span>
                <span className="text-white/40">░░</span> 94%
              </div>
            </div>

            <div className="mt-auto max-w-5xl">
              <p className="mb-4 inline-block -rotate-1 border-b-2 border-fuchsia-500/60 font-silkscreen text-[clamp(2.5rem,12vw,7rem)] font-bold leading-[0.9] tracking-tight text-transparent [background:linear-gradient(110deg,#fef3c7,#f472b6,#67e8f9,#fef3c7)] bg-clip-text bg-size-[200%_auto] animate-[kartik-shimmer_8s_ease-in-out_infinite]">
                KARTIK
              </p>
              <div className="ml-1 max-w-xl space-y-5 text-base text-white/85 sm:text-lg md:ml-3">
                <p className="font-rethink italic text-amber-100/90">
                  Hot take: this page is what happens when the DEVS Team opens
                  Photoshop in their hearts.
                </p>
                <p className="text-sm uppercase tracking-[0.35em] text-white/50">
                  Not a portfolio. A phenomenon.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="relative z-2 border-y border-white/10 bg-linear-to-r from-fuchsia-950/40 via-black to-cyan-950/40 py-3">
          <div className="flex overflow-hidden whitespace-nowrap font-pixelify text-sm text-white/80">
            <div className="kartik-marquee-track flex shrink-0 gap-16 pr-16">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span aria-hidden className="text-amber-300">
                    ✦
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* MANIFESTO STRIP */}
        <section className="relative z-2 px-5 py-20 sm:px-10 md:px-14 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h2 className="font-silkscreen text-xs uppercase tracking-[0.45em] text-cyan-400/90">
                  field notes
                </h2>
                <p className="mt-6 text-[clamp(1.35rem,4vw,2.25rem)] font-medium leading-snug text-white text-balance">
                  There are two kinds of people: the politely interested, and
                  the ones who make the whole room lean in. Kartik is the second
                  kind — loud in the best way, soft where it counts.
                </p>
              </div>
              <div className="md:text-right">
                <p className="inline-block skew-y-1 border border-amber-400/40 bg-amber-950/30 px-5 py-4 text-sm italic text-amber-100/90 shadow-[8px_8px_0_rgba(244,114,182,0.25)]">
                  “We didn&apos;t make this page because we had to.
                  <br />
                  We made it because the evidence kept stacking up.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID */}
        <section className="relative z-2 px-3 pb-6 sm:px-5 md:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12 md:grid-rows-[minmax(260px,42vh)_minmax(200px,36vh)]">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_-10px_rgba(251,191,36,0.25)] md:col-span-8 md:row-span-2">
              <img
                src="/hidden/kartik_1.JPG"
                alt=""
                className="h-full min-h-[280px] w-full object-cover transition duration-700 group-hover:scale-[1.03] md:min-h-0"
              />
              <div className="pointer-events-none absolute left-4 top-4 rounded bg-black/60 px-2 py-1 font-silkscreen text-[9px] uppercase tracking-widest text-amber-200">
                exhibit A — still iconography
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 md:col-span-4">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full min-h-[220px] w-full object-cover transition duration-700 group-hover:scale-105 md:min-h-0"
                src="/hidden/kartik_2.MOV"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#06030a] via-transparent to-transparent opacity-60" />
              <span className="pointer-events-none absolute bottom-3 right-3 font-pixelify text-xs text-fuchsia-200/90">
                motion study 01
              </span>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 md:col-span-4">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full min-h-[220px] w-full object-cover transition duration-700 group-hover:scale-105 md:min-h-0"
                src="/hidden/kartik_on_my_mind.mov"
              />
              <div className="pointer-events-none absolute left-3 top-3 h-12 w-12 rotate-12 rounded border-2 border-cyan-400/50" />
              <span className="pointer-events-none absolute bottom-3 left-3 font-pixelify text-xs text-cyan-200/90">
                motion study 02 — brain full
              </span>
            </div>
          </div>
        </section>

        {/* BIG TYPE INTERLUDE */}
        <section className="relative z-2 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-10 md:px-14">
            <p className="font-silkscreen text-[clamp(2rem,8vw,4.5rem)] font-bold leading-none tracking-tight text-white/10 [text-shadow:2px_2px_0_rgba(244,114,182,0.35),-2px_-2px_0_rgba(34,211,238,0.3)]">
              GLAZE RESPONSIBLY
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">
              (Translation: hype your friends with the same energy you&apos;d
              use to describe a perfect slice of pizza. Generous. Specific.
              Slightly unhinged.)
            </p>
          </div>
        </section>

        {/* FINALE — audio un-mutes when this section is on screen */}
        <section
          ref={jennieSectionRef}
          className="relative z-2 min-h-[75svh] overflow-hidden"
        >
          <div className="absolute inset-0">
            <video
              ref={jennieVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-cover opacity-50"
              src="/hidden/kartik_jennie.mp4"
            />
            <div
              className="absolute inset-0 bg-linear-to-tr from-fuchsia-900/50 via-[#06030a]/70 to-cyan-900/40 mix-blend-multiply"
              aria-hidden
            />
          </div>

          <div className="relative z-10 flex min-h-[75svh] flex-col justify-end px-5 pb-16 pt-24 sm:px-10 md:px-14">
            <div className="max-w-xl rounded-2xl border border-white/15 bg-black/55 p-6 backdrop-blur-md sm:p-8">
              <p className="font-silkscreen text-[10px] uppercase tracking-[0.5em] text-fuchsia-300/90">
                closing argument
              </p>
              <h3 className="mt-4 font-rethink text-3xl font-semibold leading-tight text-white sm:text-4xl">
                kartik isn&apos;t &quot;nice to have&quot;.
                <br />
                <span className="text-amber-200">
                  he&apos;s the whole moodboard.
                </span>
              </h3>
              <ul className="mt-6 space-y-2 font-pixelify text-sm text-white/75">
                <li>✦ charisma density: off the charts</li>
                <li>✦ friend multiplier: passive buff</li>
                <li>✦ DEVS verdict: send this link to no one. or everyone.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-2 border-t border-white/10 bg-black/80 px-6 py-14 text-center">
          <p className="font-silkscreen text-[10px] uppercase tracking-[0.35em] text-white/40">
            classified silliness · devs internal
          </p>
          <p className="mt-4 text-sm text-white/55">
            This page is a compliment wrapped in a joke wrapped in CSS.
          </p>
          <p className="mt-2 text-xs text-white/35">
            If you&apos;re Kartik: pretend you never saw this. If you&apos;re
            not Kartik: you still don&apos;t have clearance.
          </p>
        </footer>
      </div>
    </>
  );
};

export default KartikGlazer;
