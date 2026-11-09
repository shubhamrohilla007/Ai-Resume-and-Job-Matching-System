/**
 * Job Listing Completeness Evaluator
 * Evaluates job listing detail quality and completeness.
 */

const JOB_FIELD_WEIGHTS = {
  title: 15,
  company: 15,
  description: 25,
  requiredSkills: 15,
  preferredSkills: 5,
  experienceLevel: 5,
  location: 5,
  jobType: 5,
  salary: 5,
  applicationUrl: 5,
};

function calculateJobCompleteness(jobData = {}) {
  let score = 0;
  const missingFields = [];

  // Title
  if (jobData.title && String(jobData.title).trim().length >= 3) {
    score += JOB_FIELD_WEIGHTS.title;
  } else {
    missingFields.push('Job Title');
  }

  // Company
  if (jobData.company && String(jobData.company).trim().length >= 2) {
    score += JOB_FIELD_WEIGHTS.company;
  } else {
    missingFields.push('Company Name');
  }

  // Description
  const desc = String(jobData.description || '').trim();
  if (desc.length >= 100) {
    score += JOB_FIELD_WEIGHTS.description;
  } else if (desc.length >= 30) {
    score += Math.round(JOB_FIELD_WEIGHTS.description * 0.5);
    missingFields.push('Detailed Description (at least 100 characters recommended)');
  } else {
    missingFields.push('Detailed Description');
  }

  // Required Skills
  const reqSkills = Array.isArray(jobData.requiredSkills)
    ? jobData.requiredSkills
    : String(jobData.requiredSkills || '').split(/[,;\n]/).filter(Boolean);
  if (reqSkills.length > 0) {
    score += JOB_FIELD_WEIGHTS.requiredSkills;
  } else {
    missingFields.push('Required Skills');
  }

  // Preferred Skills
  const prefSkills = Array.isArray(jobData.preferredSkills)
    ? jobData.preferredSkills
    : String(jobData.preferredSkills || '').split(/[,;\n]/).filter(Boolean);
  if (prefSkills.length > 0) {
    score += JOB_FIELD_WEIGHTS.preferredSkills;
  }

  // Experience Level
  if (jobData.experienceLevel && ['Fresher', 'Entry Level', 'Mid Level', 'Senior Level'].includes(jobData.experienceLevel)) {
    score += JOB_FIELD_WEIGHTS.experienceLevel;
  } else {
    missingFields.push('Valid Experience Level');
  }

  // Location
  if (jobData.location && String(jobData.location).trim()) {
    score += JOB_FIELD_WEIGHTS.location;
  }

  // Job Type
  if (jobData.jobType && ['Full-time', 'Part-time', 'Internship', 'Contract'].includes(jobData.jobType)) {
    score += JOB_FIELD_WEIGHTS.jobType;
  } else {
    missingFields.push('Job Type');
  }

  // Salary
  if (jobData.salary && String(jobData.salary).trim() && !/not specified/i.test(jobData.salary)) {
    score += JOB_FIELD_WEIGHTS.salary;
  }

  // Application URL
  if (jobData.applicationUrl && /^https?:\/\//i.test(jobData.applicationUrl)) {
    score += JOB_FIELD_WEIGHTS.applicationUrl;
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    missingFields,
  };
}

module.exports = { calculateJobCompleteness, JOB_FIELD_WEIGHTS };
