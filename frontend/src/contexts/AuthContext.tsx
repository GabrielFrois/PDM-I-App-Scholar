import React, { createContext, useContext, useState } from 'react';
import { api, definirToken } from '../services/api';
import type { AxiosError } from 'axios';

export type Perfil = 'aluno' | 'professor' | 'admin';

type User = {
  email: string;
  nome: string;
  perfil: Perfil;
  matricula?: string;    // só aluno
  professorId?: number;  // só professor
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; erro?: string }>;
  logout: () => void;
};

type RespostaLogin = {
  token: string;
  usuario: {
    email: string;
    nome: string;
    perfil: Perfil;
    matricula?: string;
    professorId?: number;
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, senha: string): Promise<{ sucesso: boolean; erro?: string }> => {
    try {
      const { data } = await api.post<RespostaLogin>('/api/login', { email, senha });

      definirToken(data.token);

      setUser({
        email:       data.usuario.email,
        nome:        data.usuario.nome,
        perfil:      data.usuario.perfil,
        matricula:   data.usuario.matricula,
        professorId: data.usuario.professorId,
      });

      return { sucesso: true };
    } catch (err) {
      const error = err as AxiosError<{ erro: string }>;
      const mensagem = error.response?.data?.erro ?? 'Não foi possível conectar ao servidor.';
      return { sucesso: false, erro: mensagem };
    }
  };

  const logout = () => {
    definirToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}