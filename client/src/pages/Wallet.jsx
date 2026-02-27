import { useState, useEffect } from 'react';
import { walletService } from '../services';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineLibrary, HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineClock } from 'react-icons/hi';

export default function Wallet() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                walletService.getBalance(),
                walletService.getTransactions()
            ]);
            setBalance(balanceRes.data.balance);
            setTransactions(transactionsRes.data.transactions || []);
        } catch {
            toast.error('Failed to fetch wallet info');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;

        setIsAdding(true);
        try {
            await walletService.credit(amount, 'Manual Top-up (Simulation)');
            toast.success('Funds added successfully!');
            setAmount('');
            fetchData();
            // Trigger navbar update
            window.dispatchEvent(new Event('walletUpdate'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add funds');
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="spinner" />
        </div>
    );

    return (
        <div className="page-container max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 gradient-text">My Wallet</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Balance Card */}
                <div className="md:col-span-2 glass p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-white/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm font-medium mb-1">CURRENT BALANCE</p>
                        <h2 className="text-5xl font-black text-white mb-6">₹{parseFloat(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>

                        <div className="flex gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                                <p className="text-sm font-bold text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Active
                                </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Currency</p>
                                <p className="text-sm font-bold text-white">INR</p>
                            </div>
                        </div>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                {/* Quick Add */}
                <div className="glass p-8 rounded-3xl border-white/10 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <HiOutlinePlus className="text-blue-500" />
                        Add Money
                    </h3>
                    <form onSubmit={handleAddMoney}>
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isAdding}
                            className="w-full btn-primary py-4 rounded-xl shadow-lg shadow-blue-600/20"
                        >
                            {isAdding ? 'Processing...' : 'Top Up Wallet'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Simulation Info */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-sm text-yellow-200/80 leading-relaxed mb-10">
                <p className="font-bold text-yellow-400 mb-1 flex items-center gap-2">
                    <HiOutlineLibrary /> Simulation Mode Active
                </p>
                This wallet and its balance are part of a simulated fintech environment. All transactions occur within this simulated ledger for demonstration and development purposes.
            </div>

            {/* Ledger Section */}
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <HiOutlineClock className="text-blue-400" />
                Recent Activity
            </h3>
            <div className="glass rounded-3xl overflow-hidden border-white/10 mb-20">
                {transactions.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                            <HiOutlineTrendingUp className="text-2xl text-slate-500" />
                        </div>
                        <h4 className="text-white font-bold mb-1">No transactions yet</h4>
                        <p className="text-slate-500 text-sm">Your recent wallet activity will show up here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.map((tx) => (
                            <div key={tx._id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${tx.transaction_type === 'credit'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {tx.transaction_type === 'credit' ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{tx.description}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${tx.transaction_type === 'credit' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {tx.transaction_type === 'credit' ? '+' : '-'} ₹{parseFloat(tx.amount).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-slate-500">Balance: ₹{parseFloat(tx.balance_after).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
