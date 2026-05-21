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
import MentorLayout from './layouts/MentorLayout';
import MentorDashboard from './pages/mentor/Dashboard';
import MentorStudents from './pages/mentor/Students';
import MentorFeedback from './pages/mentor/Feedback';
import MentorDiscipline from './pages/mentor/Discipline';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminAchievements from './pages/admin/Achievements';
import AdminPenalties from './pages/admin/Penalties';
import AdminGrants from './pages/admin/Grants';
import AdminRating from './pages/admin/Rating';
import AdminApiKeys from './pages/admin/ApiKeys';

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute role="ADMIN">{children}</RoleRoute>;
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

      {/* Mentor panel — nested layout with sidebar + 4 pages */}
      <Route path="/mentor" element={<RoleRoute role="MENTOR"><MentorLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/mentor/dashboard" replace />} />
        <Route path="dashboard"   element={<MentorDashboard />} />
        <Route path="students"    element={<MentorStudents />} />
        <Route path="feedback"    element={<MentorFeedback />} />
        <Route path="discipline"  element={<MentorDiscipline />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/dashboard"     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/students"      element={<AdminRoute><AdminStudents /></AdminRoute>} />
      <Route path="/admin/achievements"  element={<AdminRoute><AdminAchievements /></AdminRoute>} />
      <Route path="/admin/penalties"     element={<AdminRoute><AdminPenalties /></AdminRoute>} />
      <Route path="/admin/grants"        element={<AdminRoute><AdminGrants /></AdminRoute>} />
      <Route path="/admin/rating"        element={<AdminRoute><AdminRating /></AdminRoute>} />
      <Route path="/admin/integrations"  element={<AdminRoute><AdminApiKeys /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
