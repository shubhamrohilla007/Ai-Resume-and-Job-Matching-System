import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coursesApi } from '../api/client';
import { Course, CourseRecommendations } from '../types';
import {
  GraduationCap,
  Search,
  ExternalLink,
  Award,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Filter,
} from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSkills = searchParams.get('skills');

  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [category, setCategory] = useState('All');
  const [discipline, setDiscipline] = useState('All');

  const [platformsList, setPlatformsList] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await coursesApi.getCourses();
        if (res.success && res.courses) {
          setCourses(res.courses);
          setPlatformsList(res.platforms || []);
          setCategoriesList(res.categories || []);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch skill-gap recommendation roadmap if skills are present
  useEffect(() => {
    const fetchRoadmap = async () => {
      const skillsArray = initialSkills ? initialSkills.split(',').map((s) => s.trim()).filter(Boolean) : [];
      setRecLoading(true);
      try {
        const res = await coursesApi.getRecommendations(skillsArray);
        if (res.success && res.recommendations) {
          setRecommendations(res.recommendations);
        }
      } catch (err) {
        console.error('Failed to load course recommendations:', err);
      } finally {
        setRecLoading(false);
      }
    };

    fetchRoadmap();
  }, [initialSkills]);

  const filteredCourses = courses.filter((c) => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchPlatform = platform === 'All' || c.platform === platform;
    const matchCategory = category === 'All' || c.category === category;
    const matchDiscipline = discipline === 'All' || c.discipline.includes(discipline);

    return matchSearch && matchPlatform && matchCategory && matchDiscipline;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '50vh', alignItems: 'center' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
        }}>
          <GraduationCap size={16} /> Verified 100% Free Government & Enterprise Courses
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Skill-Gap Learning Catalog
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '1rem', marginTop: '0.35rem' }}>
          Certified credentials from IBM SkillsBuild, Infosys Springboard, Swayam (Govt. of India), Harvard CS50, and Kaggle.
        </p>
      </div>

      {/* AI Recommendation & 3-Phase Roadmap Banner */}
      {recommendations && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Sparkles color="var(--primary)" size={22} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--slate-900)' }}>
              Personalized 3-Phase Skill-Gap Learning Roadmap
            </h2>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            {recommendations.aiRationale}
          </p>

          {/* Roadmap Steps */}
          <div className="grid-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
            {recommendations.learningRoadmap.map((step, idx) => (
              <div key={idx} style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{step.phase}</strong>
                  <span className="badge badge-slate" style={{ fontSize: '0.75rem' }}>{step.duration}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: '1.4' }}>
                  {step.goal}
                </div>
              </div>
            ))}
          </div>

          {initialSkills && (
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Targeting missing skills: <strong>{initialSkills}</strong>
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div className="grid-4" style={{ alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Courses / Skills</label>
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Python, Agile, AI, Cloud..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Platform</label>
            <select
              className="form-select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {platformsList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Discipline</label>
            <select
              className="form-select"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            >
              <option value="All">All Disciplines</option>
              <option value="Technical">Technical / Engineering</option>
              <option value="MBA">MBA / Business & Management</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--slate-700)' }}>
          Showing {filteredCourses.length} Verified Courses
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        {filteredCourses.map((c) => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span className="badge badge-primary">{c.platform}</span>
              <span className="badge badge-success">{c.price}</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
              {c.title}
            </h3>

            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
              Offered by <strong>{c.provider}</strong> • {c.duration}
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5', flex: 1, marginBottom: '1rem' }}>
              {c.description}
            </p>

            {/* Skills Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1.25rem' }}>
              {c.skills.slice(0, 4).map((s, i) => (
                <span key={i} className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Credential Badge Info */}
            <div style={{
              background: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              color: 'var(--slate-700)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '1rem',
            }}>
              <Award size={16} color="var(--primary)" />
              <span>{c.badge}</span>
            </div>

            <a
              href={c.enrollUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              Enroll Free on {c.platform} <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
