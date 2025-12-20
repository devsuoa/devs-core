import React from 'react';
import { PageTitle } from '../components/PageTitle';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();
    if (!isFeatureEnabled('privacy_policy_page_is_enabled')) {
        onPageNotFound(navigate);
        return null;
    }
    
    return (
        <>
            <Header />
            <PageTitle
                image="/theme/title_icon.png"
                title="Privacy Policy"
                subtext='Last updated: 2025-12-20'
                className='max-w-6xl !px-0'
            />
            <main className="min-h-screen text-white px-6 py-12">
                <div className="max-w-6xl mx-auto space-y-6">
                    <p>
                        Developers Society (“we”, “us”, “our”, or "DEVS") respects your privacy. This Privacy Policy
                        explains how we collect, use, store, and share personal information when
                        you visit or use our website:{" "}
                        <a
                            href="https://www.devsuoa.com"
                            className="underline text-blue-400"
                        >
                            https://www.devsuoa.com
                        </a>
                        .
                    </p>

                    <p>
                        We are a university club operating in New Zealand and comply with the
                        Privacy Act 2020 (NZ).
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            1. Information We Collect
                        </h2>

                        <h3 className="font-semibold mt-4">a) Analytics Data</h3>
                        <p>
                            We use PostHog Analytics to understand how visitors use our website.
                            This helps us improve performance, usability, and content.
                        </p>
                        <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                            <li>Pages visited</li>
                            <li>Links clicked</li>
                            <li>Device type and browser</li>
                            <li>Approximate location (country/region level)</li>
                            <li>Anonymous identifiers (cookies or similar technologies)</li>
                        </ul>
                        <p className="mt-2">
                            We do not use analytics to personally identify you.
                        </p>

                        <h3 className="font-semibold mt-6">b) Information You Provide</h3>
                        <p>
                            When you submit forms on our website (for example, sign-ups, contact
                            forms, or event registrations), we may collect:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>University affiliation</li>
                            <li>Any other information you choose to provide</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            2. How We Use Your Information
                        </h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                            <li>Operate and improve our website</li>
                            <li>Understand how users interact with the site</li>
                            <li>Manage club activities, events, and communications</li>
                            <li>Respond to enquiries or submissions</li>
                            <li>Meet university reporting or administrative requirements</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            3. Sharing of Information
                        </h2>
                        <p>
                            Because we are a university club, some information collected through
                            forms may be:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                            <li>Stored internally by DEVS</li>
                            <li>
                                Shared with the University of Auckland where required for club
                                administration, event approvals, funding, reporting, or compliance
                                purposes
                            </li>
                        </ul>
                        <p className="mt-2 font-bold">
                            We do not sell personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            4. Analytics & Cookies
                        </h2>
                        <p>
                            We use PostHog, which may place cookies or similar technologies on your
                            device to collect usage data.
                        </p>
                        <p className="mt-2">
                            You can control or disable cookies through your browser settings.
                            Disabling cookies may affect parts of the website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            5. Data Storage & Security
                        </h2>
                        <p>
                            We take reasonable steps to protect your information from loss, 
                            misuse, or unauthorised access. However, no online system is completely secure. 
                            In the event of a data breach, DEVS UoA will take all steps required under New Zealand law, 
                            including notifying affected individuals and relevant authorities where required.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            6. How Long We Keep Your Data
                        </h2>
                        <p>
                            We keep personal information only for as long as necessary to fulfil
                            the purposes outlined in this policy or meet university or legal
                            obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            7. Your Rights (within New Zealand)
                        </h2>
                        <p>
                            Under the Privacy Act 2020, you have the right to request access to,
                            or correction of, personal information we hold about you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            8. Third-Party Services
                        </h2>
                        <p>
                            Our website may contain links to third-party websites. We are not
                            responsible for their privacy practices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            9. Changes to This Policy
                        </h2>
                        <p>
                            We may update this Privacy Policy from time to time. Updates will be
                            posted on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mt-8 mb-2">
                            10. Contact Us
                        </h2>
                        <p>
                            If you have questions about this Privacy Policy, contact us at:
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
        </>
    );
};

export default PrivacyPolicy;

