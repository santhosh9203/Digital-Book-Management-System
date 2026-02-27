import { useState, useEffect } from 'react';
import { walletService } from '../services';
import { HiOutlineCreditCard } from 'react-icons/hi';

export default function WalletBalance() {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalance();

        // Refresh balance every 30 seconds or on custom event
        const interval = setInterval(fetchBalance, 30000);
        window.addEventListener('walletUpdate', fetchBalance);

        return () => {
            clearInterval(interval);
            window.removeEventListener('walletUpdate', fetchBalance);
        };
    }, []);

    const fetchBalance = async () => {
        try {
            const res = await walletService.getBalance();
            setBalance(res.data.balance);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <HiOutlineCreditCard className="text-blue-400" />
            <span className="text-sm font-bold text-white">
                ₹{parseFloat(balance).toFixed(2)}
            </span>
        </div>
    );
}
