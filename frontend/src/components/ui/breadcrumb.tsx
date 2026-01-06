import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-black transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
            </Link>
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-black transition-colors font-medium text-gray-600">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-semibold text-gray-900 line-clamp-1 max-w-[200px]">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
