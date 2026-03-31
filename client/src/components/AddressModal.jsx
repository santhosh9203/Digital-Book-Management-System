import { useState } from 'react';
import { HiXMark, HiOutlineTruck, HiMapPin, HiUser, HiPhone } from 'react-icons/hi2';

export default function AddressModal({ isOpen, onClose, onSubmit, bookTitle }) {
    const [address, setAddress] = useState({
        full_name: '',
        phone: '',
        address_line: '',
        city: '',
        state: '',
        pincode: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simple validation
        if (!address.full_name || !address.phone || !address.address_line || !address.city || !address.pincode) {
            alert('Please fill in all required fields');
            return;
        }
        onSubmit(address);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl border-white/10 flex flex-col md:flex-row">
                {/* Left side info */}
                <div className="hidden md:flex w-1/3 bg-blue-600/10 p-8 flex-col items-center justify-center text-center border-r border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                        <HiOutlineTruck className="text-3xl text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Shipping</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
                        We deliver your physical books anywhere in India within 5-7 days.
                    </p>
                </div>

                {/* Form side */}
                <div className="flex-1 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Delivery Address</h2>
                            <p className="text-xs text-slate-500">Ordering: {bookTitle}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <HiXMark className="text-xl" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input
                                    type="text"
                                    name="full_name"
                                    placeholder="Full Name"
                                    required
                                    className="input-field pl-10 h-10 text-sm"
                                    value={address.full_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="relative">
                                <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number"
                                    required
                                    className="input-field pl-10 h-10 text-sm"
                                    value={address.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <HiMapPin className="absolute left-3 top-3 text-slate-500 text-sm" />
                            <textarea
                                name="address_line"
                                placeholder="Full Address (House No, Street, Landmark)"
                                required
                                rows="2"
                                className="input-field pl-10 py-3 text-sm resize-none"
                                value={address.address_line}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="city"
                                placeholder="City"
                                required
                                className="input-field h-10 text-sm"
                                value={address.city}
                                onChange={handleChange}
                            />
                            <input
                                type="text"
                                name="state"
                                placeholder="State"
                                required
                                className="input-field h-10 text-sm"
                                value={address.state}
                                onChange={handleChange}
                            />
                        </div>

                        <input
                            type="text"
                            name="pincode"
                            placeholder="Pincode"
                            required
                            className="input-field h-10 text-sm"
                            value={address.pincode}
                            onChange={handleChange}
                        />

                        <div className="pt-4 flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 btn-primary py-3 text-sm font-bold shadow-lg shadow-blue-500/20"
                            >
                                Deliver to this Address
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
