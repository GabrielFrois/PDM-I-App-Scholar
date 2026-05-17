import axios from 'axios';
import Constants from 'expo-constants';

// Pega o IP da máquina automaticamente via Expo
// Em produção, troque por sua URL real
const localhost = Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.0.2.2';
const BASE_URL = `http://${localhost}:3000`;

export const api = axios.create({
  baseURL: BASE_URL,
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