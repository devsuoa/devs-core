import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { isFeatureEnabled } from "../lib/featureFlags";
import PixelatedButton from "./PixelatedButton";

const logo = "/branding/deva_head.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setIsClosing(false);
    }, 400);
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="mt-[30px] px-6 lg:px-[40px] relative z-50">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center">
            <img className="h-[40px] lg:max-w-[8vw] pixelated" src={logo} alt="Logo" />
          </Link>

          <div className="hidden xl:flex items-center gap-[10vw] font-silkscreen text-[20px] whitespace-nowrap">
            {isFeatureEnabled("about_us_page_is_enabled") && (
              <Link to="/about" className="link-white">
                ABOUT
              </Link>
            )}

            {isFeatureEnabled("events_page_is_enabled") && (
              <Link to="/events" className="link-white">
                EVENTS
              </Link>
            )}

            {isFeatureEnabled("sponsors_page_is_enabled") && (
              <Link to="/sponsors" className="link-white">
                SPONSORS
              </Link>
            )}

            {isFeatureEnabled("contact_page_is_enabled") && (
              <Link to="/contact" className="link-white">
                CONTACT US
              </Link>
            )}
          </div>

          {/* Desktop button */}
          <div className="hidden xl:block">
            {isFeatureEnabled("join_us_page_is_enabled") && (
              <PixelatedButton
                to="/join"
                inactive="./buttons/join/join_us_inactive.png"
                hover="./buttons/join/join_us_hover.png"
                clicked="./buttons/join/join_us_click.png"
                className="w-[120px]"
              />
            )}
          </div>

          {/* Hamburger Menu */}
          <button
            className="xl:hidden hover:cursor-pointer flex flex-col gap-1"
            onClick={() => {
              setMenuOpen(true);
              setIsClosing(false);
            }}
            aria-label="Open menu"
          >
            <span className="w-6 h-[2px] bg-white" />
            <span className="w-6 h-[2px] bg-white" />
            <span className="w-6 h-[2px] bg-white" />
          </button>
        </div>
      </nav>

      {/* Mobile menu*/}
      {menuOpen && (
        <div
          className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#04060f] z-[100] flex flex-col ${isClosing ? "animate-fadeOut" : "animate-fadeIn"}`}
        >
          <div className="flex items-center justify-between px-6 pt-8">
            <Link to="/home" onClick={() => closeMenu()}>
              <img className="w-[50px] pixelated " src={logo} alt="Logo" />
            </Link>

            <button
              className="text-white text-4xl hover:cursor-pointer font-silkscreen"
              onClick={() => closeMenu()}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-10 font-silkscreen text-[26px]">
            {isFeatureEnabled("about_us_page_is_enabled") && (
              <Link to="/about" className="link-white" onClick={() => closeMenu()}>
                ABOUT
              </Link>
            )}

            {isFeatureEnabled("team_page_is_enabled") && (
              <Link to="/team" className="link-white" onClick={() => closeMenu()}>
                TEAM
              </Link>
            )}

            {isFeatureEnabled("events_page_is_enabled") && (
              <Link to="/events" className="link-white" onClick={() => closeMenu()}>
                EVENTS
              </Link>
            )}

            {isFeatureEnabled("sponsors_page_is_enabled") && (
              <Link to="/sponsors" className="link-white" onClick={() => closeMenu()}>
                SPONSORS
              </Link>
            )}

            {isFeatureEnabled("contact_page_is_enabled") && (
              <Link to="/contact" className="link-white" onClick={() => closeMenu()}>
                CONTACT US
              </Link>
            )}

            {isFeatureEnabled("join_us_page_is_enabled") && (
              <div className="pt-8">
                <PixelatedButton
                  to="/join"
                  inactive="./buttons/join/join_us_inactive.png"
                  hover="./buttons/join/join_us_hover.png"
                  clicked="./buttons/join/join_us_click.png"
                  className="w-[160px]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
