import { ConversationHistoryItem, HealthData, Message, Role, User } from '../types';

// In dev use relative URL so Vite proxy forwards /api to backend (avoids CORS). Production: set VITE_API_URL.
const env = import.meta.env as { DEV: boolean; VITE_API_URL?: string };
const normalizeBase = (base: string) => base.replace(/\/+$/, '');
const getApiBases = (): string[] => {
  if (env.DEV) {
    return [''];
  }

  const candidates = [
    normalizeBase((env.VITE_API_URL || '').trim()),
    normalizeBase(window.location.origin),
    '',
  ];

  return [...new Set(candidates.filter(base => base.length > 0 || base === ''))];
};

const API_BASES = getApiBases();

class ApiHttpError extends Error {
  status: number;
  url: string;

  constructor(status: number, url: string, message: string) {
    super(message || `Request failed: ${status}`);
    this.name = 'ApiHttpError';
    this.status = status;
    this.url = url;
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  const canRetryAcrossBases = method === 'GET' || method === 'HEAD';
  const basesToTry = canRetryAcrossBases ? API_BASES : [API_BASES[0]];
  let lastError: unknown;

  for (const base of basesToTry) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new ApiHttpError(res.status, url, text || `Request failed: ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      const isHttpError = error instanceof ApiHttpError;
      if (isHttpError || !canRetryAcrossBases) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
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

  async getUserConversationHistory(userId: string): Promise<ConversationHistoryItem[]> {
    const paths = [
      `/api/messages/user/${userId}/history`,
      `/api/messages/history/user/${userId}`,
      `/api/messages/history/${userId}`,
    ];
    const errors: unknown[] = [];
    let data:
      | {
          success: boolean;
          data: Array<{
            conversationId: string;
            latestContent: string;
            latestRole: Role;
            latestCreatedAt: string;
            firstCreatedAt: string;
          }>;
        }
      | null = null;

    for (const path of paths) {
      try {
        data = await request<{
          success: boolean;
          data: Array<{
            conversationId: string;
            latestContent: string;
            latestRole: Role;
            latestCreatedAt: string;
            firstCreatedAt: string;
          }>;
        }>(path);
        break;
      } catch (error) {
        errors.push(error);
        if (!(error instanceof ApiHttpError) || error.status !== 404) {
          throw error;
        }
      }
    }

    if (!data) {
      const hasDnsStyleFailure = errors.some(
        error => error instanceof TypeError && /Failed to fetch|Load failed/i.test(error.message)
      );
      if (hasDnsStyleFailure) {
        throw errors[0] as Error;
      }
      return [];
    }

    return (data.data || []).map(item => ({
      conversationId: item.conversationId,
      latestContent: item.latestContent,
      latestRole: item.latestRole,
      latestCreatedAt: item.latestCreatedAt,
      firstCreatedAt: item.firstCreatedAt,
    }));
  },

  async deleteConversationHistory(conversationId: string, userId: string): Promise<void> {
    await request(`/api/messages/conversation/${conversationId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
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
