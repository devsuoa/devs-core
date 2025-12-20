import { Link } from "react-router-dom";
import { isFeatureEnabled } from "../lib/featureFlags";

const logo = "/branding/text_logo.png";
const Header = () => {
  return (
    <>
      <nav className="flex items-center justify-between mt-[30px] px-[40px]">
        {/* Logo Section */}
        <div className="flex-0.5">
          <Link to="/">
          <img className="max-w-[8vw] pixelated" src={logo} alt="Logo" />
          </Link>
        </div>

        {/* Links Section */}
        <div className="flex-0.5 flex justify-center items-center">
          <ul className="flex gap-[10vw] items-center list-none font-silkscreen text-[20px] whitespace-nowrap">
            {isFeatureEnabled('team_page_is_enabled') && (
              <li>
                <Link to="/team" className="link-white">
                  OUR TEAM
                </Link>
              </li>
            )}

            {isFeatureEnabled('events_page_is_enabled') && (
              <li>
                <Link to="/events" className="link-white">
                  EVENTS
                </Link>
              </li>
            )}

            {isFeatureEnabled('sponsors_page_is_enabled') && (
              <li>
                <Link to="/sponsors" className="link-white">
                  SPONSORS
                </Link>
              </li>
            )}

            {isFeatureEnabled('contact_page_is_enabled') && (
              <li>
                <Link to="/contact" className="link-white">
                  CONTACT US
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Button Section */}
        <div className="flex-0.5 flex justify-end">
          {isFeatureEnabled('join_us_page_is_enabled') && (
            <Link to="#" className="font-silkscreen text-[25px] bg-transparent link-white">
              Join Us
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};

export default Header;
