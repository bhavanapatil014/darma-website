
import React from 'react';

export const metadata = {
    title: 'Shipping Policy - DermaKart',
    description: 'Shipping and Delivery details for DermaKart.',
};

export const dynamic = 'force-static';

export default function ShippingPolicyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Shipping Policy</h1>
            <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="lead text-lg">
                    We are dedicated to delivering your order as quickly and efficiently as possible.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">1. Order Processing Time</h3>
                <p>
                    All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">2. Shipping Rates & Delivery Estimates</h3>
                <p>
                    Shipping charges for your order will be calculated and displayed at checkout.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Standard Shipping:</strong> 3-5 business days</li>
                    <li><strong>Express Shipping:</strong> 1-2 business days (if available)</li>
                </ul>
                <p>
                    Delivery delays can occasionally occur due to unforeseen circumstances or carrier delays.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">3. Serviceable Pincodes</h3>
                <p>
                    We currently ship to most major cities and towns across India. You can check if we deliver to your location by entering your pincode on the product page or at checkout.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">4. Shipment Confirmation & Order Tracking</h3>
                <p>
                    You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
                </p>

                <h3 className="text-xl font-bold mt-8 text-gray-800">5. Damages</h3>
                <p>
                    DermaKart is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.
                </p>

                <p className="mt-8 text-sm text-gray-500 border-t pt-4">Last Updated: January 2026</p>
            </div>
        </div>
    );
}
