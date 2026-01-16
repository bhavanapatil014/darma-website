
import { Truck, CheckCircle, ShieldCheck, Banknote } from "lucide-react";

interface TrustBadgesProps {
    className?: string;
}

export function TrustBadges({ className }: TrustBadgesProps) {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-b border-gray-100 ${className || ''}`}>
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Banknote className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">COD Available</h4>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide">Pan-India</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">Free Delivery</h4>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide">Above ₹599</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">100% Genuine</h4>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide">Products</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">Dermatologist</h4>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide">Verified</p>
                </div>
            </div>
        </div>
    );
}
