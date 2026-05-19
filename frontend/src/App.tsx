import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, type Role } from './lib/auth';
import LoginPage from './pages/LoginPage';
import PublicRatingPage from './pages/PublicRatingPage';
import PublicAboutPage from './pages/PublicAboutPage';
import StudentDashboard from './pages/student/Dashboard';
import MentorDashboard from './pages/mentor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function RoleRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={defaultRouteFor(user.role)} replace />;
  return <>{children}</>;
}

function defaultRouteFor(role: Role) {
  if (role === 'STUDENT') return '/student/dashboard';
  if (role === 'MENTOR') return '/mentor/dashboard';
  return '/admin/dashboard';
}

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? defaultRouteFor(user.role) : '/public/rating'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/rating" element={<PublicRatingPage />} />
      <Route path="/public/about" element={<PublicAboutPage />} />
      <Route path="/student/dashboard" element={<RoleRoute role="STUDENT"><StudentDashboard /></RoleRoute>} />
      <Route path="/mentor/dashboard" element={<RoleRoute role="MENTOR"><MentorDashboard /></RoleRoute>} />
      <Route path="/admin/dashboard" element={<RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
