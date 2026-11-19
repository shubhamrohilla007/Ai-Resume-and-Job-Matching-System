import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, MessageSquare, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { feedbackApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

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
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Pinned Header */}
        <div className="app-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                Platform Feedback
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--slate-500)' }}>
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
              color: 'var(--slate-500)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form with Scrollable Body and Pinned Footer */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden' }}
        >
          {/* Scrollable Body */}
          <div className="app-modal-body">
            {successMsg ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <CheckCircle size={48} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#059669' }}>
                  Feedback Submitted!
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', maxWidth: '380px' }}>
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
                      background: 'var(--danger-light)',
                      border: '1px solid #fecaca',
                      color: 'var(--danger)',
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                    Your Overall Experience (1 to 5 Stars)
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                            color: active ? '#f59e0b' : 'var(--slate-300)',
                            transition: 'color 0.15s ease',
                          }}
                        >
                          <Star size={26} fill={active ? '#f59e0b' : 'none'} />
                        </button>
                      );
                    })}
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#f59e0b' }}>
                      {rating === 5 ? '5.0 - Excellent' : rating === 4 ? '4.0 - Good' : rating === 3 ? '3.0 - Fair' : rating === 2 ? '2.0 - Poor' : '1.0 - Needs Work'}
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                    Feedback Category
                  </label>
                  <select
                    className="form-control form-select"
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    className="form-control form-input"
                    placeholder="e.g. Resume ATS score suggestion or UI glitch"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={120}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px' }}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                    Your Message & Suggestions
                  </label>
                  <textarea
                    className="form-control form-textarea"
                    rows={4}
                    placeholder="What worked well? What felt confusing or could be improved?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', resize: 'vertical', minHeight: '90px' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Pinned Footer Buttons */}
          {!successMsg && (
            <div className="app-modal-footer">
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
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};
