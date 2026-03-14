import Logo from '../assets/logo/Logo.png';

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-slate-800/50 py-8 px-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <img src={Logo} alt="BOoCArT" className="h-6 w-auto" />
                    <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                        <span style={{ color: '#0f172a' }}>BOoC</span>
                        <span style={{ color: '#22c55e' }}>ArT</span>
                    </span>
                </div>
                <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} BOoCArT. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
