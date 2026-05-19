import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, type Role } from './lib/auth';
import LoginPage from './pages/LoginPage';
import PublicRatingPage from './pages/PublicRatingPage';
import PublicAboutPage from './pages/PublicAboutPage';
import PublicBadgesPage from './pages/PublicBadgesPage';
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentAchievements from './pages/student/Achievements';
import StudentFeedbacks from './pages/student/Feedbacks';
import StudentRating from './pages/student/Rating';
import StudentPublicProfile from './pages/student/PublicProfile';
import MentorDashboard from './pages/mentor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function defaultRouteFor(role: Role) {
  if (role === 'STUDENT') return '/student/dashboard';
  if (role === 'MENTOR') return '/mentor/dashboard';
  return '/admin/dashboard';
}

function RoleRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={defaultRouteFor(user.role)} replace />;
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
      <Route path="/public/badges" element={<PublicBadgesPage />} />

      {/* Student panel — nested layout, STUDENT only */}
      <Route path="/student" element={<RoleRoute role="STUDENT"><StudentLayout /></RoleRoute>}>
        <Route path="dashboard"    element={<StudentDashboard />} />
        <Route path="profile"      element={<StudentProfile />} />
        <Route path="achievements" element={<StudentAchievements />} />
        <Route path="feedbacks"    element={<StudentFeedbacks />} />
        <Route path="rating"       element={<StudentRating />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Public student profile — any authenticated role */}
      <Route path="/student/:studentId" element={<RequireAuth><StudentPublicProfile /></RequireAuth>} />

      <Route path="/mentor/dashboard" element={<RoleRoute role="MENTOR"><MentorDashboard /></RoleRoute>} />
      <Route path="/admin/dashboard"  element={<RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
