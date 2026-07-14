// src/api/client.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5253/api"; // замени на реальный URL, когда будет готов

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для добавления токена в заголовки
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});