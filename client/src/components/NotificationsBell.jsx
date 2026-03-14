import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineBell } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services';

export default function NotificationsBell() {
    const { user } = useAuth();
    const [unread, setUnread] = useState(0);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const res = await notificationService.getNotifications();
            const notifications = res.data.notifications || [];
            const unreadCount = notifications.filter((n) => !n.read).length;
            setUnread(unreadCount);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!user) {
            setUnread(0);
            return;
        }
        loadNotifications();
        const handler = () => loadNotifications();
        window.addEventListener('notifications:refresh', handler);
        return () => window.removeEventListener('notifications:refresh', handler);
    }, [user]);

    if (!user) return null;

    return (
        <Link to="/notifications" className="relative text-slate-300 hover:text-white transition-colors">
            <HiOutlineBell className="text-lg" />
            {unread > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </Link>
    );
}
