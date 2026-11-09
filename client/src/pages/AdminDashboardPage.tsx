import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/client';
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
  ClipboardList,
  Activity,
  Settings,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  Server,
  Database,
  Cloud,
  Cpu,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Key,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'users'
  | 'recruiters'
  | 'jobs'
  | 'resumes'
  | 'applications'
  | 'logs'
  | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Users Tab
  const [users, setUsers] = useState<any[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Recruiters Tab
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [recruiterPage, setRecruiterPage] = useState(1);
  const [recruiterTotalPages, setRecruiterTotalPages] = useState(1);
  const [recruiterSearch, setRecruiterSearch] = useState('');

  // Jobs Tab
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobPage, setJobPage] = useState(1);
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [jobSearch, setJobSearch] = useState('');
  const [jobTrustFilter, setJobTrustFilter] = useState('');
  const [jobActiveFilter, setJobActiveFilter] = useState('');

  // Resumes Tab
  const [resumes, setResumes] = useState<any[]>([]);
  const [resumePage, setResumePage] = useState(1);
  const [resumeTotalPages, setResumeTotalPages] = useState(1);

  // Applications Tab
  const [applications, setApplications] = useState<any[]>([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appStatusFilter, setAppStatusFilter] = useState('');

  // Logs Tab
  const [logs, setLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      const [ovRes, hlRes] = await Promise.allSettled([
        adminApi.getOverview(),
        adminApi.getSystemHealth(),
      ]);
      if (ovRes.status === 'fulfilled' && ovRes.value.success) {
        setOverviewStats(ovRes.value.stats);
      }
      if (hlRes.status === 'fulfilled' && hlRes.value.success) {
        setSystemHealth(hlRes.value.system);
      }
    } catch (err: any) {
      console.error('Failed to load overview:', err);
    }
  };

  // Load Users Data
  const loadUsers = async () => {
    try {
      const params: any = { page: userPage, limit: 12 };
      if (userSearch) params.search = userSearch;
      if (userRoleFilter) params.role = userRoleFilter;
      if (userStatusFilter) params.status = userStatusFilter;
      const res = await adminApi.getUsers(params);
      if (res.success) {
        setUsers(res.users || []);
        setUserTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load users' });
    }
  };

  // Load Recruiters Data
  const loadRecruiters = async () => {
    try {
      const params: any = { page: recruiterPage, limit: 12 };
      if (recruiterSearch) params.search = recruiterSearch;
      const res = await adminApi.getRecruiters(params);
      if (res.success) {
        setRecruiters(res.recruiters || []);
        setRecruiterTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load recruiters' });
    }
  };

  // Load Jobs Data
  const loadJobs = async () => {
    try {
      const params: any = { page: jobPage, limit: 12 };
      if (jobSearch) params.search = jobSearch;
      if (jobTrustFilter) params.trustStatus = jobTrustFilter;
      if (jobActiveFilter !== '') params.isActive = jobActiveFilter;
      const res = await adminApi.getJobs(params);
      if (res.success) {
        setJobs(res.jobs || []);
        setJobTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load jobs' });
    }
  };

  // Load Resumes Data
  const loadResumes = async () => {
    try {
      const params = { page: resumePage, limit: 12 };
      const res = await adminApi.getResumes(params);
      if (res.success) {
        setResumes(res.resumes || []);
        setResumeTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load resumes' });
    }
  };

  // Load Applications Data
  const loadApplications = async () => {
    try {
      const params: any = { page: appPage, limit: 12 };
      if (appStatusFilter) params.status = appStatusFilter;
      const res = await adminApi.getApplications(params);
      if (res.success) {
        setApplications(res.applications || []);
        setAppTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load applications' });
    }
  };

  // Load Logs Data
  const loadLogs = async () => {
    try {
      const params: any = { page: logPage, limit: 15 };
      if (logActionFilter) params.actionType = logActionFilter;
      if (logSearch) params.search = logSearch;
      const res = await adminApi.getActivityLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
        setLogTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load activity logs' });
    }
  };

  // Initial tab loading
  useEffect(() => {
    setLoading(true);
    const fetchTab = async () => {
      switch (activeTab) {
        case 'overview':
          await loadOverview();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'recruiters':
          await loadRecruiters();
          break;
        case 'jobs':
          await loadJobs();
          break;
        case 'resumes':
          await loadResumes();
          break;
        case 'applications':
          await loadApplications();
          break;
        case 'logs':
          await loadLogs();
          break;
        case 'settings':
          await adminApi.getSystemHealth().then((res) => {
            if (res.success) setSystemHealth(res.system);
          });
          break;
      }
      setLoading(false);
    };
    fetchTab();
  }, [
    activeTab,
    userPage,
    userRoleFilter,
    userStatusFilter,
    recruiterPage,
    jobPage,
    jobTrustFilter,
    jobActiveFilter,
    resumePage,
    appPage,
    appStatusFilter,
    logPage,
    logActionFilter,
  ]);

  // Handler: Change Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await adminApi.updateUserRole(userId, newRole);
      if (res.success) {
        setToast({ type: 'success', message: res.message || 'User role updated' });
        loadUsers();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to update user role' });
    }
  };

  // Handler: Toggle User Status
  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await adminApi.updateUserStatus(userId, !currentStatus);
      if (res.success) {
        setToast({ type: 'success', message: res.message || 'User status updated' });
        loadUsers();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to update status' });
    }
  };

  // Handler: Delete User
  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${fullName}"? This will delete all their resumes, jobs, and applications.`)) {
      return;
    }
    try {
      const res = await adminApi.deleteUser(userId);
      if (res.success) {
        setToast({ type: 'success', message: 'User and associated data deleted' });
        loadUsers();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to delete user' });
    }
  };

  // Handler: Toggle Job Active Status
  const handleJobStatusToggle = async (jobId: string, currentActive: boolean) => {
    try {
      const res = await adminApi.updateJobStatus(jobId, { isActive: !currentActive });
      if (res.success) {
        setToast({ type: 'success', message: `Job ${!currentActive ? 'activated' : 'closed'}` });
        loadJobs();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to update job' });
    }
  };

  // Handler: Override Trust Status
  const handleJobTrustOverride = async (jobId: string, newStatus: string) => {
    try {
      const res = await adminApi.updateJobStatus(jobId, { trustStatus: newStatus });
      if (res.success) {
        setToast({ type: 'success', message: `Job trust status updated to ${newStatus}` });
        loadJobs();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to update trust status' });
    }
  };

  // Handler: Delete Job
  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove job "${title}" and all its candidate applications?`)) {
      return;
    }
    try {
      const res = await adminApi.deleteJob(jobId);
      if (res.success) {
        setToast({ type: 'success', message: 'Job removed successfully' });
        loadJobs();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to delete job' });
    }
  };

  // Render Helpers
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '0.85rem 1.4rem',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--primary)',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                Admin Control Center
              </h1>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                System governance, user moderation, TrustBridge fraud oversight & cloud audit.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              setLoading(true);
              if (activeTab === 'overview') loadOverview();
              else if (activeTab === 'users') loadUsers();
              else if (activeTab === 'recruiters') loadRecruiters();
              else if (activeTab === 'jobs') loadJobs();
              else if (activeTab === 'resumes') loadResumes();
              else if (activeTab === 'applications') loadApplications();
              else if (activeTab === 'logs') loadLogs();
              setTimeout(() => setLoading(false), 400);
            }}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #a7f3d0',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            LIVE ATLAS CLUSTER
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid var(--slate-200)',
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'recruiters', label: 'Recruiters', icon: UserCheck },
          { id: 'jobs', label: 'Job Moderation', icon: Briefcase },
          { id: 'resumes', label: 'Resumes & ATS', icon: FileText },
          { id: 'applications', label: 'Applications', icon: ClipboardList },
          { id: 'logs', label: 'Activity Logs', icon: Activity },
          { id: 'settings', label: 'System & Profile', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--slate-600)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW METRICS */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && overviewStats && (
            <div>
              {/* Stat Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                        Total Accounts
                      </span>
                      <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
                        {overviewStats.totalUsers}
                      </h3>
                    </div>
                    <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: 'var(--primary)' }}>
                      <Users size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    <span>{overviewStats.usersByRole.job_seeker} Seekers</span> • <span>{overviewStats.usersByRole.recruiter} Recruiters</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                        Platform Jobs
                      </span>
                      <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
                        {overviewStats.totalJobs}
                      </h3>
                    </div>
                    <div style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
                      <Briefcase size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                    {overviewStats.activeJobs} Active • {overviewStats.inactiveJobs} Closed
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                        Applications
                      </span>
                      <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
                        {overviewStats.totalApplications}
                      </h3>
                    </div>
                    <div style={{ padding: '0.5rem', backgroundColor: '#faf5ff', borderRadius: '8px', color: '#9333ea' }}>
                      <ClipboardList size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    Candidate matching submissions
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                        Avg ATS Score
                      </span>
                      <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
                        {overviewStats.atsScoreStats.average}%
                      </h3>
                    </div>
                    <div style={{ padding: '0.5rem', backgroundColor: '#fffbeb', borderRadius: '8px', color: '#d97706' }}>
                      <FileText size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    Max: {overviewStats.atsScoreStats.max}% across {overviewStats.totalResumes} resumes
                  </div>
                </div>
              </div>

              {/* TrustBridge Job Security & Health Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    TrustBridge Job Fraud Oversight
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> Approved (Safe)
                      </span>
                      <span style={{ fontWeight: 700 }}>{overviewStats.jobsByTrustStatus.approved || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 600 }}>
                        <AlertTriangle size={16} /> Needs Review (Signals)
                      </span>
                      <span style={{ fontWeight: 700 }}>{overviewStats.jobsByTrustStatus['needs-review'] || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', fontWeight: 600 }}>
                        <XCircle size={16} /> Blocked (High Risk / Scam)
                      </span>
                      <span style={{ fontWeight: 700 }}>{overviewStats.jobsByTrustStatus.blocked || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Server size={18} color="var(--primary)" />
                    Cloud Infrastructure Status
                  </h3>
                  {systemHealth ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Database:</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>MongoDB Atlas (Connected)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Storage:</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>Cloudinary Signed Storage (Ready)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Gemini AI:</span>
                        <span style={{ fontWeight: 600, color: systemHealth.services?.geminiAI ? '#16a34a' : '#d97706' }}>
                          {systemHealth.services?.geminiAI ? 'Active (API Configured)' : 'Offline / Missing Key'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>SMTP Mail:</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>Gmail SMTP (Live SSL)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Uptime:</span>
                        <span style={{ fontWeight: 600 }}>{Math.floor(systemHealth.uptimeSeconds / 60)} minutes</span>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Loading diagnostics...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: USER MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>Registered Users</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>View, search, update roles, or suspend user accounts.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--slate-400)' }} />
                    <input
                      type="text"
                      placeholder="Search name or email..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      style={{ paddingLeft: '2rem', padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                  >
                    <option value="">All Roles</option>
                    <option value="job_seeker">Job Seeker</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setUserPage(1);
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Activity</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Joined</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isMe = String(u._id) === String(user?.id);
                      return (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{u.fullName}</div>
                            <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <select
                              value={u.role}
                              disabled={isMe}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid var(--slate-300)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                backgroundColor: u.role === 'admin' ? '#eff6ff' : u.role === 'recruiter' ? '#f0fdf4' : '#fff',
                              }}
                            >
                              <option value="job_seeker">Job Seeker</option>
                              <option value="recruiter">Recruiter</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <button
                              disabled={isMe}
                              onClick={() => handleUserStatusToggle(u._id, u.isActive)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: isMe ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: u.isActive ? '#ecfdf5' : '#fef2f2',
                                color: u.isActive ? '#059669' : '#dc2626',
                              }}
                            >
                              {u.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {u.isActive ? 'Active' : 'Suspended'}
                            </button>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-600)', fontSize: '0.8rem' }}>
                            {u.role === 'job_seeker' ? (
                              <span>
                                {u.resumeCount} Resumes ({u.latestAtsScore ? `${u.latestAtsScore}% ATS` : 'No score'})
                              </span>
                            ) : (
                              <span>{u.applicationCount} Submissions</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            {!isMe && (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.fullName)}
                                className="btn"
                                style={{
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '4px',
                                }}
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--slate-500)' }}>
                  Page {userPage} of {userTotalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.7rem' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    disabled={userPage >= userTotalPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.7rem' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RECRUITER MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'recruiters' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>Recruiter Organizations</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Recruiter accounts, posted job counts, and total candidate applications.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search recruiters..."
                  value={recruiterSearch}
                  onChange={(e) => {
                    setRecruiterSearch(e.target.value);
                    setRecruiterPage(1);
                  }}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Recruiter</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Jobs Posted</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Active Openings</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Total Applicants</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Account Status</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiters.map((r) => (
                      <tr key={r._id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{r.fullName}</div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{r.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{r.totalJobs}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#16a34a', fontWeight: 600 }}>{r.activeJobs}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', fontWeight: 600 }}>{r.totalApplicants}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: r.isActive ? '#ecfdf5' : '#fef2f2',
                              color: r.isActive ? '#059669' : '#dc2626',
                            }}
                          >
                            {r.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: JOB MANAGEMENT & MODERATION */}
          {/* ========================================================================= */}
          {activeTab === 'jobs' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>Platform Job Openings</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>TrustBridge audit assessment, status toggle, and scam moderation.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search job or company..."
                    value={jobSearch}
                    onChange={(e) => {
                      setJobSearch(e.target.value);
                      setJobPage(1);
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                  />

                  <select
                    value={jobTrustFilter}
                    onChange={(e) => {
                      setJobTrustFilter(e.target.value);
                      setJobPage(1);
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                  >
                    <option value="">All Trust Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="needs-review">Needs Review</option>
                    <option value="blocked">Blocked</option>
                  </select>

                  <select
                    value={jobActiveFilter}
                    onChange={(e) => {
                      setJobActiveFilter(e.target.value);
                      setJobPage(1);
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                  >
                    <option value="">All Job Statuses</option>
                    <option value="true">Active Only</option>
                    <option value="false">Closed Only</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Title & Company</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Recruiter</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>TrustBridge Audit</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Applicants</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j._id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{j.title}</div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{j.company} • {j.location}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                          <div>{j.recruiter?.fullName || 'Recruiter'}</div>
                          <div style={{ color: 'var(--slate-400)' }}>{j.recruiter?.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <select
                            value={j.trustStatus || 'approved'}
                            onChange={(e) => handleJobTrustOverride(j._id, e.target.value)}
                            style={{
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              border: '1px solid var(--slate-300)',
                              backgroundColor:
                                j.trustStatus === 'blocked' ? '#fee2e2' : j.trustStatus === 'needs-review' ? '#fef3c7' : '#ecfdf5',
                              color:
                                j.trustStatus === 'blocked' ? '#dc2626' : j.trustStatus === 'needs-review' ? '#d97706' : '#059669',
                            }}
                          >
                            <option value="approved">Approved</option>
                            <option value="needs-review">Needs Review</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <button
                            onClick={() => handleJobStatusToggle(j._id, j.isActive)}
                            style={{
                              border: 'none',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              backgroundColor: j.isActive ? '#ecfdf5' : '#f1f5f9',
                              color: j.isActive ? '#059669' : '#64748b',
                            }}
                          >
                            {j.isActive ? 'Active' : 'Closed'}
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{j.applicantCount || 0}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteJob(j._id, j.title)}
                            className="btn"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: RESUMES & ATS MONITORING */}
          {/* ========================================================================= */}
          {activeTab === 'resumes' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>Candidate Resumes & ATS Scoring</h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Monitored resume metadata, Cloudinary storage, and ATS evaluations.</p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Candidate</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>File Details</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Storage</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ATS Match</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Uploaded</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumes.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{r.candidateName}</div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{r.candidateEmail}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 500 }}>{r.originalName}</div>
                          <div style={{ color: 'var(--slate-400)' }}>{formatBytes(r.fileSize)} • {r.fileType}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: r.storageProvider === 'cloudinary' ? '#e0f2fe' : '#f1f5f9',
                              color: r.storageProvider === 'cloudinary' ? '#0369a1' : '#475569',
                            }}
                          >
                            {r.storageProvider === 'cloudinary' ? 'Cloudinary' : 'Local'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {r.atsScore ? (
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: r.atsScore >= 75 ? '#dcfce7' : r.atsScore >= 50 ? '#fef3c7' : '#fee2e2',
                                color: r.atsScore >= 75 ? '#15803d' : r.atsScore >= 50 ? '#b45309' : '#b91c1c',
                              }}
                            >
                              {r.atsScore}% Score
                            </span>
                          ) : (
                            <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          <a
                            href={`/api/resume/file?id=${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={13} />
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: JOB APPLICATIONS MONITORING */}
          {/* ========================================================================= */}
          {activeTab === 'applications' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>Candidate Job Applications</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Platform-wide application records connecting job seekers to recruiters.</p>
                </div>
                <select
                  value={appStatusFilter}
                  onChange={(e) => {
                    setAppStatusFilter(e.target.value);
                    setAppPage(1);
                  }}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Candidate</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Job & Company</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Candidate Skills</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Applied On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{a.candidateName}</div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{a.candidateEmail}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 500 }}>{a.jobTitle}</div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>{a.company}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>
                          {Array.isArray(a.skills) && a.skills.length > 0
                            ? a.skills.slice(0, 3).join(', ') + (a.skills.length > 3 ? '...' : '')
                            : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor:
                                a.status === 'shortlisted' ? '#dcfce7' : a.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                              color:
                                a.status === 'shortlisted' ? '#15803d' : a.status === 'rejected' ? '#b91c1c' : '#475569',
                            }}
                          >
                            {a.status?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                          {new Date(a.appliedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: REPORTS & ACTIVITY AUDIT LOGS */}
          {/* ========================================================================= */}
          {activeTab === 'logs' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>Audit & Moderation Logs</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Track all administrative decisions, role updates, and deletions.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <a
                    href="/api/admin/logs?format=csv"
                    download="admin_audit_logs.csv"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Download size={14} /> Export CSV
                  </a>

                  <select
                    value={logActionFilter}
                    onChange={(e) => {
                      setLogActionFilter(e.target.value);
                      setLogPage(1);
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                  >
                    <option value="">All Actions</option>
                    <option value="USER_ROLE_CHANGE">Role Changes</option>
                    <option value="USER_STATUS_CHANGE">Status Changes</option>
                    <option value="USER_DELETED">User Deletions</option>
                    <option value="JOB_STATUS_CHANGE">Job Moderation</option>
                    <option value="JOB_DELETED">Job Deletions</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Admin</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Target</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l._id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-500)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{l.adminName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{l.adminEmail}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#eff6ff',
                              color: 'var(--primary)',
                            }}
                          >
                            {l.actionType}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--slate-700)' }}>
                          {l.targetEntity}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                          {l.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: ADMIN PROFILE & SYSTEM DIAGNOSTICS */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={18} color="var(--primary)" />
                  Admin Account Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Name</span>
                    <strong style={{ color: 'var(--slate-900)' }}>{user?.fullName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Email</span>
                    <strong style={{ color: 'var(--slate-900)' }}>{user?.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Security Role</span>
                    <span style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      SYSTEM ADMINISTRATOR
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Auth Provider</span>
                    <strong>{user?.authProvider || 'local'}</strong>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="var(--primary)" />
                  MongoDB Atlas Cloud Configuration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Cluster Host</span>
                    <code style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                      cluster0.xenqipq.mongodb.net
                    </code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Database Target</span>
                    <strong style={{ color: '#059669' }}>ai_resume_system</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Local DB Fallback</span>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>DISABLED (Zero local database usage)</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.8rem' }}>Storage Engine</span>
                    <strong style={{ color: '#0369a1' }}>Cloudinary (Private Signed Delivery)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default AdminDashboardPage;
