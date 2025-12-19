import React from "react"

type PageTitleProps = {

    /**
    * Image to display next to the title
    * @example "icon_logo.png"
    */
    image: string

    /**
     * Title to display on a page
     * Automatically prefixed with '>' and converted to uppercase
     * @example "Upcoming Events"
     */
    title: string

    /**
     * Subtext with more information about the page
     * @example "See and register for our upcoming events"
     */
    subtext?: string

    /**
     * Alt text for the image
     * @example "Developer's Society Logo"
     */
    imageAlt?: string

    /**
     * Class name for the container for extra styling
     */
    className?: string
}

export const PageTitle: React.FC<PageTitleProps> = ({
    image,
    title,
    subtext,
    imageAlt = "Page Icon",
    className = "",
}) => {
    return (
        <div
            className={`flex flex-col justify-center px-[10vw] py-12 max-w-4xl mx-auto ${className}`}
        >
            <div className="flex items-center gap-4 mb-16">
                <img
                    src={image}
                    alt={imageAlt}
                    className="max-h-[100px] max-w-[100px] shrink-0 object-contain pixelated"
                />

                <div className="flex items-center ml-[5rem]">
                    <p className="text-[2rem] font-normal text-white font-silkscreen">
                        {"> " + title.toUpperCase()}
                    </p>
                </div>
            </div>

            {subtext && (
                <p className="text-[1.05rem] text-gray-300">
                    {subtext}
                </p>
            )}
        </div>
    )
}
