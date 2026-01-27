
import React from 'react';

export const metadata = {
    title: 'Privacy Policy - DermaKart',
    description: 'Privacy Policy and data protection details for DermaKart.',
};

export const dynamic = 'force-static';

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="lead text-lg">
                    At DermaKart, we are committed to maintaining the trust and confidence of our visitors to our web site. In this Privacy Policy, we’ve provided detailed information on when and why we collect your personal information, how we use it, the limited conditions under which we may disclose it to others and how we keep it secure.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">1. Information We Collect</h3>
                <p>
                    We may collect personal information such as your name, email address, phone number, and shipping address when you interact with our website, place an order, or sign up for our newsletter.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">2. How We Use Your Information</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>To process and deliver your orders.</li>
                    <li>To communicate with you regarding your account or inquiries.</li>
                    <li>To send you promotional offers and updates (only if you’ve opted in).</li>
                    <li>To improve our website functionality and user experience.</li>
                </ul>

                <h3 className="text-xl font-bold mt-8 text-gray-800">3. Data Security</h3>
                <p>
                    We implement a variety of security measures to maintain the safety of your personal information. Your personal data is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">4. Third-Party Disclosure</h3>
                <p>
                    We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">5. Cookies</h3>
                <p>
                    Our website uses cookies to enhance your browsing experience. You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies.
                </p>

                <p className="mt-8 text-sm text-gray-500 border-t pt-4">Last Updated: January 2026</p>
            </div>
        </div>
    );
}
