export interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export type LoginErrors = Partial<Record<'email' | 'password', string>>;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface SessionResponse {
  token: string;
  user: AuthUser;
}
