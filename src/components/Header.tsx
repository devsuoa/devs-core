import React from "react";
const logo = "/construction/logo.png";
const Header = () => {
  return (
    <>
      <nav className="flex items-center mt-[30px] ml-[40px] ">
        <img className=" max-w-[7vw] pixelated" src={logo} alt="Logo" />

        <div className=""></div>
      </nav>
    </>
  );
};

export default Header;
