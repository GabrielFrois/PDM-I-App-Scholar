import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.0.2.2';
  return `http://${host}:3000`;
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let tokenAtual: string | null = null;
let onTokenExpirado: (() => void) | null = null;

export function definirToken(token: string | null): void {
  tokenAtual = token;
}

export function registrarCallbackTokenExpirado(callback: () => void): void {
  onTokenExpirado = callback;
}

api.interceptors.request.use((config) => {
  if (tokenAtual) config.headers.Authorization = `Bearer ${tokenAtual}`;
  return config;
});

// Logout automático ao receber 401/403
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (onTokenExpirado) onTokenExpirado();
    }
    return Promise.reject(error);
  }
);