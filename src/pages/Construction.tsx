import React from 'react';

// Public assets are served at the root path
const logo = '/construction/logo.png';
const constructionWorker = '/construction/construction_worker.png';
const instagram = '/construction/Instagram.png';
const facebook = '/construction/Facebook.png';
const linkedin = '/construction/LinkedIn.png';

const Construction: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen px-16 py-12 box-border max-[1024px]:flex-col max-[1024px]:justify-center max-[1024px]:p-8">
      <div className="flex flex-col gap-8 w-full max-w-[55%] max-[1024px]:max-w-full max-[1024px]:gap-8">
        <div>
          <img 
            src={logo} 
            alt="Developer's Society" 
            className="max-w-[15vw] w-full pixelated"
          />
        </div>
        
        <div className="max-w-[85%]">
          <div>
            <p className="font-silkscreen text-[2.5rem] leading-tight m-0 max-[1024px]:text-2xl">
              This website is currently under development!
            </p>
          </div>
          <div className="font-pixelify text-base mt-4">
            <p>
              Need to reach out?<br /> 
              Send us an email at{' '}
              <a 
                href="mailto:contact@devsuoa.com"
                className="no-underline text-[#ffffff] transition-all duration-300 ease-in-out hover:text-[#b1b1b1]"
              >
                contact@devsuoa.com
              </a>
            </p>
          </div>
        </div>
        
        <div className="flex gap-16 items-center social-media">
          <a href="https://www.instagram.com/devsuoa/" target="_blank" rel="noopener noreferrer">
            <img 
              src={instagram} 
              alt="Instagram" 
              className="transition-all duration-300 ease-in-out hover:scale-110 pixelated"
            />
          </a>
          <a href="https://www.facebook.com/devsuoa/" target="_blank" rel="noopener noreferrer">
            <img 
              src={facebook} 
              alt="Facebook" 
              className="transition-all duration-300 ease-in-out hover:scale-110 pixelated"
            />
          </a>
          <a href="https://www.linkedin.com/company/devsuoa/" target="_blank" rel="noopener noreferrer">
            <img 
              src={linkedin} 
              alt="LinkedIn" 
              className="transition-all duration-300 ease-in-out hover:scale-110 pixelated"
            />
          </a>
        </div>
      </div>

      <div className="flex items-end m-0 p-0 max-[1024px]:max-w-[80%] max-[1024px]:mt-8">
        <img 
          src={constructionWorker} 
          alt="Developer's Society" 
          className="w-[20vw] h-auto pixelated max-[1024px]:w-[40vw]"
        />
      </div>
    </div>
  );
};

export default Construction;

