import { HiOutlineBookOpen } from 'react-icons/hi';

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-slate-800/50 py-8 px-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center">
                        <HiOutlineBookOpen className="text-xl" style={{ color: '#0f172a' }} />
                    </div>
                    <span className="text-sm font-semibold gradient-text">Digital BookShop</span>
                </div>
                <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} Digital BookShop. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
