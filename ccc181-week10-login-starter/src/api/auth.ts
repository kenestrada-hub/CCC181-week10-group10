import type { AuthUser, SessionResponse } from '../types';

export const TOKEN_KEY = 'campusconnect.token';
export const NETWORK_MESSAGE = 'Cannot reach the server. Please try again.';
const SERVER_MESSAGE = 'Something went wrong on our side. Please try again later.';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function isUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return Number.isInteger(user.id) && typeof user.name === 'string'
    && user.name.length > 0 && typeof user.email === 'string' && user.email.length > 0;
}

// A factory lets tests exercise the HTTP boundary without installing a test library.
export function createAuthApi(baseUrl: string | undefined, transport: typeof fetch = fetch) {
  async function request(path: string, options: RequestInit): Promise<unknown> {
    if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
      throw new ApiError(0, NETWORK_MESSAGE);
    }
    let response: Response;
    try {
      response = await transport(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...options, signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ApiError(0, NETWORK_MESSAGE);
    }
    if (!response.ok || response.status !== 200) {
      if (response.status === 400 || response.status === 401) {
        throw new ApiError(response.status, 'Wrong email or password.');
      }
      throw new ApiError(response.status, SERVER_MESSAGE);
    }
    try {
      return await response.json();
    } catch {
      throw new ApiError(response.status, SERVER_MESSAGE);
    }
  }

  return {
    async login(email: string, password: string): Promise<SessionResponse> {
      const payload = await request('/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = payload as Partial<SessionResponse> | null;
      if (!data || typeof data.token !== 'string' || !data.token || !isUser(data.user)) {
        throw new ApiError(200, SERVER_MESSAGE);
      }
      return { token: data.token, user: { id: data.user.id, name: data.user.name, email: data.user.email } };
    },
    async getMe(token: string): Promise<AuthUser> {
      const payload = await request('/users/me', {
        method: 'GET', headers: { Authorization: `Bearer ${token}` },
      });
      if (!isUser(payload)) throw new ApiError(200, SERVER_MESSAGE);
      return { id: payload.id, name: payload.name, email: payload.email };
    },
  };
}

export function login(email: string, password: string): Promise<SessionResponse> {
  return createAuthApi(import.meta.env.VITE_API_URL).login(email, password);
}

export function getMe(token: string): Promise<AuthUser> {
  return createAuthApi(import.meta.env.VITE_API_URL).getMe(token);
}
