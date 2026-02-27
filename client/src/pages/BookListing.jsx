import { useState, useEffect } from 'react';
import { bookService } from '../services';
import BookCard from '../components/BookCard';
import { HiOutlineSearch } from 'react-icons/hi';

export default function BookListing() {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchBooks();
    }, [page, category]);

    useEffect(() => {
        bookService.getCategories()
            .then((res) => setCategories(res.data.categories || []))
            .catch(() => { });
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await bookService.getAll({ search, category, page, limit: 12 });
            setBooks(res.data.books || []);
            setTotalPages(res.data.totalPages || 1);
        } catch {
            setBooks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchBooks();
    };

    return (
        <div className="page-container min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Browse <span className="gradient-text">Books</span>
                </h1>
                <p className="text-sm text-slate-400">Discover your next great read</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search books by title or author..."
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary px-5">
                        Search
                    </button>
                </form>
            </div>

            {/* Category Filter Buttons */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex gap-3 min-w-min pb-2">
                    <button
                        onClick={() => { setCategory(''); setPage(1); }}
                        className={`px-6 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                            category === ''
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategory(cat); setPage(1); }}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                                category === cat
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                            }`}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Books Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="spinner" />
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">📖</div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No books found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {books.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-10">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-secondary text-xs py-2 px-4"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn-secondary text-xs py-2 px-4"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
