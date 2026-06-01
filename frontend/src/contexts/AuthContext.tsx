// Gerencia o estado de autenticação do app: login, logout e restauração de sessão

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, definirToken, registrarCallbackTokenExpirado } from '../services/api';
import type { AxiosError } from 'axios';

export type Perfil = 'aluno' | 'professor' | 'admin';

// Dados do usuário logado que ficam em memória durante a sessão
type User = {
  email:        string;
  nome:         string;
  perfil:       Perfil;
  matricula?:   string;  // só existe para alunos
  professorId?: number;  // só existe para professores
};

// Forma do contexto exposto para os componentes via useAuth()
type AuthContextType = {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:  (email: string, senha: string) => Promise<{ sucesso: boolean; erro?: string }>;
  logout: () => void;
};

// Formato da resposta do endpoint POST /api/login
type RespostaLogin = {
  token:   string;
  usuario: { email: string; nome: string; perfil: Perfil; matricula?: string; professorId?: number };
};

// Chaves usadas no SecureStore (armazenamento seguro do dispositivo)
const STORAGE_KEY_TOKEN   = 'app_scholar_token';
const STORAGE_KEY_USUARIO = 'app_scholar_usuario';

// Cria o contexto com undefined como valor padrão (será validado no hook useAuth)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente que envolve o app inteiro com o contexto de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true); // true enquanto restaura sessão do storage

  // Remove token e dados do storage, limpa o axios e reseta o estado
  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEY_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEY_USUARIO),
    ]);
    definirToken(null);
    setUser(null);
  };

  useEffect(() => {
    // Registra o logout automático para quando o axios receber 401/403
    registrarCallbackTokenExpirado(logout);

    // Ao abrir o app, tenta restaurar a sessão salva no SecureStore
    async function restaurarSessao() {
      try {
        const [token, usuarioJson] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEY_TOKEN),
          SecureStore.getItemAsync(STORAGE_KEY_USUARIO),
        ]);
        if (token && usuarioJson) {
          // Injeta o token no axios e restaura o usuário em memória
          definirToken(token);
          setUser(JSON.parse(usuarioJson) as User);
        }
      } catch {
        // Se o token estiver corrompido, ignora e exige novo login
      } finally {
        setLoading(false);
      }
    }

    restaurarSessao();
  }, []);

  // Chama o backend, salva o token/usuario no SecureStore e atualiza o estado
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

      // Persiste token e dados no SecureStore (criptografado no dispositivo)
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEY_TOKEN,   data.token),
        SecureStore.setItemAsync(STORAGE_KEY_USUARIO, JSON.stringify(usuario)),
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

// Hook personalizado: lança erro se usado fora do AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}