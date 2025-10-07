export interface BackendStatus {
  code: number;
  description: string;
  category: number;
}
export interface AuthResponse2<T = unknown> {
  status: BackendStatus;
  message: string | null;
  data: T;
}

type token = string | null | undefined;
export interface tokenpayload {
  aud?: string;
  email?: string;
  exp?: number;
  iss?: string;
  name?: nombre;
  http?: string;
  nameid?: number;
}
type nombre = string | undefined | null;
export interface tokenpayload2 {
  userId: number;
  nombre: string;
  email: string;
  role: string;
  expiracion: Date;
  tiempoRestante: number;
}
export interface refreshToken {
  token: string;
  refreshToken: string;
}

export interface LoginData {
  token: string;
  refreshToken: string;
}
