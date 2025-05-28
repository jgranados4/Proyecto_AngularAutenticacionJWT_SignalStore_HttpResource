export interface AuthResponse {
  token?: token;
  message?: string;
}
export interface AuthResponse2 {
  status: {
    code: number;
    description: string;
    category: number;
  };
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
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
  id: number;
  nombre: string;
  email: string;
  rol: string;
  expiracion: Date;
  tiempoRestante: number;
}
