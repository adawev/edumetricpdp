import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, type Role } from './lib/auth';
import LoginPage from './pages/LoginPage';
import PublicRatingPage from './pages/PublicRatingPage';
import StudentDashboard from './pages/student/Dashboard';
import MentorLayout from './layouts/MentorLayout';
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

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2">Bu sahifa keyingi phase'da qo'shiladi.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/rating" element={<PublicRatingPage />} />
      <Route path="/student/dashboard" element={<RoleRoute role="STUDENT"><StudentDashboard /></RoleRoute>} />

      <Route
        path="/mentor"
        element={
          <RoleRoute role="MENTOR">
            <MentorLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/mentor/dashboard" replace />} />
        <Route path="dashboard" element={<MentorDashboard />} />
        <Route path="students" element={<Placeholder title="Talabalar" />} />
        <Route path="feedback" element={<Placeholder title="Feedback" />} />
      </Route>

      <Route path="/admin/dashboard" element={<RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
