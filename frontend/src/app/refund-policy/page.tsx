
import React from 'react';

export const metadata = {
    title: 'Refund Policy - DermaKart',
    description: 'Refund and Return policy details for DermaKart.',
};

export const dynamic = 'force-static';

export default function RefundPolicyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Refund & Cancellation Policy</h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="lead text-lg">
                    Our goal is to ensure you are completely satisfied with your purchase. If for any reason you are not satisfied, please review our refund and cancellation policy below.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">1. Cancellations</h3>
                <p>
                    You can cancel your order before it has been shipped. To cancel, please contact our support team immediately. Once the order has been shipped, it cannot be cancelled, but it may be eligible for return.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">2. Returns</h3>
                <p>
                    We accept returns within 7 days of delivery for damaged or incorrect items. To be eligible for a return, your item must be unused, in the same condition that you received it, and in the original packaging.
                </p>
                <p>
                    <strong>Note:</strong> Certain health and personal care items may not be eligible for return due to hygiene reasons.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">3. Refunds</h3>
                <p>
                    Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
                </p>
                <p>
                    If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">4. Late or Missing Refunds</h3>
                <p>
                    If you haven’t received a refund yet, first check your bank account again. Then contact your credit card company, as it may take some time before your refund is officially posted. If you’ve done all of this and you still have not received your refund yet, please contact us.
                </p>

                <p className="mt-8 text-sm text-gray-500 border-t pt-4">Last Updated: January 2026</p>
            </div>
        </div>
    );
}
