import { Link } from "react-router-dom";
import { SocialLinks } from "./SocialLinks";
import { isFeatureEnabled } from "../lib/featureFlags";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-black/50 to-transparent text-white py-8">
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col items-center px-6">
        {/* Contact Section - Centered */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <p className="font-silkscreen text-sm uppercase tracking-wide">CONTACT US</p>
          <a
            href="mailto:contact@devsuoa.com"
            className="font-silkscreen text-xs no-underline text-[#ffffff] transition-all duration-300 ease-in-out hover:text-[#b1b1b1]"
          >
            contact@devsuoa.com
          </a>
        </div>

        {/* Navigation Links - Centered */}
        <MobileFooterLinks
          divClassName="flex flex-col items-center gap-2 mb-8"
          linkClassName="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
        />

        {/* Bottom Section - Social Links & Gameboy Buttons */}
        <div className="w-full flex items-end justify-between px-4">
          {/* Social Icons - Bottom Left */}
          <SocialLinks className="gap-4" />

          {/* Gameboy Buttons - Bottom Right */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <img
                src="/footer/gameboy_buttons.png"
                alt="gameboy buttons"
                className="w-full h-full pixelated"
              />
            </div>
            <div className="relative w-[3.375rem] h-[3.125rem]">
              <img
                src="/footer/gameboy_button.png"
                alt="gameboy button"
                className="w-full h-full pixelated"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid mx-auto grid-cols-3 gap-1 px-20">
        {/* Left Section - Navigation Links */}
        <div className="flex flex-col gap-0">
          <FooterLinks
            divClassName="flex flex-col gap-0"
            linkClassName="link-white font-silkscreen text-xs tracking-wide hover:opacity-80"
          />

          {/* Social Icons */}
          <SocialLinks className="gap-4 mt-12" />

          {/* Copyright */}
          <div className="flex flex-col gap-3 mt-12">
            <p className="font-silkscreen text-xs">
              &copy; {new Date().getFullYear()} Developers Society. All rights
              reserved.
            </p>
          </div>
        </div>

        {/* Center Section - Contact & Newsletter */}
        <div className="flex flex-col gap-3">
          <p className="font-silkscreen text-sm uppercase tracking-wide">CONTACT US</p>
          <a
            href="mailto:contact@devsuoa.com"
            className="font-silkscreen text-xs no-underline text-[#ffffff] transition-all duration-300 ease-in-out hover:text-[#b1b1b1]"
          >
            contact@devsuoa.com
          </a>
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
        <div className="flex items-start justify-end gap-16">
          <div className="relative mb-0 mt-auto lg:w-30 sm:w-50 object-cover">
            <img
              src="/footer/gameboy_buttons.png"
              alt="gameboy buttons"
              className="w-full h-full pixelated"
            />
          </div>
          <div className="relative mb-15 mt-auto lg:w-30 sm:w-50 object-cover">
            <img
              src="/footer/gameboy_button.png"
              alt="gameboy button"
              className="w-full h-full pixelated"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

const MobileFooterLinks = ({
  divClassName,
  linkClassName,
}: {
  divClassName: string;
  linkClassName: string;
}) => {
  return (
    <div className={divClassName}>
      {isFeatureEnabled("links_page_is_enabled") && (
        <Link to="/links" className={linkClassName}>
          LINKS
        </Link>
      )}

      {isFeatureEnabled("privacy_policy_page_is_enabled") && (
        <Link to="/privacy-policy" className={linkClassName}>
          PRIVACY POLICY
        </Link>
      )}

      {isFeatureEnabled("terms_and_conditions_page_is_enabled") && (
        <Link to="/terms" className={linkClassName}>
          TERMS AND CONDITIONS
        </Link>
      )}
    </div>
  );
};

const FooterLinks = ({
  divClassName,
  linkClassName,
}: {
  divClassName: string;
  linkClassName: string;
}) => {
  return (
    <div className={divClassName}>
      {isFeatureEnabled("home_page_is_enabled") && (
        <Link to="/" className={linkClassName}>
          HOME
        </Link>
      )}

      {isFeatureEnabled("links_page_is_enabled") && (
        <Link to="/links" className={linkClassName}>
          LINKS
        </Link>
      )}

      {isFeatureEnabled("about_us_page_is_enabled") && (
        <Link to="/about" className={linkClassName}>
          ABOUT US
        </Link>
      )}

      {isFeatureEnabled("team_page_is_enabled") && (
        <Link to="/team" className={linkClassName}>
          MEET OUR TEAM
        </Link>
      )}

      {isFeatureEnabled("sponsors_page_is_enabled") && (
        <Link to="/sponsors" className={linkClassName}>
          SPONSORS
        </Link>
      )}

      {isFeatureEnabled("events_page_is_enabled") && (
        <Link to="/events" className={linkClassName}>
          EVENTS
        </Link>
      )}

      {isFeatureEnabled("projects_page_is_enabled") && (
        <Link to="/projects" className={linkClassName}>
          PROJECTS
        </Link>
      )}

      {isFeatureEnabled("resources_page_is_enabled") && (
        <Link to="/resources" className={linkClassName}>
          RESOURCES
        </Link>
      )}

      {isFeatureEnabled("privacy_policy_page_is_enabled") && (
        <Link to="/privacy-policy" className={linkClassName}>
          PRIVACY POLICY
        </Link>
      )}

      {isFeatureEnabled("terms_and_conditions_page_is_enabled") && (
        <Link to="/terms" className={linkClassName}>
          TERMS AND CONDITIONS
        </Link>
      )}
    </div>
  );
};

export default Footer;
