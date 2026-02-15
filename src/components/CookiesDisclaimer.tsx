import { useState, useEffect } from "react";
import PixelatedButton from "./PixelatedButton";
import { getCookieConsent, acceptCookies, declineCookies } from "../lib/cookieConsentController";
import { isFeatureEnabled } from "../lib/featureFlags";

const CookieDisclaimer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    acceptCookies();
    setIsVisible(false);
  };

  const handleDecline = () => {
    declineCookies();
    setIsVisible(false);
  };

  if (!isVisible || !isFeatureEnabled('cookie_consent_is_enabled')) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white md:p-6 p-4 z-50 shadow-2xl ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6 mx-auto max-w-6xl">
        <p className="md:text-base text-sm leading-relaxed m-0">
          We use cookies to enhance your experience, analyse site traffic. By clicking "Accept", you consent to our use
          of cookies.<br />
          <a href="/privacy-policy" target="_blank" className="underline ml-1 hover:text-white">
            For more information read our Privacy Policy
          </a>
          .
        </p>

        <div className="flex gap-3 shrink-0 items-center justify-center md:justify-end">
          <PixelatedButton
            inactive="buttons/submit/submit_inactive.png"
            hover="buttons/submit/submit_hover.png"
            clicked="/buttons/submit/submit_click.png"
            onClick={handleDecline}
            className="h-10 w-24 shrink-0"
          />
          <PixelatedButton
            inactive="buttons/submit/submit_inactive.png"
            hover="buttons/submit/submit_hover.png"
            clicked="/buttons/submit/submit_click.png"
            onClick={handleAccept}
            className="h-10 w-24 shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

export default CookieDisclaimer;
