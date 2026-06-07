// Instância central do Axios usada por todos os services do app.
// Responsabilidades:
//   - Resolver a URL base de acordo com a plataforma
//   - Injetar o token JWT em cada requisição via interceptor de request
//   - Fazer logout automático quando o backend retornar 401

import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Detecta a URL base correta para cada ambiente:
function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    // No navegador, backend e frontend rodam na mesma máquina
    return 'http://localhost:3000';
  }
  // No app nativo (iOS/Android físico ou emulador Android)
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.0.2.2';
  return `http://${host}:3000`;
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Token mantido em memória; atualizado pelo AuthContext após login/logout
let tokenAtual: string | null = null;
// Callback registrado pelo AuthContext para executar o logout quando o token expira
let onTokenExpirado: (() => void) | null = null;

// Chamado pelo AuthContext ao fazer login (token) ou logout (null)
export function definirToken(token: string | null): void {
  tokenAtual = token;
}

// Chamado pelo AuthContext ao montar, para que o interceptor de response possa
// acionar o logout sem criar uma dependência circular entre api.ts e AuthContext
export function registrarCallbackTokenExpirado(callback: () => void): void {
  onTokenExpirado = callback;
}

// Interceptor de request: adiciona o header Authorization em toda requisição autenticada
api.interceptors.request.use((config) => {
  if (tokenAtual) config.headers.Authorization = `Bearer ${tokenAtual}`;
  return config;
});

// Interceptor de response:
//   401 = token expirado ou ausente -> dispara logout automático
//   403 = perfil sem permissão -> apenas rejeita, sem derrubar a sessão
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (onTokenExpirado) onTokenExpirado();
    }
    return Promise.reject(error);
  }
);