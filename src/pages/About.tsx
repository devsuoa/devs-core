import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import Header from "../components/Header";
import { PageTitle } from "../components/PageTitle";
import { initAboutHorizontalScroll } from "../lib/aboutController";
import PixelatedButton from "../components/PixelatedButton";
import SponsorTape from "../components/SponsorTape";

const About = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const containerRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reactive mobile detection — re-renders on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop horizontal scroll — auto cleans up when switching to mobile
  useLayoutEffect(() => {
    if (isMobile) return;
    if (!containerRef.current || !trackRef.current) return;

    cleanupRef.current = initAboutHorizontalScroll(
      containerRef.current,
      trackRef.current,
    );

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isMobile]);

  // Mobile carousel auto-scroll
  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;

    const totalSlides = 5;
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;

    const numOfSlides = 5;
    const carousel = carouselRef.current;
    const slideWidth = carousel.scrollWidth / numOfSlides;
    carousel.scrollTo({
      left: slideWidth * currentSlide,
      behavior: 'smooth',
    });
  }, [currentSlide, isMobile]);

  if (!isFeatureEnabled("about_us_page_is_enabled")) {
    onPageNotFound();
    return null;
  }

  if (!isMobile) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          {/* Title */}
          <PageTitle
            title="About Us"
            image="/theme/title_icon.png"
            className="p-0"
          />
          <section className="px-8 py-6 text-center max-w-4xl mx-auto font-rethink">
            <h1 className="text-2xl font-bold">
              Founded in 2019, DEVS has grown to become the largest tech club in
              Auckland.
            </h1>
            <p>
              Our 2025 Co-President, Kartik Malik, is one of the greatest people
              to ever exist. Like, pure legendary status, the glaze makes so
              much sense. You genuinely cannot find a better person. No one
              truly understands until they meet Kartik, and once they do they
              understand the glaze, and they themselves start glazing.
            </p>
          </section>

          {/* Horizontal Scroll Gallery */}
          <section
            ref={containerRef}
            className="about-horizontal-container h-screen relative overflow-hidden"
          >
            <div
              ref={trackRef}
              className="about-horizontal-track flex flex-nowrap h-full will-change-transform"
            >
              <div className="min-w-[50vw] h-auto my-auto">
                <img src="/home/slideshow/1.png" alt="REPLACE THIS" />
              </div>
              <div className="min-w-[50vw] h-auto my-auto">
                <img src="/home/slideshow/2.png" alt="REPLACE THIS" />
              </div>
              <div className="min-w-[50vw] h-auto my-auto">
                <img src="/home/slideshow/3.png" alt="REPLACE THIS" />
              </div>
              <div className="min-w-[50vw] h-auto my-auto">
                <img src="/home/slideshow/4.png" alt="REPLACE THIS" />
              </div>
              <div className="min-w-[50vw] h-auto my-auto">
                <img src="/home/slideshow/5.png" alt="REPLACE THIS" />
              </div>
            </div>
          </section>

          {/* Sponsors */}
          <section>
            <div className="flex flex-col items-center justify-center gap-3">
              <h1 className="text-4xl font-silkscreen text-center pb-12">
                Our Sponsors
              </h1>
              <div className="flex flex-row items-center justify-center gap-24">
                <p className="text-white text-sm max-w-md italic font-rethink p-0">
                  DEVS is grateful to our sponsors for their support in making
                  our events possible. From providing us with swag to sponsoring
                  our events, we are thankful for their support.
                </p>
                {/* TODO: REPLACE WITH LEARN MORE BUTTON */}
                <PixelatedButton
                  to="/sponsors"
                  inactive="/buttons/join/join_us_inactive.png"
                  hover="/buttons/join/join_us_hover.png"
                  clicked="/buttons/join/join_us_click.png"
                />
              </div>
            </div>

            {/* Sponsor banner */}
            <div className="w-full overflow-hidden my-24">
              <SponsorTape />
            </div>
          </section>

          {/* Why Join */}
          <section>
            <div className="flex flex-row items-center justify-center gap-x-16">
              <div className="flex flex-col gap-3 mt-4">
                <div className="pb-12">
                  <h1 className="text-4xl text-left font-silkscreen">
                    Why Join Us?
                  </h1>
                </div>
                <div className="h-12 w-72 rounded-lg bg-pink-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
                  connect with industry
                </div>

                <div className="h-12 w-72 rounded-lg bg-blue-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
                  develop your skills
                </div>
                <div className="h-12 w-72 rounded-lg bg-purple-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
                  meet new people
                </div>
              </div>

              <div className="max-w-md pt-12">
                <img src="/home/slideshow/1.png" alt="REPLACE THIS" />
              </div>
            </div>
          </section>

          {/* Team photo */}
          <section>
            <div className="flex flex-row items-center justify-center gap-x-16 my-24">
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/team/execs/team.png"
                  alt="2025/26 DEVS Exec Photo"
                  className="w-[70%] h-auto"
                />
                <p className="text-white text-sm italic font-rethink p-0">
                  2025/26 DEVS Exec Team
                </p>
                {/* TODO: REPLACE WITH MEET THE TEAM BUTTON */}
                <PixelatedButton
                  to="/sponsors"
                  inactive="/buttons/join/join_us_inactive.png"
                  hover="/buttons/join/join_us_hover.png"
                  clicked="/buttons/join/join_us_click.png"
                  className="mt-8"
                />
              </div>
            </div>
          </section>

          {/* Meet DEVA */}
          <section>
            <div className="flex flex-row items-center justify-center gap-x-16">
              <div className="flex flex-col gap-3 text-left">
                <div className="flex flex-col items-start justify-start">
                  <p className="text-base font-pixelify">meet our mascot</p>
                  <h1 className="text-8xl font-silkscreen pb-4">DEVA</h1>
                  <p className="text-white text-sm max-w-md italic font-rethink p-0">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Beatae ad ut obcaecati aperiam molestiae numquam vitae neque
                    necessitatibus consequatur animi, harum quis dignissimos
                    laborum. Reiciendis molestiae amet rem maiores maxime!
                  </p>
                </div>
              </div>

              <div className="max-w-md pt-12">
                <img
                  src="/branding/deva_mascot.png"
                  alt="DEVA"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </section>

          {/* Join Us */}
          <section>
            <div className="my-24">
              <div className="flex flex-row items-center justify-center gap-x-4">
                <img src="/landing/file.png" alt="" />
                <h1 className="text-4xl font-silkscreen max-w-lg">
                  Ready to start your journey with DEVS?
                </h1>
              </div>

              <div className="flex flex-row items-center justify-center gap-x-4 my-12">
                <PixelatedButton
                  to="/join"
                  inactive="/buttons/join/join_us_inactive.png"
                  hover="/buttons/join/join_us_hover.png"
                  clicked="/buttons/join/join_us_click.png"
                />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  } else {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <Header />
        <h1 className="text-3xl font-silkscreen text-center mt-24">About Us</h1>
        <section className="px-12 py-6 text-center mx-auto font-rethink text-sm leading-tight">
          <h1 className="text-lg font-bold leading-tight py-4">
            Founded in 2019, DEVS has grown to become the largest tech club in New Zealand.
          </h1>
          <p className="text-xs">
            Our 2025 Co-President, Kartik Malik, is one of the greatest people to ever exist. Like, pure legendary status, the glaze makes so much sense. You genuinely cannot find a better person. No one truly understands until they meet Kartik, and once they do they understand the glaze, and they themselves start glazing.
          </p>
        </section>

        {/* Carousel */}
        <section className="mt-6 px-4 self-stretch">
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            <div className="shrink-0 w-[75vw] snap-center">
              <img src="/home/slideshow/1.png" alt="REPLACE THIS" className="h-auto" />
            </div>
            <div className="shrink-0 w-[75vw] snap-center">
              <img src="/home/slideshow/2.png" alt="REPLACE THIS" className="h-auto" />
            </div>
            <div className="shrink-0 w-[75vw] snap-center">
              <img src="/home/slideshow/3.png" alt="REPLACE THIS" className="h-auto" />
            </div>
            <div className="shrink-0 w-[75vw] snap-center">
              <img src="/home/slideshow/4.png" alt="REPLACE THIS" className="h-auto" />
            </div>
            <div className="shrink-0 w-[75vw] snap-center">
              <img src="/home/slideshow/5.png" alt="REPLACE THIS" className="h-auto" />
            </div>
          </div>
        </section>

        {/* Sponsors */}
        <section className="w-full flex flex-col items-center justify-center gap-6 my-12">
          <div className="px-12 flex flex-col items-center justify-center gap-6">
            <h1 className="text-2xl font-silkscreen text-left whitespace-nowrap">&lt; Our Sponsors /&gt;</h1>
            <p className="text-white text-sm max-w-sm italic font-rethink p-0 text-center">
              DEVS is grateful to our sponsors for their support in making our
              events possible. From providing us with swag to sponsoring our
              events, we are thankful for their support.
            </p>
            <PixelatedButton
              to="/sponsors"
              inactive="/buttons/join/join_us_inactive.png"
              hover="/buttons/join/join_us_hover.png"
              clicked="/buttons/join/join_us_click.png"
              className="w-1/2"
            />
          </div>
          <div className="w-full overflow-hidden">
            <SponsorTape />
          </div>
        </section>

        {/* Why Join */}
        <section className="mt-12 mb-12">
          <div className="flex flex-col gap-3 items-center justify-center">
            <div className="flex pb-4 justify-center">
              <h1 className="text-2xl text-center font-silkscreen">
                Why Join Us?
              </h1>
            </div>
            <div className="h-12 w-72 rounded-lg bg-pink-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
              connect with industry
            </div>

            <div className="h-12 w-72 rounded-lg bg-blue-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
              develop your skills
            </div>
            <div className="h-12 w-72 rounded-lg bg-purple-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
              meet new people
            </div>
            <div className="max-w-md pt-4">
              <img src="/home/slideshow/1.png" alt="REPLACE THIS" />
            </div>
          </div>
        </section>

        {/* Team Photo */}
        <section className="my-12 px-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <img
              src="/team/execs/team.png"
              alt="2025/26 DEVS Exec Photo"
              className="w-full h-auto"
            />
            <p className="text-white text-sm italic font-rethink text-center">
              2025/26 DEVS Exec Team
            </p>

            {/* TODO: REPLACE WITH MEET THE TEAM BUTTON */}
            <PixelatedButton
              to="/team"
              inactive="/buttons/join/join_us_inactive.png"
              hover="/buttons/join/join_us_hover.png"
              clicked="/buttons/join/join_us_click.png"
              className="w-1/2 mt-4"
            />
          </div>
        </section>

        {/* Meet DEVA */}
        <section className="px-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-md text-center">
              <p className="text-2xl font-bold font-pixelify text-center">meet our mascot</p>
              <h1 className="text-8xl font-silkscreen pb-4 -ml-2">DEVA</h1>
              <p className="text-white text-sm italic font-rethink">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Beatae ad ut obcaecati aperiam molestiae numquam vitae neque
                necessitatibus consequatur animi, harum quis dignissimos
                laborum. Reiciendis molestiae amet rem maiores maxime!
              </p>
            </div>
            <div className="w-full max-w-md pt-3">
              <img
                src="/branding/deva_mascot.png"
                alt="DEVA"
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="my-12 px-12">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <img src="/landing/file.png" alt="" className="w-20 h-auto" />
              <h1 className="text-2xl font-silkscreen text-center max-w-sm leading-tight">
                Ready to start your journey with DEVS?
              </h1>
            </div>
            <PixelatedButton
              to="/join"
              inactive="/buttons/join/join_us_inactive.png"
              hover="/buttons/join/join_us_hover.png"
              clicked="/buttons/join/join_us_click.png"
              className="w-1/2"
            />
          </div>
        </section>

        <Footer />
      </main>
    );
  }
};

export default About;
