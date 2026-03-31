import { useState, useEffect } from 'react';
import { HiOutlineBookmark, HiOutlineCreditCard, HiOutlineTruck, HiOutlineSparkles, HiXMark, HiChevronRight, HiChevronLeft } from 'react-icons/hi2';
import { userService } from '../services';
import { useAuth } from '../context/AuthContext';

export default function WelcomeTour() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const steps = [
        {
            title: "Welcome to BOoCArT!",
            description: "Your premium digital bookstore is ready. Let's show you around in 30 seconds.",
            icon: <HiOutlineSparkles className="text-4xl text-yellow-400" />,
            color: "from-yellow-400/20 to-orange-500/20"
        },
        {
            title: "Browse & Discover",
            description: "Use the 'Browse Books' section to find your next read. Filter by category or search by title and author.",
            icon: <HiOutlineBookmark className="text-4xl text-blue-400" />,
            color: "from-blue-400/20 to-indigo-500/20"
        },
        {
            title: "Virtual Wallet",
            description: "Add money to your simulation wallet first. You'll need to set a transaction password for extra security.",
            icon: <HiOutlineCreditCard className="text-4xl text-emerald-400" />,
            color: "from-emerald-400/20 to-teal-500/20"
        },
        {
            title: "Live Order Tracking",
            description: "Once ordered, head to 'My Orders' to see the live status of your book as it gets processed and delivered.",
            icon: <HiOutlineTruck className="text-4xl text-purple-400" />,
            color: "from-purple-400/20 to-pink-500/20"
        }
    ];

    useEffect(() => {
        if (user && user.role !== 'admin' && user.has_watched_tutorial === false) {
            // Slight delay for smooth entry
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const closeTour = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await userService.completeTutorial();
            updateUser({ has_watched_tutorial: true });
            setIsOpen(false);
        } catch (err) {
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            closeTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isOpen) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-md glass rounded-3xl overflow-hidden shadow-2xl border-white/10 transition-all duration-500`}>
                {/* Header Background Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${step.color} -z-10`} />
                
                <button 
                    onClick={closeTour}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <HiXMark className="text-xl" />
                </button>

                <div className="p-8 pt-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-6 shadow-inner border border-white/5 animate-float">
                        {step.icon}
                    </div>

                    <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        {step.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[60px]">
                        {step.description}
                    </p>

                    {/* Progress dots */}
                    <div className="flex gap-2 mb-8">
                        {steps.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between w-full">
                        <button 
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-1 text-sm font-semibold transition-colors ${currentStep === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                        >
                            <HiChevronLeft /> Back
                        </button>

                        <button 
                            onClick={nextStep}
                            className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 group"
                        >
                            {currentStep === steps.length - 1 ? 'Start Shopping' : 'Next Step'}
                            {currentStep < steps.length - 1 && <HiChevronRight className="transition-transform group-hover:translate-x-1" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
