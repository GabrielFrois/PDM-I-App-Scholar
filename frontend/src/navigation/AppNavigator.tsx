// Usa um único Stack Navigator com duas "zonas":
//   - Não autenticado: apenas a tela de Login (sem header)
//   - Autenticado: todas as telas protegidas (Painel, Cadastros, Boletim, Notas)

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import BoletimScreen            from '../screens/BoletimScreen';
import CadastroAlunoScreen      from '../screens/CadastroAlunoScreen';
import CadastroDisciplinaScreen from '../screens/CadastroDisciplinaScreen';
import CadastroProfessorScreen  from '../screens/CadastroProfessorScreen';
import DashboardScreen          from '../screens/DashboardScreen';
import LancamentoNotasScreen    from '../screens/LancamentoNotasScreen';
import LoginScreen              from '../screens/LoginScreen';
import CadastroCursoScreen from '../screens/CadastroCursoScreen';

export type RootStackParamList = {
  Login:              undefined;
  Painel:             undefined;
  CadastroAluno:      undefined;
  CadastroProfessor:  undefined;
  CadastroDisciplina: undefined;
  Boletim:            undefined;
  LancamentoNotas:    undefined;
  CadastroCurso: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Enquanto o AuthContext tenta restaurar o token do SecureStore,
  // exibe um spinner para evitar o flash da tela de Login antes do redirecionamento
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: '#1A73E8' },
        headerTintColor:  '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle:  'Voltar',
        contentStyle:     { backgroundColor: '#F5F7FA' },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Painel"
            component={DashboardScreen}
            options={{ title: 'App Scholar', headerLeft: () => null }}
          />
          <Stack.Screen
            name="CadastroAluno"
            component={CadastroAlunoScreen}
            options={{ title: 'Cadastro de Aluno' }}
          />
          <Stack.Screen
            name="CadastroProfessor"
            component={CadastroProfessorScreen}
            options={{ title: 'Cadastro de Professor' }}
          />
          <Stack.Screen
            name="CadastroDisciplina"
            component={CadastroDisciplinaScreen}
            options={{ title: 'Cadastro de Disciplina' }}
          />
          <Stack.Screen
            name="Boletim"
            component={BoletimScreen}
            options={{ title: 'Boletim Acadêmico' }}
          />
          <Stack.Screen
            name="LancamentoNotas"
            component={LancamentoNotasScreen}
            options={{ title: 'Lançamento de Notas' }}
          />
          <Stack.Screen
            name="CadastroCurso"
            component={CadastroCursoScreen}
            options={{ title: 'Cadastro de Cursos' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}