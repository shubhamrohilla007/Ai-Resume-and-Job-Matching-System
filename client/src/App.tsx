import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AtsAnalysisPage } from './pages/AtsAnalysisPage';
import { TemplateGalleryPage } from './pages/TemplateGalleryPage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';
import { RecommendedJobsPage } from './pages/RecommendedJobsPage';
import { PublicJobsPage } from './pages/PublicJobsPage';
import { RecruiterJobsPage } from './pages/RecruiterJobsPage';
import { PostJobPage } from './pages/PostJobPage';
import { CoursesPage } from './pages/CoursesPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({
  children,
  allowedRole,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/jobs" element={<PublicJobsPage />} />
              <Route path="/courses" element={<CoursesPage />} />

              {/* Protected Routes: General */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes: Job Seeker Resume & Matching */}
              <Route
                path="/resume/templates"
                element={
                  <ProtectedRoute allowedRole="job_seeker">
                    <TemplateGalleryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/builder"
                element={
                  <ProtectedRoute allowedRole="job_seeker">
                    <ResumeBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/upload"
                element={
                  <ProtectedRoute allowedRole="job_seeker">
                    <AtsAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/analysis"
                element={
                  <ProtectedRoute allowedRole="job_seeker">
                    <AtsAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/recommended"
                element={
                  <ProtectedRoute allowedRole="job_seeker">
                    <RecommendedJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute allowedRole="job_seeker">
                    <MyApplicationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy URL Aliases & Redirects */}
              <Route path="/resume/choose" element={<Navigate to="/resume/builder" replace />} />
              <Route path="/resume-builder" element={<Navigate to="/resume/builder" replace />} />
              <Route path="/dashboard/jobseeker" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/recruiter" element={<Navigate to="/dashboard" replace />} />

              {/* Protected Routes: Recruiter */}
              <Route
                path="/recruiter/jobs"
                element={
                  <ProtectedRoute allowedRole="recruiter">
                    <RecruiterJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs/new"
                element={
                  <ProtectedRoute allowedRole="recruiter">
                    <PostJobPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes: Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
