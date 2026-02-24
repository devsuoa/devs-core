import React from 'react';
import { PageTitle } from '../components/PageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';

const TermsAndConditions: React.FC = () => {
    React.useEffect(() => {
        if (!isFeatureEnabled('terms_and_conditions_page_is_enabled')) {
            onPageNotFound();
        }
    }, []);

    if (!isFeatureEnabled('terms_and_conditions_page_is_enabled')) {
        return null;
    }

    return (
        <>
            <div className="hidden md:block">
                <Header />
            </div>

            <PageTitle
                title="Terms and Conditions"
                subtext="Last updated: 2025-12-20"
                className="max-w-6xl !px-4"
            />

            <main className="min-h-screen text-white px-6 py-12">
                <div className="max-w-6xl mx-auto space-y-6">
                    <p>
                        These Terms and Conditions govern your use of the DEVS website located at{" "}
                        <a
                            href="https://www.devsuoa.com"
                            className="underline text-blue-400"
                        >
                            https://www.devsuoa.com
                        </a>
                        . By accessing or using this website, you agree to be bound by these terms.
                        If you do not agree, please do not use the website.
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            1. About DEVS
                        </h2>
                        <p>
                            Developers Society (“DEVS”, “we”, “us”, or “our”) is a student-run
                            computer science and engineering club based in Auckland, New Zealand.
                            This website provides information about our club, events, memberships,
                            sponsors, and activities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            2. Use of the Website
                        </h2>
                        <p>
                            You agree to use this website only for lawful purposes and in a way
                            that does not infringe the rights of others or restrict their use of
                            the website.
                        </p>
                        <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                            <li>Attempt to gain unauthorised access to the website or systems</li>
                            <li>Interfere with the website's functionality or security</li>
                            <li>Upload or distribute malicious, offensive, or illegal content</li>
                            <li>Misuse forms, registrations, or submission features</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            3. Memberships and Registrations
                        </h2>
                        <p>
                            When registering for membership, events, or submitting information
                            through this website, you agree to provide accurate and up-to-date
                            information.
                        </p>
                        <p className="mt-2">
                            DEVS reserves the right to suspend or remove access, registrations,
                            or memberships that breach these Terms and Conditions or applicable
                            university rules.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            4. Events and Activities
                        </h2>
                        <p>
                            Event details, schedules, and availability are provided for
                            informational purposes only and may change without notice.
                        </p>
                        <p className="mt-2">
                            To the extent permitted by law, DEVS is not responsible for any loss,
                            injury, or damage incurred while attending events, except where such
                            liability cannot be excluded under New Zealand law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            5. Intellectual Property
                        </h2>
                        <p>
                            All content on this website, including text, images, graphics, logos,
                            and branding, is owned by DEVS unless stated otherwise.
                        </p>
                        <p className="mt-2">
                            You may view and use content for personal, non-commercial purposes
                            only. You must not reproduce, distribute, or modify content without
                            prior written permission from DEVS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            6. Third-Party Links
                        </h2>
                        <p>
                            This website may contain links to third-party websites, including
                            sponsors or partners. DEVS is not responsible for the content,
                            availability, or practices of those websites.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            7. Limitation of Liability
                        </h2>
                        <p>
                            To the fullest extent permitted by law, DEVS is not liable for any
                            direct or indirect loss, damage, or expense arising from your use of,
                            or inability to use, this website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            8. Changes to These Terms
                        </h2>
                        <p>
                            We may update these Terms and Conditions from time to time. Any
                            changes will be posted on this page. Continued use of the website
                            means you accept the updated terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            9. Governing Law
                        </h2>
                        <p>
                            These Terms and Conditions are governed by the laws of New Zealand.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            10. Contact Us
                        </h2>
                        <p>
                            If you have any questions about these Terms and Conditions, contact us
                            at:
                        </p>
                        <p className="mt-2">
                            <span className="font-semibold">Email:</span>{" "}
                            <a
                                href="mailto:contact@devsuoa.com"
                                className="underline text-blue-400"
                            >
                                contact@devsuoa.com
                            </a>
                        </p>
                    </section>
                </div>
            </main>

            <div className="hidden md:block">
                <Footer />
            </div>
        </>
    );
};

export default TermsAndConditions;
