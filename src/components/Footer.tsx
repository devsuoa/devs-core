import { Link } from "react-router-dom";
import { SocialLinks } from "./SocialLinks";
import { isFeatureEnabled } from "../lib/featureFlags";
import { useState } from "react";
import Credits from "./Credits"


const Footer = () => {
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <>
    <footer className="bg-gradient-to-t from-black/50 to-transparent text-white py-8">
      <div className="mx-auto grid grid-cols-3 gap-1 px-20 max-[768px]:grid-cols-1">
        {/* Left Section - Navigation Links */}
        <div className="flex flex-col gap-0">
          {isFeatureEnabled('home_page_is_enabled') && (
            <Link
              to="/"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              HOME
            </Link>
          )}

          {isFeatureEnabled('links_page_is_enabled') && (
            <Link
              to="/links"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              LINKS
            </Link>
          )}

          {isFeatureEnabled('about_us_page_is_enabled') && (
            <Link
              to="/about"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              ABOUT US
            </Link>
          )}

          {isFeatureEnabled('team_page_is_enabled') && (
            <Link
              to="/team"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              MEET OUR TEAM
            </Link>
          )}

          {isFeatureEnabled('sponsors_page_is_enabled') && (
            <Link
              to="/sponsors"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              SPONSORS
            </Link>
          )}

          {isFeatureEnabled('events_page_is_enabled') && (
            <Link
              to="/events"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              EVENTS
            </Link>
          )}

          {isFeatureEnabled('resources_page_is_enabled') && (
            <Link
              to="/resources"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              RESOURCES
            </Link>
          )}

          {isFeatureEnabled('privacy_policy_page_is_enabled') && (
            <Link
              to="/privacy-policy"
              className="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
            >
              PRIVACY POLICY
            </Link>
          )}

          {/* Social Icons */}
          <SocialLinks className="gap-4 mt-12" />

          {/* Copyright */}
          <div className="flex flex-col gap-3 mt-12">
            <p className="font-silkscreen text-xs">
              &copy; {new Date().getFullYear()} Developers Society. All rights reserved.
            </p>
          </div>
        </div>

        {/* Center Section - Contact & Newsletter */}
        <div className="flex flex-col gap-3">
          <p className="font-silkscreen text-sm uppercase tracking-wide">
            CONTACT US
          </p>
          <a
            href="mailto:contact@devsuoa.com"
            className="font-silkscreen text-xs no-underline text-[#ffffff] transition-all duration-300 ease-in-out hover:text-[#b1b1b1]"
          >
            contact@devsuoa.com
          </a>
          <br/>
          <button
            onClick={() => setCreditsOpen(true)}
            className="tracking-wide cursor-pointer font-silkscreen text-xs tracking-wide hover:opacity-80 text-left"
          >
            website credits
          </button>

          {/* TODO: Implement newsletter subscription system */}
          {/* <div className="mt-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Handle newsletter subscription
                const formData = new FormData(e.currentTarget);
                const email = formData.get("email");
                console.log("Newsletter subscription:", email);
                // TODO: Implement subscription logic
              }}
              className="flex flex-col gap-3"
            >
              <label
                htmlFor="newsletter-email"
                className="font-pixelify text-xs"
              >
                Join our newsletter to stay updated!
              </label>
              <div className="flex gap-2">
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full sm:w-72 md:w-96 bg-transparent border-2 border-white px-3 py-2 text-white font-silkscreen text-xs focus:outline-none focus:border-opacity-80"
                />
                <button
                  type="submit"
                  className="bg-white text-black px-4 py-2 font-silkscreen text-xs hover:opacity-80 transition-opacity"
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div> */}
        </div>

        {/* Game Boy Section */}
        <div className="flex items-start justify-center gap-16">
          <div className="relative mt-16 w-40 h-40">
            <img
              src="/footer/gameboy_buttons.png"
              alt="gameboy buttons"
              className="w-full h-full pixelated"
            />
          </div>
          <div className="relative ml-7 w-[6.75rem] h-[6.25rem]">
            <img
              src="/footer/gameboy_button.png"
              alt="gameboy button"
              className="w-full h-full pixelated"
            />
          </div>
        </div>
      </div>
    </footer>
    <Credits isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  
            


  );
};

export default Footer;
