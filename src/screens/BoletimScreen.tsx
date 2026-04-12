import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';

type Nota = {
  id: number;
  disciplina: string;
  nota1: number;
  nota2: number;
  media: number;
  situacao: 'Aprovado' | 'Exame' | 'Reprovado';
};

const BOLETIM_SIMULADO: Nota[] = [
  { id: 1, disciplina: 'Programação Web', nota1: 8.5, nota2: 9.0, media: 8.75, situacao: 'Aprovado' },
  { id: 2, disciplina: 'Banco de Dados', nota1: 7.0, nota2: 6.5, media: 6.75, situacao: 'Exame' },
  { id: 3, disciplina: 'Dispositivos Móveis', nota1: 9.5, nota2: 10.0, media: 9.75, situacao: 'Aprovado' },
  { id: 4, disciplina: 'Internet das Coisas', nota1: 4.0, nota2: 5.5, media: 4.75, situacao: 'Reprovado' },
  { id: 5, disciplina: 'Estatística', nota1: 10.0, nota2: 9.0, media: 9.5, situacao: 'Aprovado' },
];

function corSituacao(situacao: Nota['situacao']) {
  switch (situacao) {
    case 'Aprovado': return { fundo: '#E6F4EA', texto: theme.colors.success };
    case 'Exame': return { fundo: '#FEF3E2', texto: theme.colors.warning };
    case 'Reprovado': return { fundo: '#FCE8E6', texto: theme.colors.danger };
  }
}

export default function BoletimScreen() {
  const { user } = useAuth();
  const [boletim, setBoletim] = useState<Nota[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBoletim(BOLETIM_SIMULADO);
      setCarregando(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const aprovadas = boletim.filter((n) => n.situacao === 'Aprovado').length;
  const reprovadas = boletim.filter((n) => n.situacao === 'Reprovado').length;
  const exame = boletim.filter((n) => n.situacao === 'Exame').length;

  if (carregando) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.containerCarregando}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={estilos.textoCarregando}>Carregando boletim...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >

        <View style={estilos.cabecalho}>
          <Text style={estilos.cabecalhoTitulo}>Boletim Acadêmico</Text>
          <Text style={estilos.cabecalhoNome}>{user?.nome}</Text>
          <Text style={estilos.cabecalhoSemestre}>4º Semestre / 2026</Text>
        </View>

        <View style={estilos.resumo}>
          <View style={[estilos.resumoItem, { backgroundColor: '#E6F4EA' }]}>
            <Text style={[estilos.resumoNumero, { color: theme.colors.success }]}>{aprovadas}</Text>
            <Text style={estilos.resumoRotulo}>Aprovado</Text>
          </View>
          <View style={[estilos.resumoItem, { backgroundColor: '#FEF3E2' }]}>
            <Text style={[estilos.resumoNumero, { color: theme.colors.warning }]}>{exame}</Text>
            <Text style={estilos.resumoRotulo}>Exame</Text>
          </View>
          <View style={[estilos.resumoItem, { backgroundColor: '#FCE8E6' }]}>
            <Text style={[estilos.resumoNumero, { color: theme.colors.danger }]}>{reprovadas}</Text>
            <Text style={estilos.resumoRotulo}>Reprovado</Text>
          </View>
        </View>

        <View style={estilos.cabecalhoTabela}>
          <Text style={[estilos.coluna, estilos.colunaDisciplina, estilos.cabecalhoTabelaTexto]}>Disciplina</Text>
          <Text style={[estilos.coluna, estilos.colunaNota, estilos.cabecalhoTabelaTexto]}>N1</Text>
          <Text style={[estilos.coluna, estilos.colunaNota, estilos.cabecalhoTabelaTexto]}>N2</Text>
          <Text style={[estilos.coluna, estilos.colunaNota, estilos.cabecalhoTabelaTexto]}>Méd.</Text>
          <Text style={[estilos.coluna, estilos.colunaSituacao, estilos.cabecalhoTabelaTexto]}>Situação</Text>
        </View>

        {boletim.map((item, index) => {
          const cor = corSituacao(item.situacao);
          return (
            <View
              key={item.id}
              style={[estilos.linha, index % 2 === 0 ? estilos.linhaPar : estilos.linhaImpar]}
            >
              <Text style={[estilos.coluna, estilos.colunaDisciplina, estilos.celula]} numberOfLines={2}>
                {item.disciplina}
              </Text>
              <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula]}>
                {item.nota1.toFixed(1)}
              </Text>
              <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula]}>
                {item.nota2.toFixed(1)}
              </Text>
              <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula, estilos.media]}>
                {item.media.toFixed(1)}
              </Text>
              <View style={[estilos.coluna, estilos.colunaSituacao, estilos.colunaAlinhada]}>
                <View style={[estilos.badge, { backgroundColor: cor.fundo }]}>
                  <Text style={[estilos.badgeTexto, { color: cor.texto }]}>{item.situacao}</Text>
                </View>
              </View>
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  conteudo: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  containerCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  textoCarregando: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  cabecalho: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cabecalhoTitulo: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  cabecalhoNome: {
    fontSize: theme.font.md,
    color: 'rgba(255,255,255,0.9)',
    marginTop: theme.spacing.xs,
  },
  cabecalhoSemestre: {
    fontSize: theme.font.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: theme.spacing.xs,
  },
  resumo: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  resumoItem: {
    flex: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  resumoNumero: {
    fontSize: theme.font.xl,
    fontWeight: '800',
  },
  resumoRotulo: {
    fontSize: theme.font.sm - 1,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  cabecalhoTabela: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  cabecalhoTabelaTexto: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: theme.font.sm,
  },
  linha: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    minHeight: 52,
  },
  linhaPar: { backgroundColor: theme.colors.surface },
  linhaImpar: { backgroundColor: '#F8FAFF' },
  coluna: { paddingHorizontal: 2 },
  colunaDisciplina: { flex: 2.5 },
  colunaNota: { flex: 1, textAlign: 'center' },
  colunaSituacao: { flex: 2 },
  colunaAlinhada: { alignItems: 'center' },
  celula: {
    fontSize: theme.font.sm,
    color: theme.colors.text,
    textAlign: 'center',
  },
  media: { fontWeight: '700' },
  badge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});