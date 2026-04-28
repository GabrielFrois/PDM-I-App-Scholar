import React, { createContext, useContext, useState } from 'react';

type User = {
  email: string;
  nome: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dados simulados de usuário válido
const MOCK_USER = {
  email: 'gabriel@fatec.sp.gov.br',
  senha: '123456',
  nome: 'Gabriel',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Simula autenticação
  const login = (email: string, senha: string): boolean => {
    if (email === MOCK_USER.email && senha === MOCK_USER.senha) {
      setUser({ email: MOCK_USER.email, nome: MOCK_USER.nome });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto facilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}