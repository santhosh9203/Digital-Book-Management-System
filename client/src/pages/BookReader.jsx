import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    HiOutlineArrowLeft,
    HiOutlineDownload,
    HiOutlineMenuAlt2,
    HiOutlineArrowsExpand,
    HiOutlineZoomIn,
    HiOutlineZoomOut,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineBookOpen
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookTitle, setBookTitle] = useState('Reading Book');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Interactive states
    const [zoom, setZoom] = useState(100);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const readerRef = useRef(null);

    useEffect(() => {
        fetchBook();
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [id]);

    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            readerRef.current.requestFullscreen().catch(err => {
                toast.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const fetchBook = async () => {
        try {
            const bookRes = await bookService.getById(id);
            setBookTitle(bookRes.data.book.title);
            setTotalPages(bookRes.data.book.total_pages || 0);

            const pdfRes = await bookService.download(id);
            const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (err) {
            toast.error('Failed to load the book reader');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.setAttribute('download', `${bookTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // Functional Helpers
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 40));

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const jumpToPage = (pageNum) => {
        setCurrentPage(pageNum);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a]">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
                <p className="text-slate-400 font-medium tracking-wide">Preparing your premium workspace...</p>
            </div>
        );
    }

    return (
        <div ref={readerRef} className="flex flex-col h-screen bg-[#0f172a] text-slate-200 overflow-hidden select-none">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] border-b border-white/5 z-50 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90"
                            title="Exit Reader"
                        >
                            <HiOutlineArrowLeft className="text-xl" />
                        </button>
                        <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-2 rounded-lg transition-all active:scale-90 ${sidebarOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            title="Toggle Sidebar"
                        >
                            <HiOutlineMenuAlt2 className="text-xl" />
                        </button>
                    </div>

                    <div className="hidden sm:block">
                        <h1 className="text-sm font-bold truncate max-w-[200px] lg:max-w-[400px]" style={{ color: '#ffffff' }}>
                            {bookTitle}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Digital Edition</span>
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Page {currentPage} of {totalPages}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-4">
                    <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 hover:bg-white/5 rounded text-slate-400 active:scale-90 transition-all"
                        >
                            <HiOutlineZoomOut className="text-lg" />
                        </button>
                        <span className="text-[10px] font-bold px-3 border-x border-white/5 text-slate-100 min-w-[55px] text-center">{zoom}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 hover:bg-white/5 rounded text-slate-400 active:scale-90 transition-all"
                        >
                            <HiOutlineZoomIn className="text-lg" />
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-white/10" />

                    <button
                        onClick={toggleFullscreen}
                        className={`p-2 rounded-lg transition-all active:scale-90 ${isFullscreen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                        title="Fullscreen Mode"
                    >
                        <HiOutlineArrowsExpand className="text-xl" />
                    </button>

                    <button
                        onClick={handleDownload}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                    >
                        <HiOutlineDownload className="text-base" /> Download
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar - Modern Page Thumbnails Navigation */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ x: -288, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -288, opacity: 0 }}
                            transition={{ type: 'tween', duration: 0.2 }}
                            className="w-72 bg-[#1e293b] border-r border-white/5 flex flex-col z-40 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/60">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page Navigator</p>
                                <HiOutlineBookOpen className="text-blue-500 text-sm" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <div
                                        key={page}
                                        onClick={() => jumpToPage(page)}
                                        className={`group relative p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${currentPage === page ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20' : 'bg-slate-800/40 border-transparent hover:border-white/10'}`}
                                    >
                                        <div className="flex gap-3">
                                            {/* Page Thumbnail Simulation */}
                                            <div className="w-14 h-20 rounded-md bg-white overflow-hidden border border-white/5 flex-shrink-0 shadow-lg group-hover:shadow-blue-500/5 transition-shadow relative">
                                                {pdfUrl ? (
                                                    <iframe
                                                        src={`${pdfUrl}#page=${page}&toolbar=0&view=Fit&navpanes=0`}
                                                        className="w-[400%] h-[400%] absolute top-0 left-0 origin-top-left border-none pointer-events-none opacity-80"
                                                        style={{ transform: 'scale(0.25)' }}
                                                        title={`page-${page}`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-slate-700">DOC</div>
                                                )}
                                                <div className="absolute inset-0 bg-transparent" /> {/* Protection overlay */}
                                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1 rounded text-[8px] font-mono text-white/80">
                                                    {page}
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center">
                                                <p className={`text-[11px] font-bold ${currentPage === page ? 'text-blue-400' : 'text-slate-300 transition-colors'}`}>
                                                    {page === 1 ? 'Cover Page' : `Page ${page}`}
                                                </p>
                                                <p className="text-[9px] text-slate-500 mt-0.5">Reference: PK-{2000 + page}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PDF Reader Canvas */}
                <div className="flex-1 bg-[#0f172a] flex flex-col items-center justify-start overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
                    {/* Simulated Page Container */}
                    <div
                        className="w-full max-w-4xl transition-all duration-300 ease-out"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 aspect-[1/1.414] rounded-lg shadow-2xl relative overflow-hidden border border-white/5"
                        >
                            {pdfUrl ? (
                                <iframe
                                    src={`${pdfUrl}#page=${currentPage}&toolbar=0&view=FitH`}
                                    className="w-full h-full border-none pointer-events-auto"
                                    title={bookTitle}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-20 text-center text-xs">
                                    Establishing secure document stream...
                                </div>
                            )}

                            {/* Secure Watermark */}
                            <div className="absolute bottom-6 right-6 pointer-events-none opacity-[0.03] select-none text-[80px] font-black rotate-[-30deg] text-white whitespace-nowrap overflow-hidden leading-none uppercase">
                                {user?.name || 'Verified Access'}
                            </div>
                        </motion.div>
                    </div>

                    {/* Page Navigation Floating Tool */}
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1e293b]/90 backdrop-blur-2xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl z-50">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
                        >
                            <HiOutlineChevronLeft className="text-xl" />
                        </button>
                        <div className="px-4 flex items-center gap-3">
                            <input
                                type="text"
                                value={currentPage}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val >= 1 && val <= totalPages) setCurrentPage(val);
                                }}
                                className="w-10 bg-slate-900 border border-white/10 text-center text-xs font-bold rounded py-1 focus:outline-none focus:border-blue-500 text-white"
                            />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">/ {totalPages}</span>
                        </div>
                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
                        >
                            <HiOutlineChevronRight className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                iframe::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div>
    );
}
