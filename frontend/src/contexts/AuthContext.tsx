// Gerencia o estado de autenticação do app: login, logout e restauração de sessão

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, definirToken, registrarCallbackTokenExpirado } from '../services/api';
import type { AxiosError } from 'axios';

export type Perfil = 'aluno' | 'professor' | 'admin';

type User = {
  email:        string;
  nome:         string;
  perfil:       Perfil;
  matricula?:   string;
  professorId?: number;
};

type AuthContextType = {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:  (email: string, senha: string) => Promise<{ sucesso: boolean; erro?: string }>;
  logout: () => void;
};

type RespostaLogin = {
  token:   string;
  usuario: { email: string; nome: string; perfil: Perfil; matricula?: string; professorId?: number };
};

const STORAGE_KEY_TOKEN   = 'app_scholar_token';
const STORAGE_KEY_USUARIO = 'app_scholar_usuario';

// Usa localStorage na web, SecureStore no dispositivo
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  const logout = async () => {
    await Promise.all([
      storage.deleteItem(STORAGE_KEY_TOKEN),
      storage.deleteItem(STORAGE_KEY_USUARIO),
    ]);
    definirToken(null);
    setUser(null);
  };

  useEffect(() => {
    registrarCallbackTokenExpirado(logout);

    async function restaurarSessao() {
      try {
        const [token, usuarioJson] = await Promise.all([
          storage.getItem(STORAGE_KEY_TOKEN),
          storage.getItem(STORAGE_KEY_USUARIO),
        ]);
        if (token && usuarioJson) {
          definirToken(token);
          setUser(JSON.parse(usuarioJson) as User);
        }
      } catch {
        // Token corrompido: ignora e exige novo login
      } finally {
        setLoading(false);
      }
    }

    restaurarSessao();
  }, []);

  const login = async (email: string, senha: string): Promise<{ sucesso: boolean; erro?: string }> => {
    try {
      const { data } = await api.post<RespostaLogin>('/api/login', { email, senha });

      const usuario: User = {
        email:       data.usuario.email,
        nome:        data.usuario.nome,
        perfil:      data.usuario.perfil,
        matricula:   data.usuario.matricula,
        professorId: data.usuario.professorId,
      };

      await Promise.all([
        storage.setItem(STORAGE_KEY_TOKEN,   data.token),
        storage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuario)),
      ]);

      definirToken(data.token);
      setUser(usuario);
      return { sucesso: true };
    } catch (err) {
      const error    = err as AxiosError<{ erro: string }>;
      const mensagem = error.response?.data?.erro ?? 'Não foi possível conectar ao servidor.';
      return { sucesso: false, erro: mensagem };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}