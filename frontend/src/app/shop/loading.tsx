
import { Skeleton } from "@/components/ui/skeleton-loader"; // We'll assume usage of inline classes for now if file not found, but I will create a simple inline structure.

export default function ShopLoading() {
    return (
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-6 py-8">
            {/* Breadcrumb Skeleton */}
            <div className="flex gap-2 mb-6">
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Sidebar Skeleton */}
                <aside className="w-full lg:w-[280px] flex-shrink-0 sticky top-24 self-start space-y-6">
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="space-y-2 mt-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-2 items-center">
                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="h-20 w-full bg-gray-100 rounded animate-pulse mt-8" />
                </aside>

                {/* Main Content Skeleton */}
                <div className="flex-1 w-full min-w-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg border border-gray-100 overflow-hidden h-full flex flex-col"
                            >
                                {/* Image Area */}
                                <div className="aspect-[4/5] bg-gray-200 animate-pulse" />

                                {/* Content Area */}
                                <div className="p-3 pt-4 flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse mt-2" />
                                    <div className="h-9 w-full bg-gray-200 rounded animate-pulse mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
