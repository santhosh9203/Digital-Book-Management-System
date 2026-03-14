import { useState, useEffect } from 'react';
import { walletService, userService } from '../services';
import toast from 'react-hot-toast';
import {
    HiOutlinePlus,
    HiOutlineLibrary,
    HiOutlineTrendingUp,
    HiOutlineTrendingDown,
    HiOutlineClock,
    HiOutlineLockClosed,
} from 'react-icons/hi';

export default function Wallet() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [transactionPassword, setTransactionPassword] = useState('');

    const [passwordStatus, setPasswordStatus] = useState({ loading: true, isSet: false });
    const [showManagePasswordModal, setShowManagePasswordModal] = useState(false);
    const [manageMode, setManageMode] = useState('change');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    useEffect(() => {
        fetchData();
        fetchPasswordStatus();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                walletService.getBalance(),
                walletService.getTransactions(),
            ]);
            setBalance(balanceRes.data.balance);
            setTransactions(transactionsRes.data.transactions || []);
        } catch {
            toast.error('Failed to fetch wallet info');
        } finally {
            setLoading(false);
        }
    };

    const fetchPasswordStatus = async () => {
        try {
            const res = await userService.getTransactionPasswordStatus();
            setPasswordStatus({ loading: false, isSet: res.data.isSet });
        } catch {
            setPasswordStatus({ loading: false, isSet: false });
        }
    };

    const openManagePassword = (mode) => {
        setManageMode(mode);
        setShowManagePasswordModal(true);
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        if (!passwordStatus.isSet) {
            toast.error('Set a transaction password first.');
            openManagePassword('change');
            return;
        }
        setShowPasswordPrompt(true);
    };

    const confirmAddMoney = async () => {
        if (!transactionPassword) {
            toast.error('Enter transaction password');
            return;
        }
        setIsAdding(true);
        try {
            await walletService.credit(amount, 'Manual Top-up (Simulation)', transactionPassword);
            toast.success('Funds added successfully!');
            setAmount('');
            setTransactionPassword('');
            setShowPasswordPrompt(false);
            fetchData();
            window.dispatchEvent(new Event('walletUpdate'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add funds');
        } finally {
            setIsAdding(false);
        }
    };

    const handleSavePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            toast.error('Password must be at least 4 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordStatus.isSet && !oldPassword) {
            toast.error('Enter your old transaction password');
            return;
        }
        setIsSavingPassword(true);
        try {
            await userService.setTransactionPassword({
                old_password: oldPassword || undefined,
                new_password: newPassword,
            });
            toast.success('Transaction password saved');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            fetchPasswordStatus();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            await userService.requestTransactionPasswordReset();
            toast.success('OTP sent to notifications');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !resetPassword || resetPassword.length < 4) {
            toast.error('Enter OTP and new password (min 4 characters)');
            return;
        }
        if (resetPassword !== resetConfirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsResettingPassword(true);
        try {
            await userService.resetTransactionPassword({
                otp,
                new_password: resetPassword,
            });
            toast.success('Password reset successfully');
            setOtp('');
            setResetPassword('');
            setResetConfirmPassword('');
            fetchPasswordStatus();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsResettingPassword(false);
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
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

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
                    <button
                        type="button"
                        onClick={() => openManagePassword('change')}
                        className="mt-4 text-xs text-blue-400 hover:text-blue-300"
                    >
                        Manage transaction password
                    </button>
                </div>
            </div>

            <div className="bg-amber-100 border border-amber-200 rounded-2xl p-6 text-sm text-amber-900 leading-relaxed mb-10">
                <p className="font-bold text-amber-800 mb-1 flex items-center gap-2">
                    <HiOutlineLibrary /> Simulation Mode Active
                </p>
                This wallet and its balance are part of a simulated fintech environment. All transactions occur within this simulated ledger for demonstration and development purposes.
            </div>

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

            {showPasswordPrompt && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Confirm Transaction</h3>
                        <p className="text-xs text-slate-400 mb-4">Enter your transaction password to add money.</p>
                        <input
                            type="password"
                            value={transactionPassword}
                            onChange={(e) => setTransactionPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 mb-4"
                            placeholder="Transaction password"
                        />
                        <button
                            type="button"
                            onClick={() => { setShowPasswordPrompt(false); openManagePassword('forgot'); }}
                            className="text-xs text-blue-400 hover:text-blue-300 mb-4"
                        >
                            Forgot password?
                        </button>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowPasswordPrompt(false); setTransactionPassword(''); }}
                                className="btn-secondary py-2 px-4 text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmAddMoney}
                                disabled={isAdding}
                                className="btn-primary py-2 px-4 text-xs"
                            >
                                {isAdding ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showManagePasswordModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <HiOutlineLockClosed className="text-blue-500" />
                                Transaction Password
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowManagePasswordModal(false)}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setManageMode('change')}
                                className={`px-3 py-1.5 rounded-full text-xs ${manageMode === 'change'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-slate-400'
                                    }`}
                            >
                                {passwordStatus.isSet ? 'Change Password' : 'Set Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setManageMode('forgot')}
                                className={`px-3 py-1.5 rounded-full text-xs ${manageMode === 'forgot'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-slate-400'
                                    }`}
                                disabled={!passwordStatus.isSet}
                            >
                                Forgot Password
                            </button>
                        </div>

                        {manageMode === 'change' && (
                            <div className="space-y-4">
                                {passwordStatus.isSet && (
                                    <div>
                                        <label className="block text-[10px] text-slate-500 uppercase mb-2">Old password</label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600"
                                            placeholder="Enter old password"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase mb-2">New password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600"
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase mb-2">Confirm password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSavePassword}
                                    disabled={isSavingPassword}
                                    className="btn-primary py-2 px-4 text-xs"
                                >
                                    {isSavingPassword ? 'Saving...' : 'Save Password'}
                                </button>
                            </div>
                        )}

                        {manageMode === 'forgot' && (
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={!passwordStatus.isSet || isSendingOtp}
                                    className="btn-secondary py-2 px-4 text-xs"
                                >
                                    {isSendingOtp ? 'Sending...' : 'Send OTP'}
                                </button>
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase mb-2">OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600"
                                        placeholder="Enter OTP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase mb-2">New password</label>
                                    <input
                                        type="password"
                                        value={resetPassword}
                                        onChange={(e) => setResetPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600"
                                        placeholder="New password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase mb-2">Confirm password</label>
                                    <input
                                        type="password"
                                        value={resetConfirmPassword}
                                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    disabled={isResettingPassword}
                                    className="btn-primary py-2 px-4 text-xs"
                                >
                                    {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
