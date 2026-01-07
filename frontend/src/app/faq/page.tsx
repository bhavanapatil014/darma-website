export const metadata = { title: 'FAQ - Venkata', description: 'Frequently asked questions about Venkata products and shipping.' }
export const dynamic = 'force-static';

export default function FAQPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">How long does shipping take?</h3>
                    <p className="text-gray-600">Standard shipping typically takes 3-5 business days within major cities.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2">Are all products authentic?</h3>
                    <p className="text-gray-600">Yes, 100%. We source directly from authorized distributors and brands.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2">What is your return policy?</h3>
                    <p className="text-gray-600">We accept returns for damaged or incorrect items within 7 days of delivery. Opened skincare products cannot be returned for hygiene reasons.</p>
                </div>
            </div>
        </div>
    )
}
