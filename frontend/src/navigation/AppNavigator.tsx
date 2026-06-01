// Define todas as rotas do app e controla qual pilha exibir

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

// Mapa de rotas com seus parâmetros (undefined = sem parâmetros)
// Usado para tipar as chamadas a navigation.navigate()
export type RootStackParamList = {
  Login:              undefined;
  Painel:             undefined;
  CadastroAluno:      undefined;
  CadastroProfessor:  undefined;
  CadastroDisciplina: undefined;
  Boletim:            undefined;
  LancamentoNotas:    undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Enquanto o AuthContext restaura a sessão do SecureStore, exibe um spinner
  // Evita o "flash" da tela de Login para usuários já logados
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
        // Usuário não autenticado: exibe apenas a tela de login
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Usuário autenticado: exibe o Dashboard e todas as demais telas
        // headerLeft: () => null no Painel remove o botão Voltar (não há tela anterior)
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
        </>
      )}
    </Stack.Navigator>
  );
}