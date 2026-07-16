// src/api/auth.ts
import axios from "axios";
import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  userId?: string;
  email: string;
  name?: string;
  role?: "User" | "Admin" | string;
}

const normalizeError = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    return new Error(message || fallback);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
};

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, "Ошибка входа");
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", data);
      return response.data;
    } catch (error) {
      throw normalizeError(error, "Ошибка регистрации");
    }
  },
};