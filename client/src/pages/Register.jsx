import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineBookOpen } from 'react-icons/hi';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full opacity-8"
                    style={{ background: 'radial-gradient(circle, #42d4a6, transparent)' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, #42d4a6, #70d540)' }}>
                        <HiOutlineBookOpen className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                        Signup
                    </h1>
                    <p className="text-sm text-slate-400">Start your reading journey today</p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off" className="glass rounded-2xl p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            autoComplete="off"
                            required
                        />
                    </div>

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
                                Creating account...
                            </span>
                        ) : (
                            'Signup'
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300">Signin</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
