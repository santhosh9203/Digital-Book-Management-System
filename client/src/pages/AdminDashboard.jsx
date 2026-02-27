import { useState, useEffect } from 'react';
import { adminService, bookService } from '../services';
import toast from 'react-hot-toast';
import {
    HiOutlineUsers,
    HiOutlineBookOpen,
    HiOutlineShoppingCart,
    HiOutlineCurrencyRupee,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from 'react-icons/hi';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [books, setBooks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBookId, setEditingBookId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '', author: '', category: '', price: '', description: '',
    });
    const [files, setFiles] = useState({ pdf: null, cover: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, booksRes, ordersRes, usersRes] = await Promise.all([
                adminService.getDashboard(),
                adminService.getBooks(),
                adminService.getOrders(),
                adminService.getUsers(),
            ]);
            setStats(statsRes.data);
            setBooks(booksRes.data.books || []);
            setOrders(ordersRes.data.orders || []);
            setUsers(usersRes.data.users || []);
        } catch {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach((key) => data.append(key, formData[key]));
            if (files.pdf) data.append('pdf', files.pdf);
            if (files.cover) data.append('cover', files.cover);

            if (isEditMode && editingBookId) {
                await adminService.updateBook(editingBookId, data);
                toast.success('Book updated successfully');
            } else {
                await adminService.addBook(data);
                toast.success('Book added successfully');
            }

            setShowAddForm(false);
            setIsEditMode(false);
            setEditingBookId(null);
            setFormData({ title: '', author: '', category: '', price: '', description: '' });
            setFiles({ pdf: null, cover: null });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || (isEditMode ? 'Failed to update book' : 'Failed to add book'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (book) => {
        setFormData({
            title: book.title || '',
            author: book.author || '',
            category: book.category || '',
            price: book.price || '',
            description: book.description || '',
        });
        setFiles({ pdf: null, cover: null });
        setIsEditMode(true);
        setEditingBookId(book.id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditingBookId(null);
        setShowAddForm(false);
        setFormData({ title: '', author: '', category: '', price: '', description: '' });
        setFiles({ pdf: null, cover: null });
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm('Delete this book forever?')) return;
        try {
            await adminService.deleteBook(id);
            toast.success('Book deleted');
            setBooks(books.filter((b) => b.id !== id));
            fetchData(); // refresh stats
        } catch {
            toast.error('Failed to delete book');
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="page-container min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Admin <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-slate-400">Overview of your digital bookshop</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        <HiOutlineCurrencyRupee className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Revenue</h3>
                    <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <HiOutlineShoppingCart className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Orders</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        <HiOutlineBookOpen className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Books</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalBooks}</p>
                </div>
                <div className="stat-card">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <HiOutlineUsers className="text-2xl" />
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Users</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
            </div>

            {/* Analytics (Optional UI placeholder - full recharts usually requires standard mapping) */}
            {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
                <div className="glass rounded-2xl p-6 mb-12">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Revenue History (Last 12 Months)</h2>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {stats.monthlyRevenue.slice().reverse().map((mo, i) => {
                            const maxRev = Math.max(...stats.monthlyRevenue.map((m) => m.revenue));
                            const height = (mo.revenue / maxRev) * 100 + '%';
                            return (
                                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                                    <div className="w-full bg-blue-500 rounded-t border-t border-blue-400 max-w-[40px] transition-all duration-300 group-hover:bg-purple-500" style={{ height }} />
                                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">{mo.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Book Management */}
            <div className="glass rounded-2xl p-6 mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Book Management</h2>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary py-2 px-4 text-sm">
                        {showAddForm ? 'Cancel' : <><HiOutlinePlus /> Add New Book</>}
                    </button>
                </div>

                {showAddForm && (
                    <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Author</label>
                            <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                            <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="input-field" required min="0" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} className="input-field h-24" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">PDF File</label>
                            <input type="file" name="pdf" onChange={handleFileChange} className="input-field text-sm" accept="application/pdf" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">Cover Image</label>
                            <input type="file" name="cover" onChange={handleFileChange} className="input-field text-sm" accept="image/*" />
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-2 gap-2">
                            {isEditMode && (
                                <button type="button" onClick={handleCancelEdit} className="btn-secondary py-2 px-4">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" disabled={submitting} className="btn-primary py-2 px-6">
                                {submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Book')}
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-800/80 border-b border-slate-700">
                            <tr>
                                <th className="px-4 py-3">Book</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map((b) => (
                                <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-white">{b.title} <span className="block text-xs text-slate-500 font-normal">{b.author}</span></td>
                                    <td className="px-4 py-3">{b.category}</td>
                                    <td className="px-4 py-3">₹{parseFloat(b.price).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-2 justify-end">
                                            <button onClick={() => handleEditClick(b)} className="text-sky-400 hover:text-sky-300 p-2 text-lg">
                                                <HiOutlinePencil />
                                            </button>
                                            <button onClick={() => handleDeleteBook(b.id)} className="text-red-400 hover:text-red-300 p-2 text-lg">
                                                <HiOutlineTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {books.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-4">No books found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
