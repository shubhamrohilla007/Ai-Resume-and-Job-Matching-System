import React, { useState } from 'react';
import { Star, MessageSquare, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { feedbackApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();

  const [category, setCategory] = useState<'general' | 'bug' | 'feature_request' | 'job_quality' | 'ui_ux'>('general');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg('Please enter a brief subject.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please enter your feedback comments.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await feedbackApi.submit({
        category,
        rating,
        subject: subject.trim(),
        message: message.trim(),
        pageUrl: window.location.pathname,
      });

      setSuccessMsg('Thank you! Your feedback has been submitted successfully to the platform administrators.');
      setTimeout(() => {
        setSuccessMsg('');
        setSubject('');
        setMessage('');
        setRating(5);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--slate-50, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--primary, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Platform Feedback</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Help us improve your experience with suggestions or bug reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {successMsg ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircle size={48} color="#059669" />
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#059669' }}>
                Feedback Submitted!
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', maxWidth: '380px' }}>
                {successMsg}
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Star Rating */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Your Overall Experience (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: active ? '#f59e0b' : '#cbd5e1',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        <Star size={26} fill={active ? '#f59e0b' : 'none'} />
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#f59e0b' }}>
                    {rating === 5 ? '5.0 - Excellent' : rating === 4 ? '4.0 - Good' : rating === 3 ? '3.0 - Fair' : rating === 2 ? '2.0 - Poor' : '1.0 - Terribly Needs Work'}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Feedback Category
                </label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px' }}
                >
                  <option value="general">General Platform Experience</option>
                  <option value="ui_ux">UI / UX & Layout Usability</option>
                  <option value="feature_request">Feature Request / Enhancement Idea</option>
                  <option value="job_quality">Job Matching / Application Quality</option>
                  <option value="bug">Bug Report / Something Broken</option>
                </select>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Subject
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Resume ATS score suggestion or UI glitch"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px' }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Your Message & Suggestions
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="What worked well? What felt confusing or could be improved?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary btn-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin-animate" /> Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
