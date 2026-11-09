import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api/client';
import { UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    education: '',
    experience: '',
    skills: '',
    location: '',
    linkedin: '',
    github: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        if (data.profile) {
          setFormData({
            fullName: data.profile.fullName || user?.fullName || '',
            phone: data.profile.phone || '',
            education: data.profile.education || '',
            experience: data.profile.experience || '',
            skills: Array.isArray(data.profile.skills) ? data.profile.skills.join(', ') : '',
            location: data.profile.location || '',
            linkedin: data.profile.linkedin || '',
            github: data.profile.github || '',
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            fullName: user?.fullName || '',
          }));
        }
      } catch (err: any) {
        setErrorMsg('Unable to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await profileApi.saveProfile(formData);
      if (res.success) {
        setSuccessMsg('Profile updated successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '50vh', alignItems: 'center' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={22} color="var(--primary)" />
              Candidate Profile
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              Your profile information helps personalize job matching and AI suggestions.
            </p>
          </div>
          <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>
            {user?.role.replace('_', ' ')}
          </span>
        </div>

        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-input"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="location">Location / City</label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bangalore, India (or Remote)"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="education">Highest Education</label>
              <input
                id="education"
                name="education"
                type="text"
                className="form-input"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g. B.Tech in Computer Science"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="experience">Years / Summary of Experience</label>
            <input
              id="experience"
              name="experience"
              type="text"
              className="form-input"
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 2 years in Frontend Development (or Fresher)"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skills">Key Skills (comma separated)</label>
            <input
              id="skills"
              name="skills"
              type="text"
              className="form-input"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, TypeScript, Node.js, Python, MongoDB"
            />
            <div className="form-hint">These skills are automatically matched against employer requirements.</div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="linkedin">LinkedIn Profile URL</label>
              <input
                id="linkedin"
                name="linkedin"
                type="text"
                className="form-input"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="github">GitHub / Portfolio URL</label>
              <input
                id="github"
                name="github"
                type="text"
                className="form-input"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
