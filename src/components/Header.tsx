const logo = "/branding/text_logo.png";
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
          <ul className="flex gap-[10vw] items-center list-none font-silkscreen text-[20px] whitespace-nowrap">
            <li>
              <a href="#" className="link-white">
                OUR TEAM
              </a>
            </li>
            <li>
              <a href="#" className="link-white">
                EVENTS
              </a>
            </li>
            <li>
              <a href="#" className="link-white">
                SPONSORS
              </a>
            </li>
            <li>
              <a href="#" className="link-white">
                CONTACT US
              </a>
            </li>
          </ul>
        </div>

        {/* Button Section */}
        <div className="flex-0.5 flex justify-end">
          <button className="font-silkscreen text-[25px] bg-transparent link-white">
            Join Us
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
