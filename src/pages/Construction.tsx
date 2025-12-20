import React from 'react';
import { SocialLinks } from '../components/SocialLinks';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';
// Public assets are served at the root path
const logo = '/branding/text_logo.png';
const constructionWorker = '/construction/construction_worker.png';

const Construction: React.FC = () => {
  const navigate = useNavigate();
  if (!isFeatureEnabled('construction_page_is_enabled')) {
    onPageNotFound(navigate);
    return null;
  }

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
        
        <SocialLinks/>
      </div>

        {/* Mobile Layout */}
      <div className="flex items-end m-0 p-0 max-[768px]:hidden">
        <img 
          src={constructionWorker} 
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
              src={constructionWorker} 
              alt="Construction Worker" 
              className="w-[140px] h-auto pixelated scale-x-[-1]"
            />
          </div>

          <div className="flex flex-col items-start">
            <p className="font-silkscreen text-[2rem] leading-tight m-0 text-left uppercase">
              THIS WEBSITE IS<br />
              CURRENTLY UNDER<br />
              DEVELOPMENT!
            </p>
          </div>

          <div className="font-pixelify text-xs text-left mt-2">
            <p className="m-0 lowercase">
              need to reach out?<br />
              send us an email at{' '}
              <a 
                href="mailto:contact@devsuoa.com"
                className="no-underline text-[#ffffff] transition-all duration-300 ease-in-out"
              >
                contact@devsuoa.com
              </a>
            </p>
          </div>
        </div>

        <div className="social-media flex items-center justify-center w-full">
        <SocialLinks/>
        </div>
      </div>
    </div>
  );
};

export default Construction;

