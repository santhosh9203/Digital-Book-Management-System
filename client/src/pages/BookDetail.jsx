import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService, orderService, walletService, userService, reviewService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineShoppingCart, HiArrowLeft, HiStar, HiOutlineStar } from 'react-icons/hi';
import PaymentSimulatorModal from '../components/PaymentSimulatorModal';

export default function BookDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState({ average: 0, count: 0 });
    const [reviewEligibility, setReviewEligibility] = useState({ loading: true, eligible: false, reason: '' });
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    useEffect(() => {
        fetchBook();
    }, [id]);

    useEffect(() => {
        if (user && book) {
            fetchBalance();
        }
    }, [user, book]);

    useEffect(() => {
        if (book) {
            fetchReviews();
        }
    }, [book]);

    useEffect(() => {
        if (user && book) {
            fetchReviewEligibility();
        } else {
            setReviewEligibility({ loading: false, eligible: false, reason: '' });
        }
    }, [user, book]);

    const fetchBook = async () => {
        try {
            const res = await bookService.getById(id);
            setBook(res.data.book);
        } catch {
            toast.error('Book not found');
            navigate('/books');
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await walletService.getBalance();
            setWalletBalance(res.data.balance || 0);
        } catch {
            // ignore
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await reviewService.getBookReviews(id);
            setReviews(res.data.reviews || []);
            setReviewSummary(res.data.summary || { average: 0, count: 0 });
        } catch {
            setReviews([]);
            setReviewSummary({ average: 0, count: 0 });
        }
    };

    const fetchReviewEligibility = async () => {
        try {
            const res = await reviewService.getEligibility(id);
            setReviewEligibility({ loading: false, eligible: !!res.data.eligible, reason: res.data.reason || '' });
        } catch {
            setReviewEligibility({ loading: false, eligible: false, reason: '' });
        }
    };

    const handleBuy = async () => {
        if (!user) {
            toast.error('Please login to purchase');
            navigate('/login');
            return;
        }

        try {
            const statusRes = await userService.getTransactionPasswordStatus();
            if (!statusRes.data.isSet) {
                toast.error('Set your transaction password in Wallet first.');
                navigate('/wallet');
                return;
            }
        } catch {
            // ignore and proceed
        }

        if (walletBalance < book.price) {
            toast.error('Insufficient balance (add money on wallet)');
            navigate('/wallet');
            return;
        }

        setPurchasing(true);
        try {
            const res = await orderService.createOrder(book.id);
            setOrderData(res.data);
            setIsPaymentModalOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setPurchasing(false);
        }
    };

    const handlePaymentSuccess = async (response) => {
        try {
            await orderService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                password: response.password,
            });
            toast.success('Order placed successfully!');
            window.dispatchEvent(new Event('notifications:refresh'));
            return { ok: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Payment verification failed';
            toast.error(message);
            return { ok: false, message };
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewRating) {
            toast.error('Select a star rating');
            return;
        }
        setReviewSubmitting(true);
        try {
            await reviewService.createReview({
                book_id: book.id || book._id,
                rating: reviewRating,
                comment: reviewComment,
            });
            toast.success('Review submitted');
            setReviewRating(0);
            setReviewComment('');
            fetchReviews();
            fetchReviewEligibility();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="spinner" />
            </div>
        );
    }

    if (!book) return null;

    const coverUrl = book.cover_image_url ? bookService.getCoverUrl(book.id || book._id) : null;

    return (
        <div className="page-container min-h-screen">
            <button onClick={() => navigate('/books')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
                <HiArrowLeft /> Back to Books
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Cover */}
                {/* Cover with improved centering and no cropping */}
                <div className="glass rounded-2xl overflow-hidden flex items-center justify-center bg-slate-900/10 h-[450px]">
                    {coverUrl ? (
                        <img src={coverUrl} alt={book.title} className="max-w-full max-h-full object-contain shadow-2xl transition-transform hover:scale-[1.02]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                            📚
                        </div>
                    )}
                </div>

                {/* Details */}
                <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                        {book.category}
                    </span>

                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        {book.title}
                    </h1>
                    <p className="text-slate-400 text-sm mb-6">by {book.author}</p>

                    <div className="text-3xl font-bold gradient-text mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                        ₹{parseFloat(book.price).toFixed(2)}
                    </div>

                    {book.description && (
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Description</h3>
                            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                                {book.description}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleBuy} disabled={purchasing} className="btn-primary py-3 px-8">
                            {purchasing ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    <HiOutlineShoppingCart className="text-lg" />
                                    Place Order — ₹{parseFloat(book.price).toFixed(0)}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 glass rounded-2xl p-6 border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Customer Reviews</h2>
                        <p className="text-xs text-slate-400">Verified buyers only</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-white">{reviewSummary.average.toFixed(1)}</div>
                        <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                                i < Math.round(reviewSummary.average) ? (
                                    <HiStar key={`avg-${i}`} className="text-yellow-400" />
                                ) : (
                                    <HiOutlineStar key={`avg-${i}`} className="text-slate-500" />
                                )
                            ))}
                        </div>
                        <div className="text-xs text-slate-400">{reviewSummary.count} reviews</div>
                    </div>
                </div>

                {/* Write review form removed as per request */}

                <div className="space-y-4">
                    {reviews.length === 0 ? (
                        <div className="text-sm text-slate-500">No reviews yet. Be the first to review.</div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review._id || review.id} className="border border-white/10 rounded-xl p-4 bg-slate-900/40">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-white font-semibold">{review.user_id?.name || 'Customer'}</div>
                                    <div className="text-[10px] text-slate-500">{new Date(review.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        i < review.rating ? (
                                            <HiStar key={`r-${review._id}-${i}`} className="text-yellow-400 text-sm" />
                                        ) : (
                                            <HiOutlineStar key={`r-${review._id}-${i}`} className="text-slate-600 text-sm" />
                                        )
                                    ))}
                                </div>
                                {review.comment && (
                                    <p className="text-sm text-slate-300">{review.comment}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <PaymentSimulatorModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={handlePaymentSuccess}
                orderData={orderData}
                bookTitle={book.title}
            />
        </div>
    );
}
