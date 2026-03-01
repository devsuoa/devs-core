import React from "react";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import Header from "../components/Header";
import PixelatedButton from "../components/PixelatedButton";
import SponsorItem from "../components/SponsorItem";
import { useSlideShowController } from "../lib/slideShowController";
import BinaryBackground from "../components/BinaryBackground";
import { SocialLinks } from "../components/SocialLinks";
const Home: React.FC = () => {
  const slideShow = useSlideShowController();

  if (!isFeatureEnabled("home_page_is_enabled")) {
    onPageNotFound();
    return null;
  }

  return (
    <>
      <BinaryBackground />
      <div className="mb-8">
      <Header/>
      </div>

      {/* HERO SECTION */}
      <section className="h-[85vh] items-center flex">
        <div className="flex flex-col md:flex-row w-full mb-0 px-4 md:px-[8vw] gap-8 md:gap-16 items-center">
          <div className="relative flex flex-col items-center flex-1 gap-6 md:gap-8">
            <div className="pt-1 md:pt-0 flex flex-col items-center justify-center">
              <h1 className="text-white font-silkscreen text-3xl md:text-5xl mb-12 tracking-widest uppercase">
                Welcome to
              </h1>
              <img
                src="/branding/text_logo.png"
                alt="DEVS Logo"
                className="w-[50vw] lg:w-[40vw] mb-5"
              />

            </div>
            <p className="text-white text-sm md:text-m max-w-xl font-rethink text-center xs:text-left px-10 md:px-0">
              Developers Society (DEVS) is Auckland’s leading university technology club, serving students from the University of Auckland and Auckland University of Technology.
            </p>
            <p className="text-white text-sm mb-10 md:text-m max-w-xl font-rethink text-center xs:text-left px-10 md:px-0">
              We bridge the gap between academia and industry by running hands-on workshops, hackathons, and networking events that help students grow their technical skills, prepare for the workplace, and connect with leading organisations. Through strong industry partnerships, we create meaningful opportunities that empower and shape the next generation of technology talent in Auckland.
            </p>
            {/* Learn more button (absolute in hero) */}

          </div>

        </div>
        <div className="hidden [@media(min-height:750px)]:flex absolute left-1/2 transform -translate-x-1/2 bottom-7 flex-col items-center">
          <button
            onClick={() => {
              const el = document.getElementById('next-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="font-silkscreen uppercase text-white px-6 py-3 hover:cursor-pointer rounded-lg animate-bounce"
            aria-label="Learn more"
          >
            Learn More
          </button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block w-6 h-6 text-white mt-1 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* largest tech club */}
      <section id="next-section" className="w-full min-h-screen flex justify-center px-4 mt-8">
        <div className="flex flex-col lg:grid grid-cols-1 lg:p-0 p-4 lg:grid-cols-2 lg:gap-0 items-center justify-center w-full lg:pr-30 lg:pl-30 gap-12">
          <div
            className="flex flex-row items-center justify-center w-full md:w-auto gap-1 md:gap-0"
            onMouseEnter={slideShow.pause}
            onMouseLeave={slideShow.resume}
          >
            <button
              className="hidden md:block min-w-8 hover:cursor-pointer md:min-w-10 min-h-8 md:min-h-10 hover:scale-105 transition flex-shrink-0"
              onClick={slideShow.prev}
              aria-label="Previous Slide Button"
            >
              <img
                src="/buttons/slides/slide_left_button.svg"
                className="w-8 md:w-10 h-8 md:h-10 p-0 m-0"
                alt="Previous Slide"
              />
            </button>
            <img
              src={slideShow.slide}
              alt="DEVS Events Slideshow"
              className="hover:scale-101 transition w-full md:flex-1 md:min-w-0 md:max-w-full"
            />
            <button
              className="hidden md:block min-w-8 hover:cursor-pointer z-10 md:min-w-10 min-h-8 md:min-h-10 hover:scale-105 transition flex-shrink-0"
              onClick={slideShow.next}
              aria-label="Next Slide Button"
            >
              <img
                src="/buttons/slides/slide_right_button.svg"
                className="w-8 md:w-10 h-8 md:h-10 p-0 m-0"
                alt="Next Slide"
              />
            </button>
          </div>

          {/* Text */}
          <div className="flex lg:pl-40 flex-col items-center  justify-center gap-8 max-w-xl text-center lg:max-w-2xl lg:text-left">
            <p className="text-white font-silkscreen text-lg md:text-2xl tracking-widest uppercase">
              NZ's Largest Tech Society
            </p>

            <p className="text-white font-rethink text-sm lg:text-m leading-relaxed">
              DEVS is Auckland's largest tech club, at both the University of Auckland and Auckland University of Technology. We're
              a community of software enthusiasts who build, learn, and grow
              together.
            </p>

            <div className="flex flex-col gap-3 mt-4 items-center lg:items-start">
              <Link to="/join" className="h-10 w-full md:w-70 max-w-xs px-4 rounded-lg bg-pink-400/80 border-2 border-white hover:scale-102 transition flex items-center justify-center">
                <span className="text-white font-silkscreen text-sm md:text-m text-center">
                  1000+ members
                </span>
              </Link>

              <Link to="/events" className="h-10 w-full md:w-70 max-w-xs px-4 rounded-lg bg-blue-400/80 border-2 border-white hover:scale-102 transition flex items-center justify-center">
                <span className="text-white font-silkscreen text-sm md:text-m text-center">
                  25+ events per year
                </span>
              </Link>

              <Link to="/team" className="h-10 w-full md:w-70 max-w-xs px-4 rounded-lg bg-purple-400/80 border-2 border-white hover:scale-102 transition flex items-center justify-center">
                <span className="text-white font-silkscreen text-sm md:text-m text-center">
                  27 student executives
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* sponsors */}
      <section className="w-full px-4 pt-5 flex flex-col items-center top-0">
        <h1 className="text-white font-silkscreen px-10 lg:px-0 text-center text-2xl lg:text-4xl mb-20 tracking-widest uppercase">
          proudly sponsored by
        </h1>

        {/* Gold */}
        <p className="text-[#D09424] font-pixelify text-center mb-7 text-xl md:text-[2rem] pl-[1rem]">
          GOLD
        </p>
        <div className="flex flex-col md:flex-row items-center justify-evenly w-full gap-4 md:gap-0">
          {/* <img src="/sponsors/gold/jane_street.png"  className="w-[24rem] h-auto max-w-[24rem] p-4" /> */}
          <SponsorItem
            name="Jane Street"
            className="w-[24rem] h-auto max-w-[24rem] p-2 px-10"
            logo="/sponsors/gold/jane_street.png"
          />
          <SponsorItem
            name="Partly"
            className="w-[24rem] h-auto max-w-[24rem] p-2 px-10"
            logo="/sponsors/gold/partly.png"
          />
        </div>

        {/* Silver */}
        <p className="text-[#D3D3D3] items-center text-center mb-7 font-pixelify text-xl md:text-[2rem] pl-[1rem] mt-8 md:mt-[4rem]">
          SILVER
        </p>
        <div className="flex flex-col lg:flex-row items-center justify-evenly w-full gap-4 md:gap-0">
          <SponsorItem
            name="Atlassian"
            logo="/sponsors/silver/atlassian.png"
          />

          <SponsorItem
            name="IMC"
            logo="/sponsors/silver/imc.png"
          />

          <SponsorItem
            name="Optiver"
            logo="/sponsors/silver/optiver.png"
          />

          <SponsorItem
            name="Serato"
            logo="/sponsors/silver/serato.png"
          />

          <SponsorItem
            name="Sandfield"
            logo="/sponsors/silver/sandfield.png"
          />

          <SponsorItem
            name="Visa"
            logo="/sponsors/silver/visa.png"
          />
        </div>
      </section>

      {/* Random Section */}
      <section className="w-full mt-50 flex justify-center">
        <div className="flex flex-col lg:flex-row justify-center lg:py-20 lg:px-20 py-15 px-15 w-[70vw] md:w-[70vw] h-full  border-2 border-[#6E80DA] rounded-[25px] px-0 gap-6 md:gap-10">
          <div className="flex flex-col max-w-xl text-center md:text-left items-center md:items-left justify-center gap-4">
            <p className="text-white font-silkscreen text-lg md:text-2xl uppercase">
              stay connected with us!
            </p>
            <p className="text-white font-rethink text-center text-sm md:text-m">
              Follow us on social media to stay up to date with our latest news, events, and opportunities. Join our community and never miss out on the exciting things happening at DEVS!
            </p>
            <SocialLinks className="gap-4 mt-4" />
          </div>
          <img
            src="branding/deva_wave.png"
            className="lg:max-w-[40vh] scale-x-[-1] h-full pixelated drop-shadow-[0_12px_10px_rgba(0,0,0,0.4)]"
            alt="DEVS Mascot Deva"
          />
        </div>
      </section>

      {/* Sign up */}
      <section className="w-full py-12 mt-20 md:py-24 md:px-4 px-15 mb-30">
        <h1 className="text-white font-silkscreen text-2xl lg:text-4xl mb-20 uppercase text-center">
          ready to join the fun?
        </h1>

        <div className="flex flex-col items-center justify-between gap-8 md:mt-0 -mt-12 ">
          {/* LEFT SIDE */}
          <div className="flex flex-col items-center w-full md:w-auto">
            {/* Framed content */}
            <div className="">
              {/* 
              <img
                src="/landing/border.png"
                alt=""
                className="absolute inset-0 w-full h-full pixelated"
              />

              */}
              <div className=" inset-0 flex items-center justify-center px-8 md:px-16 text-center">
                <p className="text-white text-sm md:text-sm leading-relaxed max-w-md">
                  We're always excited to meet motivated individuals who love
                  technology! Sign up now to join the DEVS community and explore
                  more opportunities with us.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-10 md:mt-15">
              <PixelatedButton
                to="/join"
                inactive="/buttons/join/join_us_inactive.png"
                hover="/buttons/join/join_us_hover.png"
                clicked="/buttons/join/join_us_click.png"
                className="w-[150px] md:w-[192px]"
              />
            </div>
          </div>

          {/* RIGHT SIDE */}

        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
