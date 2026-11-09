import React, { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface SkillChipInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SkillChipInput: React.FC<SkillChipInputProps> = ({
  skills,
  onChange,
  placeholder = 'Type skill and press Enter or comma (e.g. React, Node.js, Machine Learning)...',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  // Helper to normalize and add one or more skills
  const addSkills = (rawText: string) => {
    if (!rawText) return;

    // Split by comma, semicolon, or newline
    const tokens = rawText
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    // Existing skills in lowercase for duplicate check
    const existingLower = new Set(skills.map((s) => s.toLowerCase()));
    const newSkillsToAdd: string[] = [];

    for (const token of tokens) {
      if (!existingLower.has(token.toLowerCase())) {
        newSkillsToAdd.push(token);
        existingLower.add(token.toLowerCase());
      }
    }

    if (newSkillsToAdd.length > 0) {
      onChange([...skills, ...newSkillsToAdd]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Prevent form submission
      e.preventDefault();
      if (inputValue.trim()) {
        addSkills(inputValue);
        setInputValue('');
      }
    } else if (e.key === ',') {
      // Comma commits the skill
      e.preventDefault();
      if (inputValue.trim()) {
        addSkills(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      // Backspace on empty input removes the last chip
      onChange(skills.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    // If pasted text contains comma, semicolon, or newline, parse it immediately
    if (pastedText.includes(',') || pastedText.includes(';') || pastedText.includes('\n')) {
      e.preventDefault();
      const combined = inputValue ? `${inputValue}, ${pastedText}` : pastedText;
      addSkills(combined);
      setInputValue('');
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addSkills(inputValue);
      setInputValue('');
    }
  };

  const removeSkill = (indexToRemove: number) => {
    onChange(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const handleManualAdd = () => {
    if (inputValue.trim()) {
      addSkills(inputValue);
      setInputValue('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Chips Container */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.45rem',
          minHeight: '42px',
          padding: '0.5rem',
          border: '1px solid var(--slate-300)',
          borderRadius: 'var(--radius-sm)',
          background: '#ffffff',
          alignItems: 'center',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
        onClick={(e) => {
          // Focus input when clicking inside container
          const target = e.currentTarget.querySelector('input');
          target?.focus();
        }}
      >
        {skills.map((skill, idx) => (
          <span
            key={`${skill}-${idx}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.55rem',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(idx);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                cursor: 'pointer',
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                lineHeight: 1,
              }}
              title={`Remove ${skill}`}
              aria-label={`Remove ${skill}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}

        {/* Inline Input Field */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={skills.length === 0 ? placeholder : 'Add another skill...'}
          style={{
            flex: 1,
            minWidth: '160px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '0.35rem',
            fontSize: '0.875rem',
            color: 'var(--slate-800)',
          }}
        />
      </div>

      {/* Helper text & Skill counter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--slate-500)',
          padding: '0 0.2rem',
        }}
      >
        <span>
          💡 Press <kbd style={{ padding: '1px 4px', background: '#e2e8f0', borderRadius: '3px' }}>Enter</kbd> or <kbd style={{ padding: '1px 4px', background: '#e2e8f0', borderRadius: '3px' }}>,</kbd> after each skill. Paste comma-separated lists to add multiple at once.
        </span>
        <span style={{ fontWeight: 600 }}>{skills.length} {skills.length === 1 ? 'skill' : 'skills'} added</span>
      </div>
    </div>
  );
};
