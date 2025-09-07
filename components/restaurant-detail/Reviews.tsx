'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, StarHalf } from '@phosphor-icons/react';
import { Flag } from 'lucide-react';

type Review = {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    reportCount: number;
    user: {
        name: string;
    };
};

export default function Reviews({ restaurantId }: { restaurantId: string }) {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportingId, setReportingId] = useState<string | null>(null);

    // Yorumları yükle
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch(`/api/restaurants/${restaurantId}/reviews`);
                const data = await response.json();

                // API yanıtı doğru formatta mı kontrol et
                if (data && Array.isArray(data.reviews)) {
                    // reportCount'u doğru biçimde ayarla
                    const reviewsWithReportCount = data.reviews.map((review: any) => ({
                        ...review,
                        reportCount: review.reportCount || 0
                    }));
                    setReviews(reviewsWithReportCount);
                } else if (Array.isArray(data)) {
                    // reportCount'u doğru biçimde ayarla
                    const reviewsWithReportCount = data.map((review: any) => ({
                        ...review,
                        reportCount: review.reportCount || 0
                    }));
                    setReviews(reviewsWithReportCount);
                } else {
                    console.error('Beklenmeyen API yanıt formatı:', data);
                    setReviews([]);
                }
            } catch (error) {
                console.error('Yorumlar yüklenirken hata:', error);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [restaurantId]);

    // Yorum gönder
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        if (!comment.trim()) {
            setError('Lütfen yorumunuzu giriniz.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Yorumunuz başarıyla eklendi.');
                setComment('');
                setRating(5);

                // Yeni yorumu ekle
                if (data && data.review) {
                    setReviews(prevReviews => [data.review, ...prevReviews]);
                }
            } else {
                setError(data.error || 'Yorum eklenirken bir hata oluştu.');
            }
        } catch (error) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            console.error('Yorum gönderme hatası:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Yorumu şikayet et
    const handleReportReview = async (reviewId: string) => {
        if (!session) {
            setError('Şikayet etmek için giriş yapmalısınız');
            return;
        }

        try {
            setReportingId(reviewId);
            setError(null);
            setSuccess(null);

            const response = await fetch(`/api/restaurants/${restaurantId}/reviews/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reviewId
                }),
            });

            const data = await response.json();
            console.log('Şikayet yanıtı:', data);

            if (response.ok) {
                setSuccess('Yorum başarıyla şikayet edildi');

                // API'den dönen güncel reportCount değerini kullan
                const newReportCount = data.reportCount || 0;
                console.log(`Yorum ${reviewId} için şikayet sayısı güncelleniyor: ${newReportCount}`);

                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review.id === reviewId
                            ? { ...review, reportCount: newReportCount }
                            : review
                    )
                );
            } else {
                setError(data.error || 'Şikayet işlemi sırasında bir hata oluştu');
            }
        } catch (error) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            console.error('Şikayet gönderme hatası:', error);
        } finally {
            setReportingId(null);
        }
    };

    // Tarihi formatla
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            return 'Geçersiz tarih';
        }
    };

    // Derecelendirme yıldızlarını oluştur
    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Star
                    key={`star-${i}`}
                    weight="fill"
                    className="text-yellow-400"
                    size={20}
                />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <StarHalf
                    key="half-star"
                    weight="fill"
                    className="text-yellow-400"
                    size={20}
                />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Star
                    key={`empty-star-${i}`}
                    className="text-gray-300"
                    size={20}
                />
            );
        }

        return stars;
    };

    return (
        <div className="mt-12 mb-8">
            <h3 className="text-2xl font-semibold mb-6">Yorumlar ({reviews.length})</h3>

            {/* Yorum Formu */}
            {session ? (
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                    <h4 className="text-lg font-medium mb-4">Yorum Yapın</h4>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium">Puanlama</label>
                            <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        className="focus:outline-none"
                                        disabled={isSubmitting}
                                    >
                                        <Star
                                            weight={value <= rating ? 'fill' : 'regular'}
                                            className={value <= rating ? 'text-yellow-400' : 'text-gray-300'}
                                            size={24}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="comment" className="block mb-2 text-sm font-medium">
                                Yorumunuz
                            </label>
                            <textarea
                                id="comment"
                                rows={4}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none"
                                placeholder="Bu restoran hakkında düşüncelerinizi paylaşın..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`px-4 py-2 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-50 p-6 rounded-lg mb-8 text-center">
                    <p className="text-gray-600">
                        Yorum yapmak için{' '}
                        <a href="/login" className="text-[#7F0005] hover:underline">
                            giriş yapın
                        </a>
                    </p>
                </div>
            )}

            {/* Yorum Listesi */}
            <div className="space-y-6">
                {loading ? (
                    <p className="text-gray-500">Yorumlar yükleniyor...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-gray-500">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6">
                            <div className="flex items-center mb-2 justify-between">
                                <div className="flex items-center">
                                    <div className="flex mr-2">
                                        {renderStars(review.rating)}
                                    </div>
                                    <span className="text-gray-700 font-medium">
                                        {review.user?.name || 'Misafir'}
                                    </span>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <span className="text-gray-500 text-sm">
                                        {formatDate(review.createdAt)}
                                    </span>
                                </div>

                                {session && (
                                    <button
                                        onClick={() => handleReportReview(review.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                        disabled={reportingId === review.id}
                                        title="Bu yorumu şikayet et"
                                    >
                                        <Flag size={16} />
                                        <span className="text-xs">{reportingId === review.id ? 'İşlem yapılıyor...' : 'Şikayet Et'}</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-600">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 