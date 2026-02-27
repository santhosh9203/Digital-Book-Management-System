import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService, orderService, walletService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineShoppingCart, HiOutlineDownload, HiArrowLeft } from 'react-icons/hi';
import PaymentSimulatorModal from '../components/PaymentSimulatorModal';

export default function BookDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [purchased, setPurchased] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        fetchBook();
    }, [id]);

    useEffect(() => {
        if (user && book) {
            checkPurchased();
            fetchBalance();
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

    const checkPurchased = async () => {
        try {
            const res = await orderService.getMyOrders();
            const orders = res.data.orders || [];
            const found = orders.find((o) => o.book_id === book.id && o.status === 'paid');
            setPurchased(!!found);
        } catch {
            // ignore
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

    const handleBuy = async () => {
        if (!user) {
            toast.error('Please login to purchase');
            navigate('/login');
            return;
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
            });
            toast.success('Payment successful! You can now download the book.');
            setPurchased(true);
            setIsPaymentModalOpen(false);
        } catch {
            toast.error('Payment verification failed');
        }
    };

    const handleDownload = async () => {
        try {
            const res = await bookService.download(book.id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${book.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Download started!');
        } catch {
            toast.error('Download failed');
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

    const coverUrl = book.cover_image_url ? bookService.getCoverUrl(book.id) : null;

    return (
        <div className="page-container min-h-screen">
            <button onClick={() => navigate('/books')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
                <HiArrowLeft /> Back to Books
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Cover */}
                <div className="glass rounded-2xl overflow-hidden" style={{ maxHeight: '500px' }}>
                    {coverUrl ? (
                        <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-80 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                            <div className="text-6xl">📚</div>
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
                        {purchased ? (
                            <button onClick={handleDownload} className="btn-primary py-3 px-8">
                                <HiOutlineDownload className="text-lg" />
                                Download PDF
                            </button>
                        ) : (
                            <button onClick={handleBuy} disabled={purchasing} className="btn-primary py-3 px-8">
                                {purchasing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <>
                                        <HiOutlineShoppingCart className="text-lg" />
                                        Buy Now — ₹{parseFloat(book.price).toFixed(0)}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
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
