export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  badge: string;
  recommendedFor: string;
  description: string;
  accentColor: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    category: 'General Professional',
    badge: 'Standard Single-Column',
    recommendedFor: 'Enterprise ATS parsers, corporate applications, government jobs',
    description: 'Clean, chronological, single-column layout prioritizing raw readability and high parser keyword scan rates.',
    accentColor: '#1e293b',
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    category: 'Technology & Engineering',
    badge: 'Code & Tech Focused',
    recommendedFor: 'Software Engineers, Full Stack Developers, Data Scientists, DevOps',
    description: 'Emphasizes technical stack, GitHub repositories, systems architecture, and concrete project bullet metrics.',
    accentColor: '#2563eb',
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    category: 'Creative & Design',
    badge: 'Visual & Portfolio',
    recommendedFor: 'UI/UX Designers, Fashion Designers, Graphic Artists, Content Directors',
    description: 'Modern split header with prominent portfolio link badges, visual hierarchy, and spotlight on creative campaigns.',
    accentColor: '#7c3aed',
  },
  {
    id: 'business-professional',
    name: 'Business Professional',
    category: 'Business & Management',
    badge: 'Executive & Impact',
    recommendedFor: 'Product Managers, MBA Graduates, Sales Leads, Operations Directors',
    description: 'Polished layout highlighting leadership milestones, business outcomes, revenue impact, and team initiatives.',
    accentColor: '#0f766e',
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    category: 'Research & Academia',
    badge: 'Research & Scholarly',
    recommendedFor: 'Researchers, Professors, PhD Candidates, Medical & Life Sciences',
    description: 'Comprehensive academic format spotlighting degrees, institutions, GPA, publications, and conference presentations.',
    accentColor: '#854d0e',
  },
  {
    id: 'fresher-minimal',
    name: 'Fresher Minimal',
    category: 'Entry Level & Graduate',
    badge: 'Clean & Project-Driven',
    recommendedFor: 'College students, recent graduates, internship seekers, career changers',
    description: 'Focuses on coursework, university projects, hackathons, and certifications when full-time experience is still emerging.',
    accentColor: '#0891b2',
  },
  {
    id: 'photo-professional',
    name: 'Professional Photo Resume',
    category: 'Executive & Multi-Profession',
    badge: 'Photo & Executive Layout',
    recommendedFor: 'Consultants, Executives, Healthcare, Teachers, Hospitality, Creative Leads',
    description: 'Executive format featuring a distinguished profile photo, high-impact contact banner, and balanced chronological sections.',
    accentColor: '#1d4ed8',
  },
];
