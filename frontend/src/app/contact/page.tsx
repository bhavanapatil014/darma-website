export const metadata = { title: 'Contact Us - Venkata', description: 'Get in touch with Venkata support.' }
export const dynamic = 'force-static';

export default function ContactPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                    <p className="mb-2"><strong>Email:</strong> support@venkata.com</p>
                    <p className="mb-2"><strong>Phone:</strong> +91 98765 43210</p>
                    <p className="mb-2"><strong>Address:</strong> 123 Skincare Lane, Mumbai, India</p>
                    <p className="mt-4 text-gray-600">
                        Our customer support team is available Monday to Saturday, 9 AM to 6 PM IST.
                    </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Send us a Message</h2>
                    <p className="text-gray-500 italic">Form coming soon...</p>
                </div>
            </div>
        </div>
    )
}
