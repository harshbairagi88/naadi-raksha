import { HealthData, Message, Role, User } from '../types';

// In dev use relative URL so Vite proxy forwards /api to backend (avoids CORS). Production: set VITE_API_URL.
const env = import.meta.env;
const normalizeBase = (base: string) => base.replace(/\/+$/, '');
const API_BASE = env.DEV
  ? ''
  : normalizeBase((env as { VITE_API_URL?: string }).VITE_API_URL || window.location.origin);

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
};

const mapHealthData = (item: any): HealthData => ({
  id: item?._id ?? item?.id ?? '',
  deviceId: item?.deviceId ?? '',
  deviceType: item?.deviceType,
  firmwareVersion: item?.firmwareVersion,
  patientId: item?.patientId,
  capturedAt: item?.capturedAt,
  receivedAt: item?.receivedAt,
  metrics: item?.metrics,
  activity: item?.activity,
  battery: item?.battery,
  signal: item?.signal,
  location: item?.location,
});

export const api = {
  async createUser(name: string): Promise<User> {
    const data = await request<{ success: boolean; user: { _id: string; name: string } }>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      }
    );
    return { id: data.user._id, name: data.user.name };
  },

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const data = await request<{
      success: boolean;
      data: Array<{ _id: string; role: Role; content: string; createdAt: string }>;
    }>(`/api/messages/conversation/${conversationId}`);

    return data.data.map(item => ({
      id: item._id,
      role: item.role,
      content: item.content,
      timestamp: new Date(item.createdAt).getTime(),
    }));
  },

  async createMessage(params: {
    conversationId: string;
    userId: string;
    role: Role;
    content: string;
  }): Promise<void> {
    await request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getLatestHealthForPatient(patientId: string): Promise<HealthData | null> {
    const data = await request<{ success: boolean; count: number; data: any[] }>(
      `/api/health/patient/${patientId}?limit=1`
    );
    const item = data?.data?.[0];
    return item ? mapHealthData(item) : null;
  },
};
