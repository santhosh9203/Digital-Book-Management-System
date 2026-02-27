import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBookOpen, HiOutlineLogout, HiOutlineUser, HiOutlineShieldCheck } from 'react-icons/hi';
import { HiBars3, HiXMark } from 'react-icons/hi2';
import { useState } from 'react';
import WalletBalance from './WalletBalance';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center">
                            <HiOutlineBookOpen className="text-2xl" style={{ color: '#0f172a' }} />
                        </div>
                        <span className="text-lg font-bold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
                            BookShop
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {user ? (
                            <>
                                <Link to="/books" className="text-sm text-slate-300 hover:text-white transition-colors">
                                    Browse Books
                                </Link>
                                <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                                    <HiOutlineUser className="text-base" />
                                    Dashboard
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                                        <HiOutlineShieldCheck className="text-base" />
                                        Admin
                                    </Link>
                                )}
                                <WalletBalance />
                                <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid rgba(148,163,184,0.15)' }}>
                                    <span className="text-xs px-2 py-1 rounded-full"
                                        style={{
                                            background: isAdmin
                                                ? 'linear-gradient(135deg, rgba(66,212,166,0.2), rgba(112,213,64,0.2))'
                                                : 'rgba(112,213,64,0.15)',
                                            color: isAdmin ? '#2bba8e' : '#42a12a',
                                            border: '1px solid',
                                            borderColor: isAdmin ? 'rgba(66,212,166,0.3)' : 'rgba(112,213,64,0.3)',
                                        }}>
                                        {user.name}
                                    </span>
                                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                                        <HiOutlineLogout className="text-lg" />
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>

                    {/* Mobile toggle */}
                    <button className="md:hidden text-slate-300" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <HiXMark className="text-2xl" /> : <HiBars3 className="text-2xl" />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 border-t border-slate-800 pt-4 flex flex-col gap-3">
                        {user ? (
                            <>
                                <Link to="/books" className="text-sm text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                                    Browse Books
                                </Link>
                                <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                                    Dashboard
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="text-sm text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>Admin</Link>
                                )}
                                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm text-red-400 text-left">
                                    Logout
                                </button>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </nav>
    );
}
