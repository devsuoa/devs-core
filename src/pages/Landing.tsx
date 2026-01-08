import React from 'react';
import { SocialLinks } from '../components/SocialLinks';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';
import PixelatedButton from '../components/PixelatedButton';

const logo = '/branding/text_logo.png';
const mascot = '/landing/deva_reading.png';

const Landing: React.FC = () => {
  React.useEffect(() => {
    if (!isFeatureEnabled('landing_page_is_enabled')) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled('landing_page_is_enabled')) {
    return null;
  }

  return (
    <div
      className="
        relative
        flex
        items-center
        justify-center
        h-screen
        w-screen
        overflow-hidden
        max-[768px]:flex-col
        max-[768px]:items-stretch
      "
    >

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          flex
          flex-col
          items-center
          text-center
          max-[768px]:flex-1
          max-[768px]:justify-center
        "
      >

        {/* Logo */}
        <img
          src={logo}
          alt="DEVS Logo"
          className="
            w-[220px]
            max-[768px]:w-[200px]
            pixelated
            mb-4
            max-[768px]:absolute
            max-[768px]:top-10
            max-[768px]:left-1/2
            max-[768px]:-translate-x-1/2
          "
        />

        {/* Text + Buttons Wrapper */}
        <div className="w-[460px] max-[768px]:w-[320px] flex flex-col items-center">

          {/* Subtitle */}
          <div className="mb-4">

            {/* Desktop */}
            <div className="hidden max-[768px]:block">
              <p className="font-silkscreen text-white tracking-[0.1em] uppercase text-[18px]">
                University of Auckland
              </p>
              <p className="font-silkscreen text-white tracking-[0.1em] uppercase text-[18px]">
                Developers Society
              </p>
            </div>

            {/* Mobile */}
            <div className="block max-[768px]:hidden">
              <p className="font-silkscreen text-white tracking-[0.1em] uppercase text-[24px]">
                University of Auckland
              </p>
              <p className="font-silkscreen text-white tracking-[0.1em] uppercase text-[24px] mb-1">
                Developers Society
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div
            className="
              flex
              gap-10
              justify-center
              w-full

              max-[768px]:flex-col
              max-[768px]:items-center
              max-[768px]:justify-center
              max-[768px]:gap-6
              max-[768px]:mt-24
              max-[768px]:scale-[2]
            "
          >
            <PixelatedButton
              to="/home"
              inactive="/buttons/join/join_us_inactive.png"
              hover="/buttons/join/join_us_hover.png"
              clicked="/buttons/join/join_us_click.png"
            />
            <PixelatedButton
              to="/events"
              inactive="/buttons/join/join_us_inactive.png"
              hover="/buttons/join/join_us_hover.png"
              clicked="/buttons/join/join_us_click.png"
            />
            <PixelatedButton
              to="/sponsors"
              inactive="/buttons/join/join_us_inactive.png"
              hover="/buttons/join/join_us_hover.png"
              clicked="/buttons/join/join_us_click.png"
            />
          </div>
        </div>
      </div>

      {/* Mascot – desktop only */}
      <img
        src={mascot}
        alt="DEVS Mascot"
        className="
          absolute
          bottom-20
          right-40
          w-[320px]
          pixelated
          max-[768px]:hidden
        "
      />

      {/* Social Media Icons */}
      <div
        className="
          absolute
          bottom-6
          left-1/2
          -translate-x-1/2
          z-20
          flex
          items-center
          justify-center

          scale-100
          max-[768px]:scale-150
        "
      >
        <SocialLinks />
      </div>

    </div>
  );
};

export default Landing;