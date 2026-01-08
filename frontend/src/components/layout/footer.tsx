import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-teal-800 uppercase">
                            Venkata Derma<span className="text-accent"></span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Premium dermatology solutions for your skin's health and beauty. Scientifically formulated, clinically proven.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/shop" className="hover:text-primary">All Products</Link></li>
                            <li><Link href="/shop?category=skincare" className="hover:text-primary">Skincare</Link></li>
                            <li><Link href="/shop?category=treatments" className="hover:text-primary">Treatments</Link></li>
                            <li><Link href="/shop?category=bundles" className="hover:text-primary">Bundles</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                            <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
                            <li><Link href="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-semibold mb-4">Stay Updated</h4>
                        <p className="text-sm text-muted-foreground mb-4">Subscribe to receive exclusive offers and skincare tips.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <Button>Subscribe</Button>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Venkata Derma. All rights reserved. <span className="text-xs opacity-50 ml-2">v3.11 (Live)</span></p>
                </div>
            </div>
        </footer>
    );
}
