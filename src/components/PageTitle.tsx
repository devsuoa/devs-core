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

  /**
   * Reduces the title's vertical padding/margins, e.g. to tighten the gap
   * before content that follows directly below on smaller layouts.
   */
  compact?: boolean;
};

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtext,
  className = "max-w-4xl",
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col justify-center px-[8vw] ${compact ? "pt-4 pb-6" : "py-12"} mx-auto ${className}`}
    >
      <div
        className={`flex items-center justify-center gap-1 md:gap-4 ${compact ? "mt-2 mb-4" : "mt-10 mb-8"}`}
      >
        <div className="flex items-center justify-center ">
          <p className="text-2xl md:text-5xl text-center font-normal text-white font-silkscreen">
            {title.toUpperCase()}
          </p>
        </div>
      </div>

      {subtext && (
        <p className="md:text-[1.05rem] text-center text-sm text-gray-300 lg:mt-10 -mb-10 lg:mb-0 font-rethink">
          {subtext}
        </p>
      )}
    </div>
  );
};
