import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineBookOpen } from 'react-icons/hi';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(email, password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full opacity-8"
                    style={{ background: 'radial-gradient(circle, #70d540, transparent)' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, #70d540, #42d4a6)' }}>
                        <HiOutlineBookOpen className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                        Welcome Back
                    </h1>
                    <p className="text-sm text-slate-400">Sign in to access your library</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} autoComplete="off" className="glass rounded-2xl p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            autoComplete="off"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pr-10"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            'Signin'
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300">Signup</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
