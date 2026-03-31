import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services';

export default function NotificationToaster() {
    const { user } = useAuth();
    const seenIds = useRef(new Set());
    const firstLoad = useRef(true);

    const checkNotifications = async () => {
        if (!user) return;
        try {
            const res = await notificationService.getNotifications();
            const notifications = res.data.notifications || [];
            
            let hasNew = false;
            
            notifications.forEach((n) => {
                const id = n._id || n.id;
                // Only show toast if it's unread AND we haven't seen it in this session
                if (!n.read && !seenIds.current.has(id)) {
                    seenIds.current.add(id);
                    
                    // Don't show toast on the very first load to avoid spamming old notifications
                    if (!firstLoad.current) {
                        toast(
                            (t) => (
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-sm text-white">{n.title}</div>
                                    <div className="text-xs text-white/90">{n.message}</div>
                                </div>
                            ),
                            {
                                duration: 5000,
                                icon: n.type === 'order' ? '📦' : '📚',
                            }
                        );
                        hasNew = true;
                    }
                }
            });

            if (firstLoad.current) {
                firstLoad.current = false;
            }

            if (hasNew) {
                // Refresh the bell count
                window.dispatchEvent(new Event('notifications:refresh'));
            }
        } catch (err) {
            console.error('Failed to poll notifications:', err);
        }
    };

    useEffect(() => {
        if (!user) {
            seenIds.current.clear();
            firstLoad.current = true;
            return;
        }

        // Initial check
        checkNotifications();

        // Poll every 10 seconds
        const interval = setInterval(checkNotifications, 10000);

        return () => clearInterval(interval);
    }, [user]);

    return null; // This component doesn't render anything itself
}
