import { Link } from 'react-router-dom';
import { bookService } from '../services';

export default function BookCard({ book }) {
    const coverUrl = book.cover_image_url
        ? bookService.getCoverUrl(book.id)
        : null;

    return (
        <Link to={`/books/${book.id}`} className="card block group" style={{ textDecoration: 'none' }}>
            {/* Cover image */}
            <div className="relative h-56 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}>
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📚</div>
                            <p className="text-xs text-slate-500">No Cover</p>
                        </div>
                    </div>
                )}
                {/* Price badge */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #70d540, #42d4a6)' }}>
                    ₹{parseFloat(book.price).toFixed(0)}
                </div>
                {/* Category badge */}
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-xs glass"
                    style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                    {book.category}
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {book.title}
                </h3>
                <p className="text-xs text-slate-400">{book.author}</p>
            </div>
        </Link>
    );
}
