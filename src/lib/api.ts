// Thin fetch wrapper. Uses same-origin /api routes (Vite proxies to Go in dev,
// Go serves the API directly in production) and sends session cookies.
import type { ChatRoom, ChatMessage, AuditAssignment } from "@/types";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export interface ChatRoomResponse {
  room: ChatRoom;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
}

export interface PostMessageResponse {
  message: ChatMessage;
}

export interface AuditAssignmentsResponse {
  assignments: AuditAssignment[];
}

export const chatApi = {
  getRoom: (slug: string) => api.get<ChatRoomResponse>(`/challenges/${slug}/chat/room`),
  getMessages: (roomId: string) => api.get<ChatMessagesResponse>(`/chat/rooms/${roomId}/messages`),
  postMessage: (roomId: string, body: string) =>
    api.post<PostMessageResponse>(`/chat/rooms/${roomId}/messages`, { body }),
} as const;

export const auditApi = {
  getAssignments: (slug: string) =>
    api.get<AuditAssignmentsResponse>(`/challenges/${slug}/audit/assignments`),
  submitDecision: (slug: string, logId: string, decision: "approve" | "reject") =>
    api.post<{ ok: boolean; assignment: { id: string; status: string } }>(
      `/challenges/${slug}/audit/${logId}/decision`,
      { decision },
    ),
} as const;
