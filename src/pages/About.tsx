import React, { useLayoutEffect, useRef } from "react";
import Footer from "../components/Footer";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import Header from "../components/Header";
import { PageTitle } from "../components/PageTitle";
import { initAboutHorizontalScroll } from "../lib/aboutController";
import PixelatedButton from "../components/PixelatedButton";
import SponsorTape from "../components/SponsorTape";

const About: React.FC = () => {
    if (!isFeatureEnabled("about_us_page_is_enabled")) {
        onPageNotFound();
        return null;
    }

    const containerRef = useRef<HTMLElement | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    useLayoutEffect(() => {
        if (!containerRef.current || !trackRef.current) return;
    
        cleanupRef.current = initAboutHorizontalScroll(
            containerRef.current,
            trackRef.current
        );
    
        const onResize = () => {
            cleanupRef.current?.();
            cleanupRef.current = initAboutHorizontalScroll(
                containerRef.current!,
                trackRef.current!
            );
        };
    
        window.addEventListener("resize", onResize);
    
        return () => {
            window.removeEventListener("resize", onResize);
            cleanupRef.current?.();
        };
    }, []);
    

    return (
        <>
            <Header />
            <main className="min-h-screen">

                {/* TITLE SECTION */}
                <PageTitle title="About Us" image="/theme/title_icon.png" className='p-0' />
                <section className="px-12 py-6 text-center max-w-4xl mx-auto font-rethink">
                    <h1 className="text-2xl font-bold">
                        Founded in 2019, DEVS has grown to become the largest tech club in Auckland.
                    </h1>
                    <p>
                        Our 2025 Co-President, Kartik Malik, is one of the greatest people to ever exist.
                        Like, pure legendary status, the glaze makes so much sense. You genuinely cannot find a better person. 
                        No one truly understands until they meet Kartik, and once they do they understand the glaze, and they themselves start glazing.
                    </p>
                </section>

                {/* LLLAAAAANNDOOOOO NORISSSSSSSSSSS */}
                <section
                    ref={containerRef}
                    className="about-horizontal-container h-screen relative overflow-hidden"
                >
                    <div
                        ref={trackRef}
                        className="about-horizontal-track flex flex-nowrap h-full will-change-transform"
                    >
                        <div className="min-w-[50vw] height-auto my-auto">
                            <img src="/home/slideshow/1.png" alt="REPLACE THIS" />
                        </div>
                        <div className="min-w-[50vw] height-auto my-auto">
                            <img src="/home/slideshow/2.png" alt="REPLACE THIS" />
                        </div>
                        <div className="min-w-[50vw] height-auto my-auto">
                            <img src="/home/slideshow/3.png" alt="REPLACE THIS" />
                        </div>
                        <div className="min-w-[50vw] height-auto my-auto">
                            <img src="/home/slideshow/4.png" alt="REPLACE THIS" />
                        </div>
                        <div className="min-w-[50vw] height-auto my-auto">
                            <img src="/home/slideshow/5.png" alt="REPLACE THIS" />
                        </div>
                    </div>
                </section>

                {/* Sponsors */}
                <section>
                    <div className="flex flex-col items-center justify-center gap-3">
                        <h1 className="text-4xl font-silkscreen text-center pb-12">Our Sponsors</h1>
                        <div className="flex flex-row items-center justify-center gap-24">
                            <p className="text-white text-sm max-w-md italic font-rethink p-0">
                                DEVS is grateful to our sponsors for their support in making our events possible.
                                From providing us with swag to sponsoring our events, we are thankful for their support.
                            </p>
                            {/* TODO: REPLACE WITH LEARN MORE BUTTON */}
                            <PixelatedButton
                                to="/sponsors"
                                inactive="/buttons/join/join_us_inactive.png"
                                hover="/buttons/join/join_us_hover.png"
                                clicked="/buttons/join/join_us_click.png"
                            />
                        </div>
                    </div>

                    {/* Sponsor banner */}
                    <div className="w-full overflow-hidden my-24">
                        <SponsorTape />
                    </div>
                </section>

                {/* WHY JOIN */}
                <section>
                    <div className="flex flex-row items-center justify-center gap-x-16">
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="pb-12">
                                <h1 className="text-4xl text-left font-silkscreen">Why Join Us?</h1>
                            </div>
                            <div className="h-12 w-72 rounded-lg bg-pink-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
                                connect with industry
                            </div>

                            <div className="h-12 w-72 rounded-lg bg-blue-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
                                develop your skills
                            </div>
                            <div className="h-12 w-72 rounded-lg bg-purple-400/80 border-2 border-white flex items-center justify-center font-pixelify text-lg">
                                meet new people
                            </div>
                        </div>

                        <div className="max-w-md pt-12">
                            <img src="/home/slideshow/1.png" alt="REPLACE THIS" />
                        </div>
                    </div>
                </section>

                {/* Team photo */}
                <section>
                    <div className="flex flex-row items-center justify-center gap-x-16 my-24">
                        <div className="flex flex-col items-center justify-center">
                            <img src="/team/execs/team.png" alt="2025/26 DEVS Exec Photo" className="w-[70%] h-auto" />
                            <p className="text-white text-sm italic font-rethink p-0">2025/26 DEVS Exec Photo</p>
                        </div>
                    </div>
                </section>

                {/* Meet DEVA */}
                <section>
                    <div className="flex flex-row items-center justify-center gap-x-16">
                        <div className="flex flex-col gap-3 text-left">
                            <div className="flex flex-col items-left justify-left">
                                <p className="text-md font-pixelify">meet our mascot</p>
                                <h1 className="text-8xl font-silkscreen pb-4">DEVA</h1>
                                <p className="text-white text-sm max-w-md italic font-rethink p-0">Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae ad ut obcaecati aperiam molestiae numquam vitae neque necessitatibus consequatur animi, harum quis dignissimos laborum. Reiciendis molestiae amet rem maiores maxime!</p>
                            </div>
                        </div>

                        <div className="max-w-md pt-12">
                            <img src="/branding/deva_mascot.png" alt="DEVA" className="w-full h-auto" />
                        </div>
                    </div>
                </section>

                {/* Join Us */}
                <section>
                    <div className="my-24">
                        <div className="flex flex-row items-center justify-center gap-x-4">
                            <img src="/landing/file.png" alt="" />
                            <h1 className="text-4xl font-silkscreen max-w-lg">
                                Ready to start your journey with DEVS?
                            </h1>
                        </div>

                        <div className="flex flex-row items-center justify-center gap-x-4 my-12">
                        <PixelatedButton
                                to="/join-us"
                                inactive="/buttons/join/join_us_inactive.png"
                                hover="/buttons/join/join_us_hover.png"
                                clicked="/buttons/join/join_us_click.png"
                            />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default About;
