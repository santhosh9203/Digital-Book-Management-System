import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BookListing from './pages/BookListing';
import BookDetail from './pages/BookDetail';
import UserDashboard from './pages/UserDashboard';
import Wallet from './pages/Wallet';
import BookReader from './pages/BookReader';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/books" element={<BookListing />} />
              <Route path="/books/:id" element={<BookDetail />} />

              {/* Protected User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/read/:id"
                element={
                  <ProtectedRoute>
                    <BookReader />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />

          {/* Toast Notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'glass',
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}
