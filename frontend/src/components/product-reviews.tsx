"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface Review {
    _id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export function ProductReviews({ productId }: { productId: string }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:4000/api/reviews/${productId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch reviews");
                return res.json();
            })
            .then(data => {
                setReviews(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("Please login to write a review");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId, rating, comment })
            });

            if (!res.ok) throw new Error("Failed to submit review");

            const newReview = await res.json();
            setReviews([newReview, ...reviews]);
            setComment("");
            setRating(5);
        } catch (error) {
            alert("Error submitting review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-8 border-t pt-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-bold mb-4">Customer Reviews</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-xs">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p className="text-gray-500 italic text-xs">No reviews yet. Be the first to review!</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review._id} className="border-b pb-2 last:border-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-sm">{review.userName}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex text-yellow-400 text-[10px] mb-1">
                                    {"★".repeat(review.rating)}
                                    <span className="text-gray-200">{"★".repeat(5 - review.rating)}</span>
                                </div>
                                <p className="text-gray-700 text-xs">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Form */}
                <div className="bg-gray-50 p-4 rounded-lg h-fit">
                    <h3 className="text-sm font-semibold mb-2">Write a Review</h3>
                    {user ? (
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <div>
                                <label className="block text-[10px] font-medium mb-1">Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`text-lg ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium mb-1">Comment</label>
                                <textarea
                                    className="w-full p-2 text-xs border rounded-md"
                                    rows={2}
                                    required
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Share your experience..."
                                ></textarea>
                            </div>
                            <Button type="submit" disabled={submitting} size="sm" className="w-full h-8 text-xs">
                                {submitting ? "Submitting..." : "Submit Review"}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <p className="mb-2 text-xs text-gray-600">Please log in to write a review.</p>
                            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                                <a href="/login">Log In</a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
