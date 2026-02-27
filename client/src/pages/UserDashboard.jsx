import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService, bookService } from '../services';
import toast from 'react-hot-toast';
import { HiOutlineDownload, HiOutlineBookOpen, HiOutlineClock, HiOutlineCreditCard, HiOutlineEye } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';

export default function UserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await orderService.getMyOrders();
            setOrders(res.data.orders || []);
        } catch {
            toast.error('Failed to fetch your library');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (bookId, title) => {
        const loadingToast = toast.loading('Preparing download...');
        try {
            const res = await bookService.download(bookId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Download started!', { id: loadingToast });
        } catch {
            toast.error('Download failed', { id: loadingToast });
        }
    };

    const handleRead = (bookId) => {
        navigate(`/read/${bookId}`);
    };

    const paidOrders = orders.filter(o => o.status === 'paid');

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="page-container min-h-screen">
            {/* Header */}
            <div className="mb-10 p-8 glass rounded-2xl flex items-center gap-6 border-white/5 shadow-xl transition-all hover:border-white/10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/10 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white' }}>
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Welcome, {user.name}
                        </h1>
                        {!user.email.includes('gmail.com') && (
                            <p className="text-slate-400">{user.email}</p>
                        )}
                    </div>
                    <Link to="/wallet" className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all active:scale-95">
                        <HiOutlineCreditCard className="text-lg" />
                        Manage Wallet
                    </Link>
                </div>
            </div>

            {/* Library */}
            <div className="mb-20">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                        <HiOutlineBookOpen className="text-blue-400" />
                        My Library ({paidOrders.length})
                    </h2>
                    <Link to="/books" className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                        Explore more books →
                    </Link>
                </div>

                {paidOrders.length === 0 ? (
                    <div className="text-center py-20 glass rounded-2xl border-white/5 bg-slate-800/20">
                        <div className="text-6xl mb-6 grayscale opacity-20">📚</div>
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">Your library is empty</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Explore our collection and start building your personal digital library.</p>
                        <Link to="/books" className="btn-primary py-3 px-8">Browse Bookstore</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paidOrders.map((order) => {
                            const book = order.book_id;
                            if (!book) return null;

                            return (
                                <div key={order.id} className="card p-6 group flex flex-col hidden-overflow h-full border-white/5 hover:border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/5 bg-slate-800/10">
                                    <div className="flex gap-5 mb-6 flex-1">
                                        {/* Small Cover */}
                                        <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-2xl bg-slate-900 group-hover:rotate-1 transition-transform">
                                            {book.cover_image_url ? (
                                                <img src={bookService.getCoverUrl(book._id || book.id)} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">📖</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg mb-1 line-clamp-2 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 mb-3 font-medium">by {book.author}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                    {book.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-white/5 mt-auto">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                                <HiOutlineClock className="text-xs" />
                                                Purchased on {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/books/${book._id || book.id}`)}
                                                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-tighter transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRead(book._id || book.id)}
                                                className="flex-1 btn-primary py-2.5 px-3 text-[11px] font-bold flex items-center justify-center gap-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border-blue-500/30 transition-all active:scale-95"
                                            >
                                                <HiOutlineEye className="text-sm" /> Read Me
                                            </button>
                                            <button
                                                onClick={() => handleDownload(book._id || book.id, book.title)}
                                                className="btn-primary py-2.5 px-4 text-[11px] font-bold flex items-center justify-center gap-2 bg-green-600/10 text-green-400 hover:bg-green-600 hover:text-white border-green-500/30 transition-all active:scale-95"
                                                title="Download PDF"
                                            >
                                                <HiOutlineDownload className="text-sm" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
