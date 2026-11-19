const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
  };

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Ensures session cookie is sent with cross-origin or proxied requests
  });

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const rawText = await response.text();
    let cleanMessage = rawText;
    const preMatch = rawText.match(/<pre>([\s\S]*?)<\/pre>/i);
    if (preMatch && preMatch[1]) {
      cleanMessage = preMatch[1].trim();
    } else if (rawText.includes('<html') || rawText.includes('<!DOCTYPE')) {
      cleanMessage = `Server error (${response.status}): ${response.statusText || 'Endpoint response error'}`;
    }
    data = { success: response.ok, message: cleanMessage };
  }

  if (!response.ok) {
    let errorMsg = data?.message || `Request failed with status ${response.status}`;
    if (errorMsg.includes('Cannot POST') || errorMsg.includes('Cannot GET')) {
      errorMsg = `${errorMsg}. (Backend server ko restart karein taaki new API routes load ho jayein).`;
    }
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// ==========================================
// Specialized API Services
// ==========================================

export const authApi = {
  signup: (payload: { fullName: string; email: string; password: string; role?: string }) =>
    api.post('/auth/signup', payload),
  login: (payload: { username?: string; email?: string; password: string }) =>
    api.post('/auth/login', {
      username: payload.email || payload.username,
      password: payload.password,
    }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (payload: { email: string }) =>
    api.post('/auth/forgot-password', payload),
  verifyResetToken: (token: string) =>
    api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`),
  resetPassword: (payload: { token: string; newPassword: string; confirmPassword?: string }) =>
    api.post('/auth/reset-password', payload),
};

export const profileApi = {
  getProfile: () => api.get('/profile'),
  saveProfile: (data: any) => api.post('/profile', data),
};

export const resumeApi = {
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/upload', formData);
  },
  getAnalysis: (id?: string) => api.get(`/resume/analysis${id ? `?id=${encodeURIComponent(id)}` : ''}`),
  getResumesList: () => api.get('/resume/list'),
  getFileUrl: (id?: string) => `${API_BASE_URL}/resume/file${id ? `?id=${encodeURIComponent(id)}` : ''}`,
  getDownloadUrl: (id?: string) => `${API_BASE_URL}/resume/download${id ? `?id=${encodeURIComponent(id)}` : ''}`,
  deleteResume: (id: string) => api.delete(`/resume/${encodeURIComponent(id)}`),
  cleanOldResumes: () => api.post('/resume/clean-old'),
};

export const builderApi = {
  getResume: (params?: { resumeId?: string; id?: string }) => {
    const targetId = params?.resumeId || params?.id;
    const query = targetId ? `?resumeId=${encodeURIComponent(targetId)}` : '';
    return api.get(`/resume-builder${query}`);
  },
  saveResume: (data: any) => api.post('/resume-builder', data),
  generateAIResume: (data: any) => api.post('/resume-builder/ai-generate', data),
  improveSection: (data: { section: string; text: string; technologies?: string }) =>
    api.post('/resume-builder/ai-improve', data),
  uploadPhoto: (file: File, resumeId?: string) => {
    const formData = new FormData();
    formData.append('photo', file);
    const query = resumeId ? `?resumeId=${encodeURIComponent(resumeId)}` : '';
    return api.post(`/resume-builder/photo${query}`, formData);
  },
  deletePhoto: (resumeId?: string) => {
    const query = resumeId ? `?resumeId=${encodeURIComponent(resumeId)}` : '';
    return api.delete(`/resume-builder/photo${query}`);
  },
  optimizeOnePage: (data: { summary?: string; experience?: any[]; projects?: any[]; customSections?: any[]; skills?: string[]; targetRole?: string }) =>
    api.post('/resume-builder/optimize-one-page', data),
  tailorResume: (data: {
    jobId?: string;
    title?: string;
    company?: string;
    description?: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    resumeData?: any;
  }) => api.post('/resume-builder/ai-tailor', data),
};

export const jobsApi = {
  getRecommended: () => api.get('/jobs/recommended'),
  getMyApplications: () => api.get('/jobs/my-applications'),
  applyToJob: (id: string, coverNote?: string, extraData?: Record<string, any>) =>
    api.post(`/jobs/${id}/apply`, { coverNote, ...(extraData || {}) }),
  withdrawApplication: (id: string) => api.delete(`/jobs/applications/${id}/withdraw`),
  getPublicJobs: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/jobs/public${query}`);
  },
  getJobById: (id: string) => api.get(`/jobs/${id}`),
};

export const recruiterApi = {
  getMyJobs: () => api.get('/recruiter/jobs'),
  createJob: (jobData: any) => api.post('/recruiter/jobs', jobData),
  editJob: (id: string, jobData: any) => api.put(`/recruiter/jobs/${id}`, jobData),
  auditPreview: (jobData: any) => api.post('/recruiter/jobs/audit-preview', jobData),
  toggleStatus: (id: string) => api.patch(`/recruiter/jobs/${id}/toggle`),
  deleteJob: (id: string) => api.delete(`/recruiter/jobs/${id}`),
  getApplications: (jobId: string) => api.get(`/recruiter/jobs/${jobId}/applications`),
  updateApplicationStatus: (appId: string, status: string, feedback?: string) =>
    api.patch(`/recruiter/applications/${appId}/status`, { status, feedback }),
  getCandidateProfile: (appId: string) =>
    api.get(`/recruiter/applications/${appId}/candidate-profile`),
};

export const coursesApi = {
  getCourses: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/courses${query}`);
  },
  getRecommendations: (skills?: string[], careerGoal?: string) => {
    const queryParts = [];
    if (skills && skills.length > 0) queryParts.push(`skills=${encodeURIComponent(skills.join(','))}`);
    if (careerGoal) queryParts.push(`careerGoal=${encodeURIComponent(careerGoal)}`);
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return api.get(`/courses/recommendations${query}`);
  },
};

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/users${query}`);
  },
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: string, isActive: boolean) => api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getRecruiters: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/recruiters${query}`);
  },
  getJobs: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/jobs${query}`);
  },
  updateJobStatus: (id: string, data: { isActive?: boolean; trustStatus?: string; trustStatusLabel?: string }) =>
    api.patch(`/admin/jobs/${id}/status`, data),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),
  getResumes: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/resumes${query}`);
  },
  getApplications: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/applications${query}`);
  },
  getActivityLogs: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/logs${query}`);
  },
  getSystemHealth: () => api.get('/admin/system-health'),
};

export const feedbackApi = {
  submit: (data: {
    category: string;
    rating: number;
    subject: string;
    message: string;
    pageUrl?: string;
  }) => api.post('/feedback', data),
  getMyFeedback: () => api.get('/feedback/my'),
  getAdminFeedback: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/admin/feedback${query}`);
  },
  updateStatus: (id: string, data: { status?: string; adminNote?: string }) =>
    api.patch(`/admin/feedback/${id}`, data),
  deleteFeedback: (id: string) => api.delete(`/admin/feedback/${id}`),
};
