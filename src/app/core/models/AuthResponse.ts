export interface AuthResponse {
  token?: token;
  Message?: string;
}

type token = string | null | undefined;
