export const metadata = { title: 'About Us - Venkata', description: 'Learn about Venkata and our mission.' }

export default function AboutPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-6">About Venkata</h1>
            <div className="prose max-w-none">
                <p className="mb-4">
                    Welcome to Venkata, your trusted destination for dermatologist-recommended skincare.
                    We believe that healthy skin is happy skin, and we are dedicated to bringing you the best products
                    from world-renowned brands.
                </p>
                <p>
                    Our mission is to simplify skincare by providing a curated selection of effective,
                    science-backed formulations suitable for all skin types. Whether you are dealing with acne,
                    dryness, or just looking to maintain a healthy glow, we have something for you.
                </p>
            </div>
        </div>
    )
}
