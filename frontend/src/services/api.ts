import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.0.2.2';
  return `http://${host}:3000`;
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenAtual: string | null = null;

export function definirToken(token: string | null): void {
  tokenAtual = token;
}

api.interceptors.request.use((config) => {
  if (tokenAtual) {
    config.headers.Authorization = `Bearer ${tokenAtual}`;
  }
  return config;
});