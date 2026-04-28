import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

import BoletimScreen from '../screens/BoletimScreen';
import CadastroAlunoScreen from '../screens/CadastroAlunoScreen';
import CadastroDisciplinaScreen from '../screens/CadastroDisciplinaScreen';
import CadastroProfessorScreen from '../screens/CadastroProfessorScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  Login: undefined;
  Painel: undefined;
  CadastroAluno: undefined;
  CadastroProfessor: undefined;
  CadastroDisciplina: undefined;
  Boletim: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1A73E8' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Voltar',
        contentStyle: { backgroundColor: '#F5F7FA' },
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
        </>
      )}
    </Stack.Navigator>
  );
}