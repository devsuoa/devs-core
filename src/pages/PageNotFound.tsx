import React from 'react';
import { Link } from 'react-router-dom';
const logo = '/branding/text_logo.png';
const errorDeva = '/branding/deva_not_found.png';

const PageNotFound: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen w-screen px-16 py-12 box-border max-[768px]:flex-col max-[768px]:justify-start max-[768px]:px-4 max-[768px]:py-8">
          {/* Desktop Layout */}
          <div className="flex flex-col gap-8 w-full max-w-[55%] max-[768px]:hidden">
            <div>
              <img 
                src={logo} 
                alt="Developer's Society" 
                className="max-w-[15vw] w-full pixelated"
              />
            </div>
            
            <div className="max-w-[85%]">
              <div>
                <p className="font-silkscreen text-[2.5rem] leading-tight m-0">
                  Error 404 <br /> Page Not Found
                </p>
              </div>
              <div className="font-pixelify text-base mt-4">
                <p>
                The page you are looking for does not exist.
                </p>
                <p className="mt-[1rem]">
                  <Link to="/" className="text-white hover:underline">Return to home page</Link>
                </p>
              </div>
            </div>
          </div>
    
            {/* Mobile Layout */}
          <div className="flex items-end m-0 p-0 max-[768px]:hidden">
            <img 
              src={errorDeva} 
              alt="Developer's Society" 
              className="w-[20vw] h-auto pixelated"
            />
          </div>
    
          <div className="hidden mobile max-[768px]:flex max-[768px]:flex-col max-[768px]:items-center max-[768px]:w-full max-[768px]:gap-4 max-[768px]:p-8 max-[768px]:h-screen max-[768px]:justify-between">
            <div className="flex justify-center w-full">
              <img 
                src={logo} 
                alt="DEVS" 
                className="w-[100px] pixelated"
              />
            </div>
    
            <div className="flex flex-col items-start justify-center w-full">
              <div className="flex justify-start">
                <img 
                  src={errorDeva} 
                  alt="Construction Worker" 
                  className="w-[140px] h-auto pixelated scale-x-[-1]"
                />
              </div>
    
              <div className="flex flex-col items-start">
                <p className="font-silkscreen text-[2rem] leading-tight m-0 text-left">
                  Error 404 <br /> Page Not Found
                </p>
              </div>
    
              <div className="font-pixelify text-xs text-left mt-2">
                <p className="m-0">
                  The page you are looking for does not exist.
                </p>
                <p className="mt-[1rem]">
                  <Link to="/" className="text-white hover:underline">Return to home page</Link>
                </p>
              </div>
            </div>
    
            <div className="flex items-center justify-center w-full">
            </div>
          </div>
        </div>
      );
}

export default PageNotFound;