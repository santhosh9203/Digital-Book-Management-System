import { useState, useEffect } from 'react';
import { adminService } from '../services';
import toast from 'react-hot-toast';
import {
    HiOutlineUsers,
    HiOutlineBookOpen,
    HiOutlineShoppingCart,
    HiOutlineCurrencyRupee,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from 'react-icons/hi';

const orderStatusOptions = [
    { value: 'order_placed', label: 'Order placed' },
    { value: 'processing', label: 'Processing' },
    { value: 'packed', label: 'Packed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out_for_delivery', label: 'Out for delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'returned', label: 'Returned' },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [books, setBooks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderUpdates, setOrderUpdates] = useState({});
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBookId, setEditingBookId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [revenueRange, setRevenueRange] = useState('monthly');
    const [formData, setFormData] = useState({
        title: '', author: '', category: '', price: '', description: '',
    });
    const [files, setFiles] = useState({ pdf: null, cover: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, booksRes, ordersRes] = await Promise.all([
                adminService.getDashboard(),
                adminService.getBooks(),
                adminService.getOrders(),
            ]);
            setStats(statsRes.data);
            setBooks(booksRes.data.books || []);
            const ordersList = ordersRes.data.orders || [];
            setOrders(ordersList);
            const updatesMap = {};
            ordersList.forEach((order) => {
                const id = order._id || order.id;
                updatesMap[id] = {
                    status: order.fulfillment_status || 'order_placed',
                    note: '',
                    tracking_number: order.tracking_number || '',
                };
            });
            setOrderUpdates(updatesMap);
        } catch {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach((key) => data.append(key, formData[key]));
            if (files.pdf) data.append('pdf', files.pdf);
            if (files.cover) data.append('cover', files.cover);

            if (isEditMode && editingBookId) {
                await adminService.updateBook(editingBookId, data);
                toast.success('Book updated successfully');
            } else {
                await adminService.addBook(data);
                toast.success('Book added successfully');
            }

            setShowAddForm(false);
            setIsEditMode(false);
            setEditingBookId(null);
            setFormData({ title: '', author: '', category: '', price: '', description: '' });
            setFiles({ pdf: null, cover: null });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || (isEditMode ? 'Failed to update book' : 'Failed to add book'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (book) => {
        setFormData({
            title: book.title || '',
            author: book.author || '',
            category: book.category || '',
            price: book.price || '',
            description: book.description || '',
        });
        setFiles({ pdf: null, cover: null });
        setIsEditMode(true);
        setEditingBookId(book.id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditingBookId(null);
        setShowAddForm(false);
        setFormData({ title: '', author: '', category: '', price: '', description: '' });
        setFiles({ pdf: null, cover: null });
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm('Delete this book forever?')) return;
        try {
            await adminService.deleteBook(id);
            toast.success('Book deleted');
            setBooks(books.filter((b) => b.id !== id));
            fetchData();
        } catch {
            toast.error('Failed to delete book');
        }
    };

    const handleOrderFieldChange = (orderId, field, value) => {
        setOrderUpdates((prev) => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value,
            },
        }));
    };

    const handleOrderUpdate = async (orderId) => {
        const payload = orderUpdates[orderId];
        if (!payload?.status) {
            toast.error('Select a valid status');
            return;
        }
        setUpdatingOrderId(orderId);
        try {
            await adminService.updateOrderStatus(orderId, payload);
            toast.success('Order updated');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update order');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="spinner" />
            </div>
        );
    }

    const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;
    const netAmount = (order) => Number(order.amount || 0) - Number(order.refund_amount || 0);
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOfWeek = (date) => {
        const day = date.getDay();
        const diff = (day + 6) % 7;
        const d = new Date(date);
        d.setDate(d.getDate() - diff);
        return startOfDay(d);
    };
    const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

    const paidOrders = orders.filter((o) => o.status === 'paid');
    const activeOrders = paidOrders.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.fulfillment_status));
    const deliveredOrders = paidOrders.filter((o) => o.fulfillment_status === 'delivered');
    const cancelledOrders = paidOrders.filter((o) => o.fulfillment_status === 'cancelled');
    const returnedOrders = paidOrders.filter((o) => o.fulfillment_status === 'returned');
    const pendingShipment = paidOrders.filter((o) => ['order_placed', 'processing', 'packed'].includes(o.fulfillment_status));
    const inTransit = paidOrders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.fulfillment_status));
    const totalPaidAmount = paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const refundsTotal = paidOrders.reduce((sum, o) => sum + Number(o.refund_amount || 0), 0);
    const netRevenue = Math.max(totalPaidAmount - refundsTotal, 0);
    const avgOrderValue = paidOrders.length ? totalPaidAmount / paidOrders.length : 0;
    const todayString = new Date().toDateString();
    const ordersToday = paidOrders.filter((o) => new Date(o.created_at).toDateString() === todayString);
    const activeOrderManagement = orders.filter((o) => o.status === 'paid' && !['delivered', 'cancelled', 'returned'].includes(o.fulfillment_status));

    const createdOrders = orders.filter((o) => o.status === 'created');
    const totalCheckoutAttempts = paidOrders.length + createdOrders.length;
    const checkoutConversion = totalCheckoutAttempts ? (paidOrders.length / totalCheckoutAttempts) * 100 : 0;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const ordersLast7 = paidOrders.filter((o) => new Date(o.created_at) >= weekStart);
    const ordersPrev7 = paidOrders.filter((o) => new Date(o.created_at) >= prevWeekStart && new Date(o.created_at) < weekStart);
    const revenueLast7 = ordersLast7.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const revenuePrev7 = ordersPrev7.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const pctChange = (current, prev) => {
        if (!prev) return current ? 100 : 0;
        return ((current - prev) / prev) * 100;
    };

    const overdueOrders = paidOrders.filter((o) => {
        if (!o.expected_delivery_date) return false;
        if (['delivered', 'cancelled', 'returned'].includes(o.fulfillment_status)) return false;
        return new Date(o.expected_delivery_date) < now;
    });

    const deliveredWithDate = deliveredOrders.filter((o) => o.delivery_date);
    const avgDeliveryDays = deliveredWithDate.length
        ? deliveredWithDate.reduce((sum, o) => {
            const start = new Date(o.created_at);
            const end = new Date(o.delivery_date);
            return sum + Math.max((end - start) / (1000 * 60 * 60 * 24), 0);
        }, 0) / deliveredWithDate.length
        : 0;

    const paidOrdersSorted = [...paidOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentOrders = paidOrdersSorted.filter((o) => !['cancelled', 'returned'].includes(o.fulfillment_status)).slice(0, 6);

    const buildRevenueSeries = () => {
        const nowDate = new Date();
        const series = [];
        const map = new Map();
        if (revenueRange === 'daily') {
            const days = 14;
            const start = startOfDay(new Date(nowDate));
            start.setDate(start.getDate() - (days - 1));
            paidOrders.forEach((o) => {
                const keyDate = startOfDay(new Date(o.created_at));
                if (keyDate < start || keyDate > nowDate) return;
                const key = keyDate.toISOString().slice(0, 10);
                map.set(key, (map.get(key) || 0) + netAmount(o));
            });
            for (let i = 0; i < days; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const key = d.toISOString().slice(0, 10);
                series.push({
                    key,
                    label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    revenue: map.get(key) || 0,
                });
            }
        } else if (revenueRange === 'weekly') {
            const weeks = 8;
            const start = startOfWeek(nowDate);
            start.setDate(start.getDate() - 7 * (weeks - 1));
            paidOrders.forEach((o) => {
                const keyDate = startOfWeek(new Date(o.created_at));
                if (keyDate < start || keyDate > nowDate) return;
                const key = keyDate.toISOString().slice(0, 10);
                map.set(key, (map.get(key) || 0) + netAmount(o));
            });
            for (let i = 0; i < weeks; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i * 7);
                const key = d.toISOString().slice(0, 10);
                series.push({
                    key,
                    label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    revenue: map.get(key) || 0,
                });
            }
        } else if (revenueRange === 'yearly') {
            const years = 5;
            const startYear = nowDate.getFullYear() - (years - 1);
            paidOrders.forEach((o) => {
                const d = new Date(o.created_at);
                if (d.getFullYear() < startYear) return;
                const key = `${d.getFullYear()}`;
                map.set(key, (map.get(key) || 0) + netAmount(o));
            });
            for (let i = 0; i < years; i++) {
                const year = startYear + i;
                const key = `${year}`;
                series.push({
                    key,
                    label: key,
                    revenue: map.get(key) || 0,
                });
            }
        } else {
            const months = 12;
            const start = startOfMonth(nowDate);
            start.setMonth(start.getMonth() - (months - 1));
            paidOrders.forEach((o) => {
                const d = new Date(o.created_at);
                const keyDate = startOfMonth(d);
                if (keyDate < start || keyDate > nowDate) return;
                const key = `${keyDate.getFullYear()}-${String(keyDate.getMonth() + 1).padStart(2, '0')}`;
                map.set(key, (map.get(key) || 0) + netAmount(o));
            });
            for (let i = 0; i < months; i++) {
                const d = new Date(start);
                d.setMonth(start.getMonth() + i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                series.push({
                    key,
                    label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                    revenue: map.get(key) || 0,
                });
            }
        }
        return series;
    };

    const revenueSeries = buildRevenueSeries();
    const maxRevenue = Math.max(...revenueSeries.map((s) => s.revenue), 0) || 1;
    const totalRevenueRange = revenueSeries.reduce((sum, s) => sum + s.revenue, 0);
    const avgRevenueRange = revenueSeries.length ? totalRevenueRange / revenueSeries.length : 0;
    const peakRevenuePoint = revenueSeries.reduce((peak, s) => (s.revenue > peak.revenue ? s : peak), revenueSeries[0] || { revenue: 0, label: '-' });

    const customerMap = new Map();
    paidOrders.forEach((o) => {
        const key = o.user_id?._id || o.user_id?.id;
        if (!key) return;
        const entry = customerMap.get(key) || { name: o.user_id?.name || 'Customer', email: o.user_id?.email || '', orders: 0, spend: 0 };
        entry.orders += 1;
        entry.spend += Number(o.amount || 0);
        customerMap.set(key, entry);
    });
    const topCustomers = Array.from(customerMap.values()).sort((a, b) => b.spend - a.spend).slice(0, 5);

    return (
        <div className="page-container min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Admin <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-slate-400">Overview of your digital bookshop</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        <HiOutlineCurrencyRupee className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Net Revenue</h3>
                    <p className="text-2xl font-bold text-white">₹{netRevenue.toFixed(2)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Refunds: ₹{refundsTotal.toFixed(2)}</p>
                    <p className="text-[11px] text-slate-500">7d: ₹{revenueLast7.toFixed(0)} ({pctChange(revenueLast7, revenuePrev7).toFixed(1)}%)</p>
                </div>
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <HiOutlineShoppingCart className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Orders</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Today: {ordersToday.length}</p>
                    <p className="text-[11px] text-slate-500">7d: {ordersLast7.length} ({pctChange(ordersLast7.length, ordersPrev7.length).toFixed(1)}%)</p>
                </div>
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        <HiOutlineBookOpen className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Books</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalBooks}</p>
                </div>
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <HiOutlineUsers className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Users</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Checkout conv: {checkoutConversion.toFixed(1)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="stat-card">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Active Orders</h3>
                    <p className="text-2xl font-bold text-white">{activeOrders.length}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Pending shipment: {pendingShipment.length}</p>
                </div>
                <div className="stat-card">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">In Transit</h3>
                    <p className="text-2xl font-bold text-white">{inTransit.length}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Delivered: {deliveredOrders.length}</p>
                </div>
                <div className="stat-card">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Cancelled</h3>
                    <p className="text-2xl font-bold text-white">{cancelledOrders.length}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Returned: {returnedOrders.length}</p>
                </div>
                <div className="stat-card">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Avg Order Value</h3>
                    <p className="text-2xl font-bold text-white">₹{avgOrderValue.toFixed(2)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Gross: ₹{totalPaidAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="glass rounded-2xl p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Recent Orders (Paid)</h2>
                    <div className="divide-y divide-white/10">
                        {recentOrders.map((order) => (
                            <div key={order._id || order.id} className="py-4 flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm text-white font-semibold">{order.book_id?.title || 'Book'}</div>
                                    <div className="text-xs text-slate-400">{order.user_id?.name || 'Customer'} • {new Date(order.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-white">₹{parseFloat(order.amount || 0).toFixed(2)}</div>
                                    <div className={`text-[10px] uppercase ${order.fulfillment_status === 'delivered'
                                            ? 'text-emerald-400'
                                            : order.fulfillment_status === 'cancelled'
                                                ? 'text-red-400'
                                                : order.fulfillment_status === 'returned'
                                                    ? 'text-amber-400'
                                                    : 'text-slate-400'
                                        }`}>
                                        {order.fulfillment_status?.replace(/_/g, ' ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && (
                            <div className="py-6 text-sm text-slate-500">No orders yet</div>
                        )}
                    </div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Top Customers</h2>
                    <div className="space-y-4">
                        {topCustomers.map((cust, idx) => (
                            <div key={`${cust.email}-${idx}`} className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-white font-semibold">{cust.name}</div>
                                    <div className="text-[10px] text-slate-500">{cust.email}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-white">₹{cust.spend.toFixed(2)}</div>
                                    <div className="text-[10px] text-slate-500">{cust.orders} orders</div>
                                </div>
                            </div>
                        ))}
                        {topCustomers.length === 0 && (
                            <div className="text-sm text-slate-500">No customers yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Operations Alerts</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Overdue deliveries</span>
                            <span className="text-sm text-white font-semibold">{overdueOrders.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Pending shipment</span>
                            <span className="text-sm text-white font-semibold">{pendingShipment.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Unpaid checkouts</span>
                            <span className="text-sm text-white font-semibold">{createdOrders.length}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Avg delivery time: {avgDeliveryDays.toFixed(1)} days</div>
                    </div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Refunds & Returns</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Refund total</span>
                            <span className="text-sm text-white font-semibold">₹{refundsTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Return rate</span>
                            <span className="text-sm text-white font-semibold">
                                {paidOrders.length ? ((returnedOrders.length / paidOrders.length) * 100).toFixed(1) : '0.0'}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Cancel rate</span>
                            <span className="text-sm text-white font-semibold">
                                {paidOrders.length ? ((cancelledOrders.length / paidOrders.length) * 100).toFixed(1) : '0.0'}%
                            </span>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Checkout Funnel</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Created checkouts</span>
                            <span className="text-sm text-white font-semibold">{createdOrders.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Paid orders</span>
                            <span className="text-sm text-white font-semibold">{paidOrders.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Conversion</span>
                            <span className="text-sm text-white font-semibold">{checkoutConversion.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass rounded-2xl p-6 mb-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Revenue Analytics</h2>
                        <p className="text-xs text-slate-500">Net revenue by time range</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
                            <button
                                key={range}
                                type="button"
                                onClick={() => setRevenueRange(range)}
                                className={`px-3 py-1.5 rounded-full text-xs border ${revenueRange === range
                                        ? 'bg-blue-500 text-white border-blue-400'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(totalRevenueRange)}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Avg / period</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(avgRevenueRange)}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Peak</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(peakRevenuePoint.revenue)}</p>
                        <p className="text-[10px] text-slate-500">{peakRevenuePoint.label}</p>
                    </div>
                </div>

                <div className="relative bg-slate-900/40 border border-white/10 rounded-2xl p-4">
                    <svg viewBox="0 0 720 240" className="w-full h-56">
                        <defs>
                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <line
                                key={`grid-${i}`}
                                x1="24"
                                x2="696"
                                y1={40 + i * 50}
                                y2={40 + i * 50}
                                stroke="rgba(148,163,184,0.15)"
                                strokeDasharray="4 6"
                            />
                        ))}
                        {(() => {
                            const width = 720;
                            const height = 240;
                            const padding = 24;
                            const plotWidth = width - padding * 2;
                            const plotHeight = height - padding * 2;
                            const step = revenueSeries.length > 1 ? plotWidth / (revenueSeries.length - 1) : 0;
                            const points = revenueSeries.map((point, idx) => {
                                const x = revenueSeries.length > 1 ? padding + idx * step : width / 2;
                                const y = height - padding - (point.revenue / maxRevenue) * plotHeight;
                                return { x, y, ...point };
                            });
                            const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                            const areaPath = `${linePath} L ${padding + (points.length - 1) * step} ${height - padding} L ${padding} ${height - padding} Z`;
                            return (
                                <>
                                    <path d={areaPath} fill="url(#revGradient)" />
                                    <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                                    {points.map((p) => (
                                        <circle key={p.key} cx={p.x} cy={p.y} r="3" fill="#38bdf8">
                                            <title>{`${p.label}: ${formatCurrency(p.revenue)}`}</title>
                                        </circle>
                                    ))}
                                </>
                            );
                        })()}
                    </svg>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                        {revenueSeries.map((point, idx) => {
                            const showEvery = revenueRange === 'daily' ? 2 : revenueRange === 'weekly' ? 1 : revenueRange === 'monthly' ? 2 : 1;
                            if (idx % showEvery !== 0 && idx !== revenueSeries.length - 1) return <span key={point.key} className="flex-1 text-center" />;
                            return (
                                <span key={point.key} className="flex-1 text-center">
                                    {point.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="glass rounded-2xl p-6 mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Book Management</h2>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary py-2 px-4 text-sm">
                        {showAddForm ? 'Cancel' : <><HiOutlinePlus /> Add New Book</>}
                    </button>
                </div>

                {showAddForm && (
                    <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Author</label>
                            <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                            <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="input-field" required min="0" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} className="input-field h-24" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">PDF File</label>
                            <input type="file" name="pdf" onChange={handleFileChange} className="input-field text-sm" accept="application/pdf" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Cover Image</label>
                            <input type="file" name="cover" onChange={handleFileChange} className="input-field text-sm" accept="image/*" />
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-2 gap-2">
                            {isEditMode && (
                                <button type="button" onClick={handleCancelEdit} className="btn-secondary py-2 px-4">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" disabled={submitting} className="btn-primary py-2 px-6">
                                {submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Book')}
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-800/80 border-b border-slate-700">
                            <tr>
                                <th className="px-4 py-3">Book</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map((b) => (
                                <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-white">{b.title} <span className="block text-xs text-slate-500 font-normal">{b.author}</span></td>
                                    <td className="px-4 py-3">{b.category}</td>
                                    <td className="px-4 py-3">₹{parseFloat(b.price).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-2 justify-end">
                                            <button onClick={() => handleEditClick(b)} className="text-sky-400 hover:text-sky-300 p-2 text-lg">
                                                <HiOutlinePencil />
                                            </button>
                                            <button onClick={() => handleDeleteBook(b.id)} className="text-red-400 hover:text-red-300 p-2 text-lg">
                                                <HiOutlineTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {books.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-4">No books found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="glass rounded-2xl p-6 mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Order Management</h2>
                    <span className="text-xs text-slate-500">Showing active orders only</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-800/80 border-b border-slate-700">
                            <tr>
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Book</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Tracking</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeOrderManagement.map((order) => {
                                const id = order._id || order.id;
                                const updates = orderUpdates[id] || {};
                                return (
                                    <tr key={id} className="border-b border-slate-700/50 hover:bg-slate-800/30 align-top">
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-white font-semibold">{id?.slice?.(-8) || id}</div>
                                            <div className="text-[10px] text-slate-500">{new Date(order.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-white">{order.user_id?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-slate-500">{order.user_id?.email || ''}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-white">{order.book_id?.title || 'Unknown'}</div>
                                            <div className="text-[10px] text-slate-500">{order.book_id?.author || ''}</div>
                                        </td>
                                        <td className="px-4 py-3 text-white">₹{parseFloat(order.amount || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 min-w-[180px]">
                                            <input
                                                type="text"
                                                value={updates.tracking_number || ''}
                                                onChange={(e) => handleOrderFieldChange(id, 'tracking_number', e.target.value)}
                                                className="input-field text-xs"
                                                placeholder="Tracking number"
                                            />
                                            <textarea
                                                value={updates.note || ''}
                                                onChange={(e) => handleOrderFieldChange(id, 'note', e.target.value)}
                                                className="input-field text-xs mt-2 h-16"
                                                placeholder="Status note (optional)"
                                            />
                                        </td>
                                        <td className="px-4 py-3 min-w-[160px]">
                                            <select
                                                value={updates.status || 'order_placed'}
                                                onChange={(e) => handleOrderFieldChange(id, 'status', e.target.value)}
                                                className="input-field text-xs"
                                            >
                                                {orderStatusOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleOrderUpdate(id)}
                                                disabled={updatingOrderId === id || order.status !== 'paid'}
                                                className="btn-primary py-2 px-4 text-xs"
                                            >
                                                {updatingOrderId === id ? 'Updating...' : 'Update'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {activeOrderManagement.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">No active orders found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
