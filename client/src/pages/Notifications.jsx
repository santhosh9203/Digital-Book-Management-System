import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services';
import toast from 'react-hot-toast';
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi';

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString();
};

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationService.getNotifications();
            setNotifications(res.data.notifications || []);
        } catch {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (id) => {
        try {
            await notificationService.markRead(id);
            setNotifications((prev) => prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch {
            toast.error('Failed to update notification');
        }
    };

    const markAllRead = async () => {
        try {
            await notificationService.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch {
            toast.error('Failed to update notifications');
        }
    };

    const resolveLink = (link) => {
        if (!link) return '';
        if (link.startsWith('/orders/')) {
            const id = link.replace('/orders/', '');
            return `/orders?highlight=${id}`;
        }
        return link;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="page-container min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Notifications
                    </h1>
                    <p className="text-sm text-slate-400">Order updates and new arrivals</p>
                </div>
                {notifications.length > 0 && (
                    <button onClick={markAllRead} className="btn-secondary text-xs py-2 px-4">
                        Mark all read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-20 glass rounded-2xl border-white/5 bg-slate-800/20">
                    <div className="text-6xl mb-6 grayscale opacity-20">🔔</div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No notifications</h3>
                    <p className="text-sm text-slate-500">You are all caught up.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((n) => {
                        const id = n._id || n.id;
                        const content = (
                            <div className={`glass rounded-2xl p-5 border transition-all ${n.read ? 'border-white/5 opacity-80' : 'border-emerald-500/30'}`}>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                        <HiOutlineBell className="text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                                            <span className="text-[10px] text-slate-400">{formatDate(n.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                                        <div className="mt-3 flex items-center gap-3">
                                            {!n.read && (
                                                <button onClick={() => markRead(id)} className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                                                    <HiOutlineCheck className="text-sm" />
                                                    Mark read
                                                </button>
                                            )}
                                            {n.type && (
                                                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">{n.type}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );

                        const targetLink = resolveLink(n.link);
                        if (targetLink) {
                            return (
                                <Link key={id} to={targetLink} onClick={() => !n.read && markRead(id)} style={{ textDecoration: 'none' }}>
                                    {content}
                                </Link>
                            );
                        }

                        return (
                            <div key={id}>
                                {content}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
