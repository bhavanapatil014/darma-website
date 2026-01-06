

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProductCard } from "@/components/ui/product-card";
import { fetchProducts } from "@/lib/data";

async function getSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings`, { cache: 'no-store' });
    return res.json();
  } catch (error) {
    return { heroTitle: 'Your Skin, Our Science', heroSubtitle: 'Doctor Recommended Skincare Solutions' };
  }
}

export default async function Home() {
  const settings = await getSettings();
  const { products } = await fetchProducts();
  const featuredProducts = products.slice(0, 4);

  const concerns = [
    { name: "Acne", icon: "🔴", color: "bg-red-100" },
    { name: "Pigmentation", icon: "🟤", color: "bg-orange-100" },
    { name: "Dryness", icon: "💧", color: "bg-blue-100" },
    { name: "Hair Fall", icon: "💇‍♀️", color: "bg-purple-100" },
    { name: "Dull Skin", icon: "✨", color: "bg-yellow-100" },
    { name: "Open Pores", icon: "⭕", color: "bg-gray-100" },
    { name: "Oily Skin", icon: "🧴", color: "bg-green-100" },
    { name: "Sun Protection", icon: "☀️", color: "bg-amber-100" }
  ];

  const brands = [
    { name: "CeraVe", image: "https://logos-world.net/wp-content/uploads/2022/07/CeraVe-Logo.png" },
    { name: "Cetaphil", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Cetaphil_logo.svg/2560px-Cetaphil_logo.svg.png" },
    { name: "The Ordinary", image: "https://upload.wikimedia.org/wikipedia/commons/2/22/The_Ordinary_logo.png" },
    { name: "Bioderma", image: "https://companieslogo.com/img/orig/BIO.PA-7a06a090.png" },
    { name: "Neutrogena", image: "https://1000logos.net/wp-content/uploads/2020/09/Neutrogena-Logo.png" },
    { name: "La Roche-Posay", image: "https://logos-world.net/wp-content/uploads/2020/12/La-Roche-Posay-Logo.png" }
  ];

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Carousel Banner */}
      <section className="relative w-full overflow-hidden bg-gray-100">
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          {/* Static Hero Image for now, Carousel to be implemented if needed */}
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1556228720-1987594b5952?q=80&w=2670&auto=format&fit=crop" alt="Hero" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-transparent"></div>
          </div>

          <div className="container relative z-10 mx-auto px-4 h-full flex flex-col justify-center text-white max-w-6xl">
            <span className="font-semibold tracking-wider text-teal-200 mb-2 uppercase text-sm md:text-base">Dermatologist Approved</span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight max-w-2xl">
              {settings.heroTitle || 'Science-Backed Skincare for Radiant Skin'}
            </h1>
            <p className="text-lg md:text-xl text-teal-50 mb-8 max-w-xl">
              {settings.heroSubtitle || 'Discover our range of premium products tailored for your skin concerns.'}
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="rounded-full px-8 bg-white text-teal-900 hover:bg-gray-100 font-bold" asChild>
                <Link href="/shop">Shop Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-white border-white hover:bg-white/20" asChild>
                <Link href="/shop?category=cleansers">Explore Cleansers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Concern - Circular Icons */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Concern</h2>
          <p className="text-gray-500 mt-2">Targeted solutions for your specific skin needs</p>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-8">
          {concerns.map((concern, idx) => (
            <Link href={`/shop?search=${concern.name}`} key={idx} className="flex flex-col items-center gap-3 group">
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${concern.color} flex items-center justify-center text-2xl shadow-sm border border-white group-hover:scale-110 transition-transform duration-300`}>
                {concern.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600 text-center">{concern.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Brands Banner Strip */}
      <section className="py-8 bg-teal-50 border-y border-teal-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {brands.map((brand, i) => (
              <Link key={i} href={`/shop?brand=${encodeURIComponent(brand.name)}`} className="h-8 md:h-12 w-auto flex items-center justify-center group cursor-pointer">
                {/* Using text fallback if image fails, or generic logos */}
                <span className="text-lg font-bold text-gray-400 group-hover:text-teal-700 transition-colors">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers Grid */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-teal-600 font-bold tracking-wider text-xs uppercase">Highly Recommended</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900">Best Selling Products</h2>
          </div>
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link href="/shop">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-80 rounded-xl"></div>
            ))
          )}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/shop">View All Products</Link>
          </Button>
        </div>
      </section>

      {/* Value Props / Trust Indicators */}
      <section className="container mx-auto px-4 my-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">100% Authentic</h4>
              <p className="text-sm text-gray-500">Sourced directly from brands</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Dermatologist Verified</h4>
              <p className="text-sm text-gray-500">Approved by skin experts</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Secure Payments</h4>
              <p className="text-sm text-gray-500">Safe & encrypted transactions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
