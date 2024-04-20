export interface AuthResponse {
  token?: token;
  message?: string;
}

type token = string | null | undefined;
