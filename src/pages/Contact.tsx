import React from "react";
import Footer from "../components/Footer";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import Header from "../components/Header";
import { PageTitle } from "../components/PageTitle";
import SponsorForm from "../components/SponsorForm";

const Contact: React.FC = () => {
  React.useEffect(() => {
    if (!isFeatureEnabled("contact_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled("contact_page_is_enabled")) {
    return null;
  }

  return (
    <>
      <Header />

      <main className="min-h-screen">
        <PageTitle
          title="Contact Us"
          image="/theme/title_icon.png"
          className="p-0"
        />

        {/* ===== MAIN CONTENT ===== */}
        <section className="px-12 py-8">
          <div className="w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
            {/* DESKTOP ONLY — LEFT IMAGE */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div>
                <p className="pb-4">
                  Got a question? Get in touch and we'll get back to you as soon
                  as possible.
                </p>
                <img
                  src="/branding/deva_wave.png"
                  alt="Construction Deva"
                  className="pixelated w-[420px]"
                />
              </div>
            </div>

            {/* RIGHT — FORM + MOBILE IMAGE */}
            <div className="flex flex-1 flex-col items-center justify-center w-full">
              <p className="pb-8 text-center lg:hidden">
                Got a question? Get in touch and we'll get back to you as soon
                as possible.
              </p>

              {/* Use the refactored SponsorForm component in contact mode */}
              <div className="w-full max-w-[520px]">
                <SponsorForm formType="contact" />
              </div>

              {/* MOBILE ONLY — IMAGE BELOW FORM */}
              <div className="lg:hidden mt-10 flex justify-center">
                <img
                  src="/branding/deva_wave.png"
                  alt="Construction Deva"
                  className="pixelated w-[260px] sm:w-[320px]"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Contact;
