/**
 * Vibey Hub API Service
 * Connects to the Express + Supabase backend at the configured base URL.
 * All data uses snake_case (matching Supabase column names).
 */

import { supabase } from "./supabase";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "http://localhost:4000";

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "founder" | "team_member" | "intern" | "client";
  skills: string[];
  total_points: number;
  created_at: string;
  level: string;
}

export const usersApi = {
  list: (params?: { email?: string }) => {
    const qs = params?.email ? `?email=${encodeURIComponent(params.email)}` : "";
    return request<User[]>(`/api/users${qs}`);
  },
  get: (id: string) => request<User>(`/api/users/${id}`),
  create: (body: { id?: string; name: string; email: string; role?: string }) =>
    request<User>("/api/users", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ role: string; skills: string[]; name: string }>) =>
    request<User>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  project_id: string | null;
  assigned_user: string | null;
  title: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  points: number | null;
  deadline: string | null;
  created_at: string;
}

export const tasksApi = {
  list: (params?: { assigned_user?: string }) => {
    const qs = params?.assigned_user ? `?assigned_user=${params.assigned_user}` : "";
    return request<Task[]>(`/api/tasks${qs}`);
  },
  create: (body: { title: string; assigned_user?: string; priority?: string; deadline?: string; points?: number; project_id?: string }) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ status: string; priority: string; deadline: string }>) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Contributions ───────────────────────────────────────────────────────────

export interface Contribution {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string | null;
  points: number;
  evidence_url: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  created_at: string;
}

export const contributionsApi = {
  list: (params?: { user_id?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.user_id) qs.set("user_id", params.user_id);
    if (params?.status) qs.set("status", params.status);
    const qsStr = qs.toString();
    return request<Contribution[]>(`/api/contributions${qsStr ? `?${qsStr}` : ""}`);
  },
  create: (body: { user_id: string; title: string; category: string; description?: string; evidence_url?: string; difficulty: string }) =>
    request<Contribution>("/api/contributions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { status: string; reviewer_note?: string }) =>
    request<Contribution>(`/api/contributions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Projects ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  client_name: string;
  project_type: string | null;
  budget: number | null;
  status: "lead" | "requirement" | "design" | "development" | "testing" | "deployment" | "completed";
  start_date: string | null;
  deadline: string | null;
  created_by: string | null;
  created_at: string;
  share_token: string;
}

export const projectsApi = {
  list: () => request<Project[]>("/api/projects"),
  get: (id: string) => request<Project>(`/api/projects/${id}`),
  create: (body: Partial<Omit<Project, "id" | "created_at">>) =>
    request<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Milestones ──────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  status: "not_started" | "in_progress" | "completed";
  deadline: string | null;
}

export const milestonesApi = {
  list: (projectId: string) => request<Milestone[]>(`/api/projects/${projectId}/milestones`),
  create: (projectId: string, body: { name: string; deadline?: string }) =>
    request<Milestone>(`/api/projects/${projectId}/milestones`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ status: string; deadline: string }>) =>
    request<Milestone>(`/api/milestones/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Difficulty Settings ─────────────────────────────────────────────────────

export interface DifficultySetting {
  id: string;
  difficulty: "easy" | "medium" | "hard" | "exceptional";
  points: number;
}

export const difficultySettingsApi = {
  list: () => request<DifficultySetting[]>("/api/difficulty-settings"),
  update: (id: string, body: { points: number }) =>
    request<DifficultySetting>(`/api/difficulty-settings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Incentives ──────────────────────────────────────────────────────────────

export interface Incentive {
  id: string;
  user_id: string;
  month: string;
  points: number;
  recommended_reward: string | null;
  founder_decision: "approved" | "not_this_month" | "custom" | null;
  founder_note: string | null;
}

export const incentivesApi = {
  list: (params?: { month?: string; user_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.month) qs.set("month", params.month);
    if (params?.user_id) qs.set("user_id", params.user_id);
    const qsStr = qs.toString();
    return request<Incentive[]>(`/api/incentives${qsStr ? `?${qsStr}` : ""}`);
  },
  create: (body: Partial<Omit<Incentive, "id">>) =>
    request<Incentive>("/api/incentives", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Incentive>) =>
    request<Incentive>(`/api/incentives/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ─── Contribution Categories ─────────────────────────────────────────────────

export interface ContributionCategory {
  id: string;
  name: string;
}

export const categoriesApi = {
  list: () => request<ContributionCategory[]>("/api/categories"),
};

// ─── Notifications ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: (userId: string) => request<AppNotification[]>(`/api/notifications?user_id=${userId}`),
  markRead: (id: string) => request<AppNotification>(`/api/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ is_read: true }) }),
  markAllRead: (userId: string) => request<{ updated: number }>(`/api/notifications/mark-all-read`, { method: "PATCH", body: JSON.stringify({ user_id: userId }) }),
};

// ─── Level calculation (client-side, matching backend) ───────────────────────

export function calculateLevel(totalPoints: number): string {
  if (totalPoints >= 300) return "Top Contributor";
  if (totalPoints >= 150) return "Core Contributor";
  if (totalPoints >= 50) return "Contributor";
  return "New Contributor";
}

// ─── Role labels ─────────────────────────────────────────────────────────────

export const roleLabels: Record<string, string> = {
  founder: "Founder",
  team_member: "Team Member",
  intern: "Intern",
  client: "Client",
};

// ─── Client Portal (public, no auth) ─────────────────────────────────────────

export interface PortalData {
  project_name: string;
  client_name: string;
  status: Project["status"];
  progress_percent: number;
  completed_items: string[];
  next_item: string | null;
}

export const portalApi = {
  get: async (token: string): Promise<PortalData> => {
    const res = await fetch(`${API_BASE}/api/portal/${token}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<PortalData>;
  },
};

// ─── AI Assistant ─────────────────────────────────────────────────────────

export interface AiSummary {
  user_id: string;
  name: string;
  month: string;
  month_points: number;
  total_points: number;
  level: string;
  contribution_count: number;
  summary: string;
  incentive_suggestion: "approved" | "not_this_month" | "custom" | null;
}

export const aiApi = {
  getSummary: (userId: string, month: string) =>
    request<AiSummary>(`/api/ai/summary/${userId}?month=${month}`),
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const aiChatApi = {
  send: (message: string, history: ChatMessage[]) =>
    request<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
