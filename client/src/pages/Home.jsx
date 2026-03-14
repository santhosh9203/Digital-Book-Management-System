import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBookOpen, HiOutlineCreditCard, HiOutlineTruck, HiOutlineBell } from 'react-icons/hi';

export default function Home() {
    const { user } = useAuth();

    const features = [
        {
            icon: <HiOutlineBookOpen className="text-2xl" />,
            title: 'Vast Collection',
            desc: 'Explore thousands of digital books across every genre and category.',
            color: '#70d540',
        },
        {
            icon: <HiOutlineCreditCard className="text-2xl" />,
            title: 'Secure Payments',
            desc: "Pay confidently with Razorpay's encrypted payment gateway.",
            color: '#42d4a6',
        },
        {
            icon: <HiOutlineTruck className="text-2xl" />,
            title: 'Order Tracking',
            desc: 'Track your orders with live status updates from processing to delivery.',
            color: '#10b981',
        },
        {
            icon: <HiOutlineBell className="text-2xl" />,
            title: 'New Arrival Alerts',
            desc: 'Get notified when new books are added to the store.',
            color: '#f59e0b',
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 px-4">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #70d540, transparent)' }} />
                    <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #42d4a6, transparent)' }} />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="animate-fade-in-up">
                        {/* Logo */}
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'linear-gradient(135deg, #70d540, #42d4a6)' }}>
                            <HiOutlineBookOpen className="text-white text-3xl" />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                            style={{ fontFamily: 'var(--font-display)' }}>
                            Discover, Order &{' '}
                            <span className="gradient-text">Track</span>
                            <br />
                            Books
                        </h1>

                        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Shop a premium collection of books. Place secure orders and track every step,
                            from confirmation to delivery.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {user ? (
                                <Link to="/books" className="btn-primary text-base py-3 px-8" style={{ textDecoration: 'none' }}>
                                    Browse Collection
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-primary text-base py-3 px-8" style={{ textDecoration: 'none' }}>
                                        Signin
                                    </Link>
                                    <Link to="/register" className="btn-primary text-base py-3 px-8" style={{ textDecoration: 'none' }}>
                                        Signup
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                            Why Choose <span className="gradient-text">BookShop?</span>
                        </h2>
                        <p className="text-slate-400 text-sm">Everything you need for a seamless reading experience.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="card p-6 text-center animate-fade-in-up"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: `${f.color}15`,
                                        color: f.color,
                                        border: `1px solid ${f.color}30`,
                                    }}
                                >
                                    {f.icon}
                                </div>
                                <h3 className="font-semibold text-white mb-2 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                                    {f.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto text-center glass rounded-2xl p-10">
                        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                        Ready to start shopping?
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Join thousands of readers who have already discovered their next favorite book.
                    </p>
                    <Link to={user ? '/books' : '/register'} className="btn-primary py-3 px-8" style={{ textDecoration: 'none' }}>
                        {user ? 'Browse Books' : 'Signup'}
                    </Link>
                </div>
            </section>
        </div>
    );
}
