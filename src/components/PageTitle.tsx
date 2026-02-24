import React from "react";

type PageTitleProps = {

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
   * Class name for the container for extra styling
   */
  className?: string;
};

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtext,
  className = "max-w-4xl",
}) => {
  return (
    <div className={`flex flex-col justify-center px-[8vw] py-12 mx-auto ${className}`}>
      <div className="flex items-center justify-center gap-1 mt-10 md:gap-4  mb-8">

        <div className="flex items-center justify-center ">
          <p className="text-2xl md:text-5xl text-center font-normal text-white font-silkscreen">
            { title.toUpperCase()}
          </p>
        </div>
      </div>

      {subtext && <p className="md:text-[1.05rem] text-center text-sm text-gray-300 lg:mt-10 -mb-10 lg:mb-0 font-rethink">{subtext}</p>}
    </div>
  );
};
