import React from "react";

type PageTitleProps = {
  /**
   * Image to display next to the title
   * @example "icon_logo.png"
   */
  image?: string | undefined;

  /**
   * Title to display on a page
   * Automatically prefixed with '>' and converted to uppercase
   * @example "Upcoming Events"
   */
  title: string;

  /**
   * Subtext with more information about the page
   * @example "See and register for our upcoming events"
   */
  subtext?: string;

  /**
   * Alt text for the image
   * @example "Developer's Society Logo"
   */
  imageAlt?: string;

  /**
   * Class name for the container for extra styling
   */
  className?: string;
};

export const PageTitle: React.FC<PageTitleProps> = ({
  image,
  title,
  subtext,
  imageAlt = "Page Icon",
  className = "max-w-4xl",
}) => {
  return (
    <div className={`flex flex-col justify-center px-[8vw] py-12 mx-auto ${className}`}>
      <div className="flex items-center gap-1 md:gap-4 mb-8 md:mb-16">
        {image && (
          <img
            src={image}
            alt={image ? imageAlt : undefined}
            className="max-h-[50px] max-w-[50px] md:max-h-[100px] md:max-w-[100px] shrink-0 object-contain"
          />
        )}

        <div className="flex items-center ml-[1rem]">
          <p className="text-[1rem] md:text-[2rem] font-normal text-white font-silkscreen">
            {"> " + title.toUpperCase()}
          </p>
        </div>
      </div>

      {subtext && <p className="text-[1.05rem] text-gray-300 font-rethink">{subtext}</p>}
    </div>
  );
};
