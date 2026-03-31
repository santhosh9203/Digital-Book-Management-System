import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { orderService, bookService } from '../services';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const STATUS_STEPS = [
    { key: 'order_placed', label: 'Order placed' },
    { key: 'processing', label: 'Processing' },
    { key: 'packed', label: 'Packed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for delivery' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'returned', label: 'Returned' },
];

const formatStatus = (status) => {
    if (!status) return 'order placed';
    return status.replace(/_/g, ' ');
};

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString();
};

export default function MyOrders() {
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [returningId, setReturningId] = useState(null);

    const highlightedId = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return location.state?.orderId || searchParams.get('highlight');
    }, [location]);

    useEffect(() => {
        fetchOrders();
    }, []);


    const fetchOrders = async () => {
        try {
            const res = await orderService.getMyOrders();
            setOrders(res.data.orders || []);
        } catch {
            toast.error('Failed to fetch your orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Cancel this order?')) return;
        setCancellingId(orderId);
        try {
            const res = await orderService.cancelOrder(orderId);
            const updated = res.data.order;
            const updatedId = (updated._id || updated.id)?.toString();
            setOrders((prev) => prev.map((o) => ((o._id || o.id)?.toString() === updatedId ? updated : o)));
            toast.success('Order cancelled');
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancellingId(null);
        }
    };

    const handleReturnOrder = async (orderId) => {
        if (!window.confirm('Return this order? Refund will be issued to your wallet.')) return;
        setReturningId(orderId);
        try {
            const res = await orderService.returnOrder(orderId);
            const updated = res.data.order;
            const updatedId = (updated._id || updated.id)?.toString();
            setOrders((prev) => prev.map((o) => ((o._id || o.id)?.toString() === updatedId ? updated : o)));
            toast.success('Return requested. Refund issued.');
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to return order');
        } finally {
            setReturningId(null);
        }
    };

    const now = new Date();
    const visibleOrders = orders.filter((order) => {
        if (order.status !== 'paid') return false;
        if (['cancelled', 'returned'].includes(order.fulfillment_status)) return false;
        if (order.fulfillment_status === 'delivered') {
            if (!order.delivery_date) return false;
            const deliveredAt = new Date(order.delivery_date);
            const returnDeadline = new Date(deliveredAt.getTime() + 24 * 60 * 60 * 1000);
            if (order.refunded_at) return false;
            return now <= returnDeadline;
        }
        return true;
    });

    useEffect(() => {
        if (!highlightedId) return;
        const timer = setTimeout(() => {
            const target = document.getElementById(`order-${highlightedId}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [highlightedId, visibleOrders.length]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="page-container min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    My <span className="gradient-text">Orders</span>
                </h1>
                <p className="text-sm text-slate-400">Track your orders and see live status updates</p>
            </div>

            {visibleOrders.length === 0 ? (
                <div className="text-center py-20 glass rounded-2xl border-white/5 bg-slate-800/20">
                    <div className="text-6xl mb-6 grayscale opacity-20">📦</div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No active orders</h3>
                    <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Delivered, cancelled, and returned orders are hidden to keep this view clean.</p>
                    <Link to="/books" className="btn-primary py-3 px-8">Browse Bookstore</Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {visibleOrders.map((order) => {
                        const book = order.book_id;
                        const currentStatus = order.fulfillment_status || 'order_placed';
                        const steps = currentStatus === 'returned'
                            ? STATUS_STEPS
                            : STATUS_STEPS.filter((step) => step.key !== 'returned');
                        const rawStatusIndex = steps.findIndex((s) => s.key === currentStatus);
                        const statusIndex = rawStatusIndex < 0 ? 0 : rawStatusIndex;
                        const history = Array.isArray(order.tracking_history) && order.tracking_history.length > 0
                            ? order.tracking_history
                            : [{ status: currentStatus, label: formatStatus(currentStatus), note: 'Order created', timestamp: order.created_at }];
                        const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                        const canCancel = ['order_placed', 'processing', 'packed'].includes(currentStatus);
                        const expectedDelivery = order.expected_delivery_date ? new Date(order.expected_delivery_date) : null;
                        const deliveredOn = order.delivery_date ? new Date(order.delivery_date) : null;
                        const refundedOn = order.refunded_at ? new Date(order.refunded_at) : null;
                        const returnDeadline = deliveredOn ? new Date(deliveredOn.getTime() + 24 * 60 * 60 * 1000) : null;
                        const canReturn = currentStatus === 'delivered' && deliveredOn && !refundedOn && now <= returnDeadline;

                        return (
                            <div
                                id={`order-${order._id || order.id}`}
                                key={order._id || order.id}
                                className={`glass rounded-2xl p-6 border ${highlightedId === (order._id || order.id) ? 'border-blue-500/40' : 'border-white/5'}`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                    <div className="flex gap-4 flex-1">
                                        <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/10 bg-slate-900">
                                            {book?.cover_image_url ? (
                                                <img
                                                    src={bookService.getCoverUrl(book._id || book.id)}
                                                    alt={book.title}
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">📘</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                                                {book?.title || 'Book'}
                                            </h3>
                                            <p className="text-sm text-slate-400 mb-3">by {book?.author || 'Unknown'}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                                                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                    <HiOutlineClipboardList className="text-sm" />
                                                    {formatStatus(currentStatus)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                    <HiOutlineClock className="text-sm" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </span>
                                                {order.tracking_number ? (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                                                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                        Tracking #{order.tracking_number}
                                                    </span>
                                                ) : null}
                                                {refundedOn ? (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                                                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                        Refunded
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <div className="text-slate-500 uppercase tracking-wider text-[10px]">Amount</div>
                                                    <div className="text-slate-400 font-semibold">₹{parseFloat(order.amount || 0).toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 uppercase tracking-wider text-[10px]">Order date</div>
                                                    <div className="text-slate-400 font-semibold">{new Date(order.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 uppercase tracking-wider text-[10px]">Expected delivery</div>
                                                    <div className="text-slate-400 font-semibold">
                                                        {expectedDelivery ? expectedDelivery.toLocaleDateString() : 'TBD'}
                                                    </div>
                                                </div>
                                                {deliveredOn && (
                                                    <div>
                                                        <div className="text-slate-500 uppercase tracking-wider text-[10px]">Delivered on</div>
                                                        <div className="text-slate-400 font-semibold">{deliveredOn.toLocaleDateString()}</div>
                                                    </div>
                                                )}
                                                {refundedOn && (
                                                    <div>
                                                        <div className="text-slate-500 uppercase tracking-wider text-[10px]">Refunded on</div>
                                                        <div className="text-slate-400 font-semibold">{refundedOn.toLocaleDateString()}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:w-[360px]">
                                        {currentStatus === 'cancelled' ? (
                                            <div className="flex items-center gap-2 text-sm text-red-500 font-semibold">
                                                <HiOutlineXCircle className="text-lg" />
                                                Order cancelled
                                            </div>
                                        ) : currentStatus === 'returned' ? (
                                            <div className="flex items-center gap-2 text-sm text-amber-500 font-semibold">
                                                <HiOutlineXCircle className="text-lg" />
                                                Returned & refunded
                                            </div>
                                        ) : currentStatus === 'delivered' ? (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                                                <HiOutlineCheckCircle className="text-lg" />
                                                Delivered successfully
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                                                <HiOutlineTruck className="text-lg" />
                                                Status in progress
                                            </div>
                                        )}
                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancelOrder(order._id || order.id)}
                                                disabled={cancellingId === (order._id || order.id)}
                                                className="mt-3 btn-secondary text-xs py-2 px-3"
                                            >
                                                {cancellingId === (order._id || order.id) ? 'Cancelling...' : 'Cancel Order'}
                                            </button>
                                        )}
                                        {canReturn && (
                                            <button
                                                onClick={() => handleReturnOrder(order._id || order.id)}
                                                disabled={returningId === (order._id || order.id)}
                                                className="mt-3 btn-secondary text-xs py-2 px-3"
                                            >
                                                {returningId === (order._id || order.id) ? 'Processing...' : 'Return Order'}
                                            </button>
                                        )}
                                        {canReturn && returnDeadline && (
                                            <div className="mt-2 text-[10px] text-slate-500">
                                                Return window ends on {returnDeadline.toLocaleDateString()}
                                            </div>
                                        )}
                                        <div className="mt-4 flex flex-col gap-3">
                                            {steps.map((step, index) => (
                                                <div key={step.key} className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index <= statusIndex ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                        {index < statusIndex ? <HiOutlineCheckCircle className="text-sm" /> : index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`text-xs font-semibold ${index <= statusIndex ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {step.label}
                                                        </div>
                                                        {index < STATUS_STEPS.length - 1 && (
                                                            <div className={`h-[2px] mt-2 ${index < statusIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-white/10 pt-5">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tracking updates</h4>
                                    <div className="space-y-3">
                                        {sortedHistory.map((entry, index) => (
                                            <div key={`${entry.status}-${index}`} className="flex items-start gap-3">
                                                <div className="mt-1 w-2 h-2 rounded-full" style={{ background: 'rgba(16,185,129,0.8)' }} />
                                                <div>
                                                    <div className="text-sm font-semibold text-white">
                                                        {entry.label || formatStatus(entry.status)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {entry.note || 'Status updated'} · {formatDate(entry.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
