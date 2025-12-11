import React from "react";

const logo = "/construction/logo.png";
const Header = () => {
  return (
    <>
      <nav className="flex items-center mt-[30px] ml-[40px] gap-[100px]">
        <img className=" max-w-[7vw] pixelated" src={logo} alt="Logo" />

        <ul className="">
          <li className="flex gap-[200px] items-center justify-center list-none ml-[60px] text-white font-pixelify text-[20px]">
            <a href="#" className="">
              Our Team
            </a>
            <a href="#" className="">
              Events
            </a>
            <a href="#" className="">
              Sponsors
            </a>
            <a href="#" className="">
              Contact Us
            </a>
          </li>
        </ul>
        <button className="flex ml-auto mr-[100px] bg-[#FF5733] hover:bg-[#e04e2d] text-white font-pixelify text-[18px] py-2 px-4 rounded-lg transition-colors duration-300">
          Join Us
        </button>
      </nav>
    </>
  );
};

export default Header;
