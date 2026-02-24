import posthog from 'posthog-js';
import React from 'react';
import Header from '../components/Header';
import { useActiveLinks, getFaviconUrl } from '../lib/linksController';
import { SocialLinks } from '../components/SocialLinks';
// import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';
import BinaryBackground from '../components/BinaryBackground';

const Links: React.FC = () => {
  const { links, loading, error } = useActiveLinks();

  React.useEffect(() => {
    if (!isFeatureEnabled('links_page_is_enabled')) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled('links_page_is_enabled')) {
    return null;
  }


  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center mt-[20vh]">
          <p className="font-pixelify text-white">Loading...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center mt-[20vh]">
          <p className="font-pixelify text-red-400">An unknown error occurred. Please try again later.</p>
        </div>
      </>
    );
  }

  return (
    <>
    <BinaryBackground />
    <div className='p-8 lg:p-0'>
      <div className="flex items-center flex-col justify-center mt-[10vh] mb-[2rem] gap-4">
        <img
          src="/branding/deva_head.png"
          className="object-cover h-20 sm:h-24 rounded-lg"
        />
        <p className="font-silkscreen font-bold text-[2rem] text-white text-center" style={{ marginBottom: '0.5rem' }}>Developers Society</p>
        <p className="font-rethink text-white text-center text-[1rem]">Connecting software enthusiasts with the industry. 👾</p>
      </div>

      <SocialLinks className="flex items-center justify-center m-0 mb-[4rem] p-0" />

      <div className="flex items-center justify-center mt-6 mb-16 px-4 sm:mb-24">
        <div className="w-full max-w-[680px] mx-auto">
          {links.length === 0 ? (
            <div className="pixel-panel relative" style={{ padding: '48px 40px' }}>
              <p className="font-pixelify text-white text-center text-[1rem]">
                Nothing here at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {links.map((link, index) => {
                // spacer rendering
                if (link.is_spacer) {
                  return (
                    <div
                      key={link.id}
                      className="relative flex text-white items-center justify-center px-4 py-4 sm:px-7 sm:py-6 min-h-8 my-6"
                    >
                      {link.title && (
                        <span className="font-pixelify text-white opacity-90 text-center text-[1rem]">
                          {link.title}
                        </span>
                      )}
                    </div>
                  );
                }

                // Determine the icon source, custom icon takes priority over favicon
                const iconSrc = link.custom_icon || getFaviconUrl(link.url);

                // Regular link
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      posthog.capture('link_clicked', {
                        link_id: link.id,
                        title: link.title,
                        url: link.url,
                        position: index + 1,
                        has_custom_icon: Boolean(link.custom_icon),
                        source: 'links_page',
                      },
                        {
                          send_instantly: true,
                        });
                    }}
                    className="link-panel pixel-panel relative flex items-center gap-4 text-white transition-all px-4 py-4 sm:px-7 sm:py-6 no-underline max-w-full break-words min-h-[56px] mb-4"
                    style={{ marginBottom: '1rem', gap: '1rem' }}
                  >
                    <img
                      src={iconSrc}
                      alt={`${link.title} Photo`}
                      className="flex-shrink-0 object-cover w-10 h-10 sm:w-[60px] sm:h-[60px]"
                      style={{ borderRadius: '5px' }}
                    />
                    <span className="font-rethink text-white flex-1 min-w-0 text-center text-[1rem] break-words">
                      {link.title}
                    </span>
                    <span className="text-white opacity-50 flex-shrink-0 text-[8px]">
                      →
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <p className="text-white text-center text-[1rem] mb-12">
        <Link to="/privacy-policy" className="text-white font-rethink hover:text-gray-300 hover:underline transition-all duration-300 ease-in-out">
          Privacy Policy
        </Link>
      </p>
      </div>
      {/* <Footer /> */}
      
    </>
  );
};

export default Links;
