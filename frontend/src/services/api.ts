// Instância central do axios usada por todos os services
// Configura baseURL dinâmica e interceptors de token e logout automático

import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Determina o endereço do backend conforme o ambiente de execução
function getBaseUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.0.2.2';
  return `http://${host}:3000`;
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000, // cancela a requisição se não responder em 10s
  headers: { 'Content-Type': 'application/json' },
});

// Token armazenado em memória (atualizado pelo AuthContext após login/logout)
let tokenAtual: string | null = null;

// Callback chamado automaticamente quando o backend retorna 401 ou 403
let onTokenExpirado: (() => void) | null = null;

// Atualiza o token em memória (chamado pelo AuthContext)
export function definirToken(token: string | null): void {
  tokenAtual = token;
}

// Registra a função de logout para ser acionada pelo interceptor de resposta
export function registrarCallbackTokenExpirado(callback: () => void): void {
  onTokenExpirado = callback;
}

// Interceptor de requisição: injeta o token JWT no header Authorization antes de enviar
api.interceptors.request.use((config) => {
  if (tokenAtual) config.headers.Authorization = `Bearer ${tokenAtual}`;
  return config;
});

// Interceptor de resposta: faz logout automático se o backend rejeitar o token (401/403)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (onTokenExpirado) onTokenExpirado();
    }
    return Promise.reject(error);
  }
);