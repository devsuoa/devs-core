import React from 'react';
import Footer from '../components/Footer';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';
import Header from '../components/Header';
import { PageTitle } from '../components/PageTitle';
import PixelatedButton from '../components/PixelatedButton';
import SponsorItem from '../components/SponsorItem';
import { useSlideShowController } from '../lib/slideShowController';

const Home: React.FC = () => {
  const slideShow = useSlideShowController();

  if (!isFeatureEnabled('home_page_is_enabled')) {
    onPageNotFound();
    return null;
  }

  return (
    <>
      <Header />

      {/* HERO SECTION */}
      <section className="min-h-[80vh] flex items-center">
        <div className="flex w-full px-[8vw] gap-16 items-center">

          <div className="flex flex-col items-center flex-1 gap-8">
            <PageTitle
              image="/theme/title_icon.png"
              title="Welcome to Developers Society"
              className='!p-0'
            />

            <p className="text-white text-m max-w-xl font-rethink">
              Based in the University of Auckland, Developers Society is a
              community of software enthusiasts who are passionate about roasting
              the ever living shit out of Phoebe. Our 2025 Co-President,
              arguably the shortest person on Earth,
              is the one who is responsible for this website as she was the one who came up with the idea.
              She also has a knack for not knowing how to drive, with a record of 4 flat tires in the past year.
            </p>
            <PixelatedButton
              to="/join"
              inactive="./buttons/join/join_us_inactive.png"
              hover="./buttons/join/join_us_hover.png"
              clicked="./buttons/join/join_us_click.png"
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex-1 flex justify-center">
            <img
              src="/branding/3d_logo.png"
              alt="Developers Society Mascot"
              className="max-w-[420px] w-full pixelated"
            />
          </div>
        </div>
      </section>

      {/* largest tech club */}
      <section className="w-full flex justify-center py-12">
        <div className="flex items-center gap-20 max-w-6xl">
          {/* Slideshow */}
          <div className="flex flex-row items-center justify-center" onMouseEnter={slideShow.pause} onMouseLeave={slideShow.resume}>
            <button className="min-w-10 min-h-10 hover:scale-105 transition" onClick={slideShow.prev} aria-label="Previous Slide Button">
              <img src="/buttons/slides/slide_left_button.svg" className="w-10 h-10 p-0 m-0" alt="Previous Slide" />
            </button>
            <img src={slideShow.slide} alt="DEVS Events Slideshow" className="hover:scale-101 transition" />
            <button className="min-w-10 min-h-10 hover:scale-105 transition" onClick={slideShow.next} aria-label="Next Slide Button">
              <img src="/buttons/slides/slide_right_button.svg" className="w-10 h-10 p-0 m-0" alt="Next Slide" />
            </button>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-4 max-w-xl">
            <p className="text-white font-silkscreen text-2xl tracking-widest uppercase">
              NZ's Largest Tech Club
            </p>

            <p className="text-white font-rethink text-m leading-relaxed">
              DEVS is the largest tech club at the University of Auckland.
              We're a community of software enthusiasts who build, learn, and ship together.
            </p>

            <div className="flex flex-col gap-3 mt-4">
              <div className="h-10 w-48 rounded-lg bg-pink-400/80 border-2 border-white" />
              <div className="h-10 w-48 rounded-lg bg-blue-400/80 border-2 border-white" />
              <div className="h-10 w-48 rounded-lg bg-purple-400/80 border-2 border-white" />
            </div>
          </div>
        </div>
      </section>

      {/* sponsors */}
      {/* TODO: Replace with 2026 sponsors */}
      <section className="w-full py-12 px-24">
        <PageTitle
          title="Proudly Sponsored By"
          className='!p-0'
        />

        {/* Gold */}
        <p className="text-[#D09424] font-pixelify text-[2rem] pl-[1rem]">gold sponsors</p>
        <div className="flex flex-row items-center justify-evenly w-full">
          <SponsorItem
            name="Jane Street"
            image="/landing/file.png"
            logo="/sponsors/gold/jane_street.png"
          />
          <SponsorItem
            name="Serato"
            image="/landing/file.png"
            logo="/sponsors/gold/serato.png"
          />
        </div>

        {/* Silver */}
        <p className="text-[#D3D3D3] font-pixelify text-[2rem] pl-[1rem] mt-[4rem]">silver sponsors</p>
        <div className="flex flex-row items-center justify-evenly w-full">
          <SponsorItem
            name="Atlassian"
            image="/landing/file.png"
            logo="/sponsors/silver/atlassian.png"
          />

          <SponsorItem
            name="Optiver"
            image="/landing/file.png"
            logo="/sponsors/silver/optiver.png"
          />

          <SponsorItem
            name="Sandfield"
            image="/landing/file.png"
            logo="/sponsors/silver/sandfield.png"
          />

          <SponsorItem
            name="Visa"
            image="/landing/file.png"
            logo="/sponsors/silver/visa.png"
          />
        </div>
      </section>

      {/* Random Section */}
      <section className="w-full py-12 px-24 flex justify-center">
        <div className="flex flex-row items-center justify-center w-[70vw] min-h-[35vh] h-full border-2 border-[#6E80DA] rounded-[25px]">
          <div className="flex flex-col max-w-xl text-left items-left justify-center gap-4">
            <p className="text-white font-silkscreen text-2xl uppercase">Lorem Ipsum Dolor Sit Amet</p>
            <p className="text-white font-rethink text-m">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <img src="branding/deva_mascot.png" className="w-1/4 h-auto pixelated drop-shadow-[0_12px_10px_rgba(0,0,0,0.4)]" alt="DEVS Mascot Deva" />
        </div>
      </section>

      {/* Sign up */}
      <section className="w-full py-24 px-24">
        <PageTitle
          title="Want to become a member?"
          className="!p-0 mb-16"
        />

        <div className="flex items-center justify-between gap-24">
          {/* LEFT SIDE */}
          <div className="flex flex-col items-center">
            {/* Framed content */}
            <div className="relative w-[720px] h-[500px] aspect-[16/9]">
              {/* Border */}
              <img
                src="/landing/border.png"
                alt=""
                className="absolute inset-0 w-full h-full pixelated"
              />

              {/* Text inside frame */}
              <div className="absolute inset-0 flex items-center justify-center px-16 text-center">
                <p className="text-white text-sm leading-relaxed max-w-md">
                  We're always excited to meet motivated individuals who love
                  technology! Sign up now to join the devs community and explore
                  more opportunities with us.
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="mt-10">
              <PixelatedButton
                to="/join"
                inactive="/buttons/join/join_us_inactive.png"
                hover="/buttons/join/join_us_hover.png"
                clicked="/buttons/join/join_us_click.png"
                className="w-[192px]"
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <img
            src="/branding/deva_reading.png"
            alt=""
            className="w-[420px] h-auto pixelated"
          />
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
