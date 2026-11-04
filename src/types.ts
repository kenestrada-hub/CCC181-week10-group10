export interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export type LoginErrors = Partial<Record<'email' | 'password', string>>;
