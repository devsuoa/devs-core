import React from "react"

import instagramIcon from '/socials/Instagram.png';
import facebookIcon from '/socials/Facebook.png';
import linkedinIcon from '/socials/LinkedIn.png';

type SocialLinksProps = {
    /**
     * Show Instagram link
     * @default true
     */
    instagram?: boolean

    /**
     * Show Facebook link
     * @default true
     */
    facebook?: boolean

    /**
     * Show LinkedIn link
     * @default true
     */
    linkedin?: boolean

    /**
     * Container class for extra styling
     */
    className?: string

}

export const SocialLinks: React.FC<SocialLinksProps> = ({
    instagram = true,
    facebook = true,
    linkedin = true,
    className = "",
}) => {
    return (        
        <div className={`flex gap-16 items-center social-media ${className}`}>
            {instagram && (
                <a
                    href="https://www.instagram.com/devsuoa/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        src={instagramIcon}
                        alt="Instagram"
                        className="transition-all duration-300 ease-in-out hover:scale-110 pixelated"
                    />
                </a>
            )}

            {facebook && (
                <a
                    href="https://www.facebook.com/devsuoa/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        src={facebookIcon}
                        alt="Facebook"
                        className="transition-all duration-300 ease-in-out hover:scale-110 pixelated"
                    />
                </a>
            )}

            {linkedin && (
                <a
                    href="https://www.linkedin.com/company/devsuoa/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        src={linkedinIcon}
                        alt="LinkedIn"
                        className="transition-all duration-300 ease-in-out hover:scale-110 pixelated"
                    />
                </a>
            )}
        </div>
    )
}
