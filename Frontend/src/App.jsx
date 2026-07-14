import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import ReviewAdjustPage from './pages/ReviewAdjustPage';
import LoadingPage from './pages/LoadingPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import GalleryPage from './pages/GalleryPage';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/review/:documentId" element={<ProtectedRoute><ReviewAdjustPage /></ProtectedRoute>} />
      <Route path="/loading/:documentId" element={<ProtectedRoute><LoadingPage /></ProtectedRoute>} />
      <Route path="/result/:documentId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Fallbacks */}
      <Route path="/settings" element={<Navigate to="/profile" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
