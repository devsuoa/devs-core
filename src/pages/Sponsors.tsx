import React, { useRef, useLayoutEffect, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PageTitle } from "../components/PageTitle";
import SponsorCard from "../components/SponsorCard";
import SponsorForm from "../components/SponsorForm";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/all";
import sponsorsData from "../../public/sponsors/current_sponsors.json";
import BinaryBackground from "../components/BinaryBackground";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, Draggable);

interface SponsorCard {
  name: string;
  image: string;
  desc: string;
  tier: "gold" | "silver" | "bronze";
}

const Sponsors: React.FC = () => {
  if (!isFeatureEnabled("sponsors_page_is_enabled")) {
    onPageNotFound();
    return null;
  }

  const galleryRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const dragProxyRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<any>(null);
  const spacingRef = useRef<number>(0.1);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollActiveRef = useRef<boolean>(true);

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    isAutoScrollActiveRef.current = true;
    autoScrollIntervalRef.current = setInterval(() => {
      if (scrubRef.current && isAutoScrollActiveRef.current) {
        const newOffset = scrubRef.current.vars.offset + spacingRef.current;
        scrubRef.current.vars.offset = newOffset;
        scrubRef.current.invalidate().restart();
      }
    }, 3000); // Auto-scroll
  };

  const pauseAutoScroll = () => {
    stopAutoScroll();
    isAutoScrollActiveRef.current = false;

    // Resume auto-scroll after 5 seconds of inactivity
    resumeTimeoutRef.current = setTimeout(() => {
      startAutoScroll();
    }, 5000);
  };

  const handleNext = () => {
    if (scrubRef.current) {
      const newOffset = scrubRef.current.vars.offset + spacingRef.current;
      scrubRef.current.vars.offset = newOffset;
      scrubRef.current.invalidate().restart();
    }
    pauseAutoScroll();
  };

  const handlePrev = () => {
    if (scrubRef.current) {
      const newOffset = scrubRef.current.vars.offset - spacingRef.current;
      scrubRef.current.vars.offset = newOffset;
      scrubRef.current.invalidate().restart();
    }
    pauseAutoScroll();
  };

  // Duplicate sponsors for seamless loop
  const sponsorCards: SponsorCard[] = [
    ...(sponsorsData as SponsorCard[]),
    ...(sponsorsData as SponsorCard[]),
  ];

  useLayoutEffect(() => {
    if (!cardsRef.current || !galleryRef.current || !dragProxyRef.current)
      return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLLIElement>(".sponsor-card");

      // Set initial state
      gsap.set(cards, { xPercent: 400, opacity: 0, scale: 0 });

      const spacing = 0.1;
      const snapTime = gsap.utils.snap(spacing);

      // Animation function for each card
      const animateFunc = (element: HTMLElement) => {
        const tl = gsap.timeline();
        tl.fromTo(
          element,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            zIndex: 100,
            duration: 0.5,
            yoyo: true,
            repeat: 1,
            ease: "power1.in",
            immediateRender: false,
          },
        ).fromTo(
          element,
          { xPercent: 250 },
          {
            xPercent: -250,
            duration: 1,
            ease: "power2.inOut",
            immediateRender: false,
          },
          0,
        );
        return tl;
      };

      // Build seamless loop
      const buildSeamlessLoop = (
        items: HTMLElement[],
        spacing: number,
        animateFunc: (element: HTMLElement) => gsap.core.Timeline,
      ) => {
        // Calculate overlap - how many items we need for smooth looping
        const overlap = Math.ceil(1 / spacing);

        // Ensure startTime is always greater than overlap * spacing to prevent negative duration
        // The minimum buffer (0.5) must be at least overlap * spacing + a small positive value
        const overlapTime = overlap * spacing;
        const minBuffer = overlapTime + 0.1; // Ensure positive duration for loop-back
        const startTime = items.length * spacing + Math.max(0.5, minBuffer);

        const loopTime = (items.length + overlap) * spacing + 1;
        const rawSequence = gsap.timeline({ paused: true });
        const seamlessLoop = gsap.timeline({
          paused: true,
          repeat: -1,
          onRepeat() {
            if (this._time === this._dur) {
              this._tTime += this._dur - 0.01;
            }
          },
        });

        const l = items.length + overlap * 2;

        for (let i = 0; i < l; i++) {
          const index = i % items.length;
          const time = i * spacing;
          rawSequence.add(animateFunc(items[index]), time);
          if (i <= items.length) {
            seamlessLoop.add("label" + i, time);
          }
        }

        // Calculate durations - both must be positive for proper animation
        const forwardDuration = loopTime - startTime;
        const loopBackDuration = startTime - overlapTime;

        rawSequence.time(startTime);
        seamlessLoop
          .to(rawSequence, {
            time: loopTime,
            duration: forwardDuration,
            ease: "none",
          })
          .fromTo(
            rawSequence,
            { time: overlapTime },
            {
              time: startTime,
              duration: loopBackDuration,
              immediateRender: false,
              ease: "none",
            },
          );

        return seamlessLoop;
      };

      const seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc);
      const playhead = { offset: 0 };
      const wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());

      const scrub = gsap.to(playhead, {
        offset: 0,
        onUpdate() {
          seamlessLoop.time(wrapTime(playhead.offset));
        },
        duration: 0.5,
        ease: "power3",
        paused: true,
      });

      scrubRef.current = scrub;

      const updateProgress = (newOffset: number) => {
        scrub.vars.offset = newOffset;
        scrub.invalidate().restart();
      };

      // Draggable setup
      if (dragProxyRef.current && cardsRef.current) {
        Draggable.create(dragProxyRef.current, {
          type: "x",
          trigger: cardsRef.current,
          onPress(this: any) {
            this.startOffset = scrub.vars.offset;
            pauseAutoScroll();
          },
          onDrag(this: any) {
            const newOffset = this.startOffset + (this.startX - this.x) * 0.001;
            updateProgress(newOffset);
          },
          onDragEnd() {
            // Optionally snap to nearest card
            const snappedOffset = snapTime(scrub.vars.offset);
            updateProgress(snappedOffset);
          },
        });
      }
    }, galleryRef);

    // Cleanup
    return () => {
      ctx.revert();
    };
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    const timer = setTimeout(() => {
      startAutoScroll();
    }, 1000);

    return () => {
      clearTimeout(timer);
      stopAutoScroll();
    };
  }, []);

  return (
    <>
    <BinaryBackground/>
      <Header />
      <main className="min-h-screen">
        <PageTitle
          title="Our Sponsors"
          className="p-0"
        />

        {/* Carousel Gallery */}
        <div
          ref={galleryRef}
          className="gallery relative w-full h-[90vh]  -mt-20 md:mt-5 px-4 sm:px-6 md:px-8"
        >
          <ul
            ref={cardsRef}
            className="cards absolute w-64 h-[480px] sm:w-72 sm:h-[540px] md:w-80 md:h-[600px] top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            {sponsorCards.map((sponsor, index) => (
              <SponsorCard
                key={`${sponsor.name}-${index}`}
                name={sponsor.name}
                image={sponsor.image}
                desc={sponsor.desc}
                tier={sponsor.tier}
              />
            ))}
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="relative -mt-100 md:-mt-64 md:-mt-80 flex items-center justify-center gap-3 sm:gap-4 px-4">
          <button
            onClick={handlePrev}
            className="sponsor-prev px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg transition-colors"
          >
            <img
              src="buttons/slides/slide_left_button.svg"
              alt="Previous"
              className="w-5 h-5 sm:w-6 sm:h-6 inline-block hover:cursor-pointer"
            />
          </button>
          <button
            onClick={handleNext}
            className="sponsor-next px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg transition-colors"
          >
            <img
              src="buttons/slides/slide_right_button.svg"
              alt="Next"
              className="w-5 h-5 sm:w-6 sm:h-6 inline-block hover:cursor-pointer"
            />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center px-6 mt-10 sm:px-8 md:px-4">
          <p className="text-white text-sm sm:text-md max-w-lg font-rethink text-center py-10 sm:py-12">
            DEVS is incredibly grateful to our sponsors for their ongoing support in making our events and initiatives possible. From event sponsorship to resources and student engagement opportunities, their partnership enables us to create meaningful experiences for our community.


          </p>
        </div>

        {/* Sponsor Submission Form */}
        <div className="py-16 px-10 md:px-0 ">
          <h2 className="text-center text-xl md:text-3xl font-silkscreen text-white mb-12">
            {"<"} WANT TO SPONSOR US? {"/>"}
          </h2>
          <SponsorForm />
        </div>

        {/* Drag Proxy */}
        <div ref={dragProxyRef} className="drag-proxy invisible absolute" />
      </main>
      <Footer />
    </>
  );
};

export default Sponsors;
