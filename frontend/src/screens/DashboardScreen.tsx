import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, type Perfil } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Navegacao = NativeStackNavigationProp<RootStackParamList, 'Painel'>;

type ItemMenu = {
  titulo:      string;
  icone:       React.ComponentProps<typeof Ionicons>['name'];
  rota:        keyof RootStackParamList;
  descricao:   string;
  corFundo:    string;
  corDestaque: string;
};

const MENUS: Record<Perfil, ItemMenu[]> = {
  admin: [
    {
      titulo:      'Cadastro de Alunos',
      icone:       'person-add-outline',
      rota:        'CadastroAluno',
      descricao:   'Gerenciar dados dos estudantes',
      corFundo:    '#E8F0FE',
      corDestaque: '#1A73E8',
    },
    {
      titulo:      'Cadastro de Professores',
      icone:       'people-outline',
      rota:        'CadastroProfessor',
      descricao:   'Gerenciar corpo docente',
      corFundo:    '#E6F4EA',
      corDestaque: '#388E3C',
    },
    {
      titulo:      'Cadastro de Disciplinas',
      icone:       'book-outline',
      rota:        'CadastroDisciplina',
      descricao:   'Gerenciar grade curricular',
      corFundo:    '#FEF3E2',
      corDestaque: '#F57C00',
    },
    {
      titulo:      'Consultar Boletim',
      icone:       'bar-chart-outline',
      rota:        'Boletim',
      descricao:   'Visualizar notas e situação',
      corFundo:    '#FCE8E6',
      corDestaque: '#D32F2F',
    },
  ],
  professor: [
    {
      titulo:      'Lançamento de Notas',
      icone:       'create-outline',
      rota:        'LancamentoNotas',
      descricao:   'Inserir e alterar notas das suas disciplinas',
      corFundo:    '#E8F0FE',
      corDestaque: '#1A73E8',
    },
    {
      titulo:      'Meu Cadastro',
      icone:       'person-outline',
      rota:        'CadastroProfessor',
      descricao:   'Editar seus dados cadastrais',
      corFundo:    '#E6F4EA',
      corDestaque: '#388E3C',
    },
  ],
  aluno: [
    {
      titulo:      'Meu Boletim',
      icone:       'bar-chart-outline',
      rota:        'Boletim',
      descricao:   'Visualizar suas notas e situação',
      corFundo:    '#E8F0FE',
      corDestaque: '#1A73E8',
    },
    {
      titulo:      'Meu Cadastro',
      icone:       'person-outline',
      rota:        'CadastroAluno',
      descricao:   'Editar seus dados pessoais',
      corFundo:    '#E6F4EA',
      corDestaque: '#388E3C',
    },
  ],
};

export default function DashboardScreen() {
  const navegacao  = useNavigation<Navegacao>();
  const { user, logout } = useAuth();

  const perfil    = user?.perfil ?? 'aluno';
  const itensMenu = MENUS[perfil];

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.saudacao}>
          <Text style={estilos.saudacaoTexto}>Olá, {user?.nome}</Text>
          <Text style={estilos.saudacaoSubtexto}>O que deseja fazer hoje?</Text>
        </View>

        <View style={estilos.grade}>
          {itensMenu.map((item) => (
            <TouchableOpacity
              key={item.rota}
              style={[estilos.card, { backgroundColor: item.corFundo }]}
              onPress={() => navegacao.navigate(item.rota)}
              activeOpacity={0.75}
            >
              <Ionicons name={item.icone} size={28} color={item.corDestaque} />
              <Text style={[estilos.cardTitulo, { color: item.corDestaque }]}>{item.titulo}</Text>
              <Text style={estilos.cardDescricao}>{item.descricao}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={estilos.botaoSair} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={estilos.textoBotaoSair}>Sair do sistema</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: theme.colors.background },
  scroll:           { flex: 1 },
  conteudo:         { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  saudacao:         { marginBottom: theme.spacing.xl },
  saudacaoTexto:    { fontSize: theme.font.xl, fontWeight: '700', color: theme.colors.text },
  saudacaoSubtexto: { fontSize: theme.font.md, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  grade:            { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  card:             { width: '47%', borderRadius: theme.radius.md, padding: theme.spacing.md, minHeight: 130, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  cardTitulo:       { fontSize: theme.font.md, fontWeight: '700', marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs },
  cardDescricao:    { fontSize: theme.font.sm, color: theme.colors.textSecondary, lineHeight: 18 },
  botaoSair:        { marginTop: theme.spacing.xl, padding: theme.spacing.md, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: theme.spacing.sm, backgroundColor: theme.colors.surface },
  textoBotaoSair:   { fontSize: theme.font.md, color: theme.colors.textSecondary, fontWeight: '600' },
});