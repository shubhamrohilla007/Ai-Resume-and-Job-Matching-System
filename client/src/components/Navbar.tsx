import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  UserCheck,
  LogOut,
  PlusCircle,
  Sparkles,
  Upload,
  ClipboardList,
  ChevronDown,
  Menu,
  X,
  Search,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { FeedbackModal } from './FeedbackModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [resumeDropdownOpen, setResumeDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isResumeActive = () => location.pathname.startsWith('/resume');

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setResumeDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setResumeDropdownOpen(false);
    }, 250);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setResumeDropdownOpen((prev) => !prev);
  };

  // Close dropdown & mobile menu on route change
  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setResumeDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResumeDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setResumeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar no-print">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand" title="AI Resume & Careers Platform">
          <div className="nav-brand-logo">
            <FileText size={18} />
          </div>
          <span className="nav-brand-text">
            <span className="nav-brand-main">AI Resume</span>
            <span className="nav-brand-sub"> & Careers</span>
          </span>
        </Link>

        {/* Center Navigation Links (Desktop: >= 992px) */}
        <div className="nav-center">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </Link>

              {user?.role === 'job_seeker' && (
                <>
                  {/* Resume Dropdown */}
                  <div
                    className="nav-dropdown-container"
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button"
                      className={`nav-dropdown-trigger ${isResumeActive() ? 'active' : ''}`}
                      onClick={handleTriggerClick}
                      aria-expanded={resumeDropdownOpen}
                      aria-haspopup="true"
                    >
                      <FileText size={15} />
                      <span>Resume</span>
                      <ChevronDown
                        size={13}
                        style={{
                          transform: resumeDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </button>

                    {resumeDropdownOpen && (
                      <div
                        className="nav-dropdown-menu"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <Link
                          to="/resume/builder"
                          className={`nav-dropdown-item ${isActive('/resume/builder') ? 'active' : ''}`}
                          onClick={() => setResumeDropdownOpen(false)}
                        >
                          <FileText size={16} className="nav-dropdown-item-icon" />
                          <div>
                            <div className="nav-dropdown-item-title">Resume Builder</div>
                            <div className="nav-dropdown-item-desc">
                              Multi-profession builder with live preview
                            </div>
                          </div>
                        </Link>

                        <Link
                          to="/resume/templates"
                          className={`nav-dropdown-item ${isActive('/resume/templates') ? 'active' : ''}`}
                          onClick={() => setResumeDropdownOpen(false)}
                        >
                          <Sparkles size={16} className="nav-dropdown-item-icon" />
                          <div>
                            <div className="nav-dropdown-item-title">Templates Gallery</div>
                            <div className="nav-dropdown-item-desc">
                              Browse 6 profession-tailored formats
                            </div>
                          </div>
                        </Link>

                        <Link
                          to="/resume/analysis"
                          className={`nav-dropdown-item ${isActive('/resume/analysis') ? 'active' : ''}`}
                          onClick={() => setResumeDropdownOpen(false)}
                        >
                          <Upload size={16} className="nav-dropdown-item-icon" />
                          <div>
                            <div className="nav-dropdown-item-title">ATS Analysis</div>
                            <div className="nav-dropdown-item-desc">
                              Score existing PDF/DOCX and check keywords
                            </div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link to="/jobs/recommended" className={`nav-link ${isActive('/jobs/recommended') ? 'active' : ''}`}>
                    <Briefcase size={15} />
                    <span>Match Jobs</span>
                  </Link>

                  <Link to="/applications" className={`nav-link ${isActive('/applications') ? 'active' : ''}`}>
                    <ClipboardList size={15} />
                    <span>My Applications</span>
                  </Link>
                </>
              )}

              {user?.role === 'recruiter' && (
                <>
                  <Link to="/recruiter/jobs" className={`nav-link ${isActive('/recruiter/jobs') ? 'active' : ''}`}>
                    <Briefcase size={15} />
                    <span>Manage Jobs</span>
                  </Link>

                  <Link to="/recruiter/jobs/new" className={`nav-link ${isActive('/recruiter/jobs/new') ? 'active' : ''}`}>
                    <PlusCircle size={15} />
                    <span>Post Job</span>
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                  <ShieldCheck size={15} />
                  <span>Admin Panel</span>
                </Link>
              )}

              <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>
                <GraduationCap size={15} />
                <span>Free Courses</span>
              </Link>

              <Link to="/jobs" className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}>
                <Search size={15} />
                <span>Browse Jobs</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/jobs" className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}>
                <Briefcase size={15} />
                <span>Browse Jobs</span>
              </Link>
              <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>
                <GraduationCap size={15} />
                <span>Free Courses</span>
              </Link>
            </>
          )}
        </div>

        {/* Right Section: User Profile & Actions */}
        <div className="nav-right">
          {isAuthenticated ? (
            <>
              {/* User Profile Chip */}
              <Link to="/profile" className="nav-user-chip" title="View Profile">
                <div className="nav-user-avatar" style={{ overflow: 'hidden' }}>
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(user?.fullName)
                  )}
                </div>
                <span className="nav-user-name">{user?.fullName || 'User'}</span>
                <span className="nav-user-role-badge">
                  {user?.role === 'job_seeker' ? 'Candidate' : user?.role === 'recruiter' ? 'Recruiter' : 'Admin'}
                </span>
              </Link>

              {/* Theme Switcher */}
              <ThemeToggle />

              {/* Feedback Button */}
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="btn btn-secondary btn-sm nav-feedback-btn"
                title="Send platform feedback"
              >
                <MessageSquare size={14} />
                <span className="nav-feedback-text">Feedback</span>
              </button>

              {/* Desktop Logout Button */}
              <button
                onClick={handleLogout}
                className="nav-logout-btn"
                title="Log out of account"
              >
                <LogOut size={14} />
                <span className="nav-logout-text">Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <ThemeToggle />
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`nav-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {isAuthenticated ? (
          <>
            {/* User Profile Card inside Drawer */}
            <div className="nav-mobile-user-card">
              <div className="nav-user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem', overflow: 'hidden' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(user?.fullName)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--slate-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.fullName || 'User'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                  <span className="nav-user-role-badge">
                    {user?.role === 'job_seeker' ? 'Candidate' : user?.role === 'recruiter' ? 'Recruiter' : 'Admin'}
                  </span>
                  <span>{user?.email}</span>
                </div>
              </div>
              <Link to="/profile" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                Profile
              </Link>
            </div>

            <div className="nav-mobile-links-grid">
              <Link to="/dashboard" className={`nav-mobile-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </Link>

              {user?.role === 'job_seeker' && (
                <>
                  <Link to="/resume/builder" className={`nav-mobile-link ${isActive('/resume/builder') ? 'active' : ''}`}>
                    <FileText size={17} />
                    <span>Resume Builder</span>
                  </Link>
                  <Link to="/resume/templates" className={`nav-mobile-link ${isActive('/resume/templates') ? 'active' : ''}`}>
                    <Sparkles size={17} />
                    <span>Templates Gallery</span>
                  </Link>
                  <Link to="/resume/analysis" className={`nav-mobile-link ${isActive('/resume/analysis') ? 'active' : ''}`}>
                    <Upload size={17} />
                    <span>ATS Analysis</span>
                  </Link>
                  <Link to="/jobs/recommended" className={`nav-mobile-link ${isActive('/jobs/recommended') ? 'active' : ''}`}>
                    <Briefcase size={17} />
                    <span>Match Jobs</span>
                  </Link>
                  <Link to="/applications" className={`nav-mobile-link ${isActive('/applications') ? 'active' : ''}`}>
                    <ClipboardList size={17} />
                    <span>My Applications</span>
                  </Link>
                </>
              )}

              {user?.role === 'recruiter' && (
                <>
                  <Link to="/recruiter/jobs" className={`nav-mobile-link ${isActive('/recruiter/jobs') ? 'active' : ''}`}>
                    <Briefcase size={17} />
                    <span>Manage Jobs</span>
                  </Link>
                  <Link to="/recruiter/jobs/new" className={`nav-mobile-link ${isActive('/recruiter/jobs/new') ? 'active' : ''}`}>
                    <PlusCircle size={17} />
                    <span>Post Job</span>
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <Link to="/admin" className={`nav-mobile-link ${isActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                  <ShieldCheck size={17} />
                  <span>Admin Panel</span>
                </Link>
              )}

              <Link to="/courses" className={`nav-mobile-link ${isActive('/courses') ? 'active' : ''}`}>
                <GraduationCap size={17} />
                <span>Free Courses</span>
              </Link>
              <Link to="/jobs" className={`nav-mobile-link ${isActive('/jobs') ? 'active' : ''}`}>
                <Search size={17} />
                <span>Browse Jobs</span>
              </Link>
              <Link to="/profile" className={`nav-mobile-link ${isActive('/profile') ? 'active' : ''}`}>
                <UserCheck size={17} />
                <span>My Profile</span>
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.5rem', borderTop: '1px solid var(--slate-200)', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>Theme</span>
              <ThemeToggle showLabel={true} />
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--slate-200)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setFeedbackOpen(true); setMobileMenuOpen(false); }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <MessageSquare size={15} />
                <span>Give Platform Feedback</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--slate-200)' }}
              >
                <LogOut size={16} />
                <span>Logout from Account</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <Link to="/jobs" className={`nav-mobile-link ${isActive('/jobs') ? 'active' : ''}`}>
              <Briefcase size={17} />
              <span>Browse Jobs</span>
            </Link>
            <Link to="/courses" className={`nav-mobile-link ${isActive('/courses') ? 'active' : ''}`}>
              <GraduationCap size={17} />
              <span>Free Courses</span>
            </Link>
            <button
              type="button"
              onClick={() => { setFeedbackOpen(true); setMobileMenuOpen(false); }}
              className="nav-mobile-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', padding: '0.5rem 0' }}
            >
              <MessageSquare size={17} />
              <span>Give Platform Feedback</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--slate-200)', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>Theme</span>
              <ThemeToggle showLabel={true} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </nav>
  );
};
