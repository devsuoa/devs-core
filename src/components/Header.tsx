import React from "react";

const logo = "/construction/logo.png";
const Header = () => {
  return (
    <>
      <nav className="flex items-center justify-between mt-[30px] px-[40px]">
        {/* Logo Section */}
        <div className="flex-0.5">
          <img className="max-w-[8vw] pixelated" src={logo} alt="Logo" />
        </div>

        {/* Links Section */}
        <div className="flex-0.5 flex justify-center items-center">
          <ul className="flex gap-[175px] items-center list-none font-pixelify text-[25px] whitespace-nowrap">
            <li>
              <a href="#" className="link-white">
                Our Team
              </a>
            </li>
            <li>
              <a href="#" className="link-white">
                Events
              </a>
            </li>
            <li>
              <a href="#" className="link-white">
                Sponsors
              </a>
            </li>
            <li>
              <a href="#" className="link-white">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Button Section */}
        <div className="flex-0.5 flex justify-end">
          <button className="font-pixelify text-[25px] bg-transparent link-white rounded-[8px] border-[2px] border-white px-[20px] py-[10px] hover:bg-white hover:text-black transition-all duration-300 ease-in-out">
            Join Us
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
