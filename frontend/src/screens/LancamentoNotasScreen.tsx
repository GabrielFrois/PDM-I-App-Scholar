import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { notasService, type NotaTurma } from '../services/notasService';
import { theme } from '../styles/theme';

type Disciplina = {
  id:      number;
  nome:    string;
  curso:   string;
  semestre: string;
};

type EdicaoNotas = {
  nota1: string;
  nota2: string;
};

export default function LancamentoNotasScreen() {
  const { user } = useAuth();

  const [disciplinas,          setDisciplinas]          = useState<Disciplina[]>([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
  const [notas,                setNotas]                = useState<NotaTurma[]>([]);
  const [edicao,               setEdicao]               = useState<Record<number, EdicaoNotas>>({});
  const [salvando,             setSalvando]             = useState<Record<number, boolean>>({});
  const [carregandoDisc,       setCarregandoDisc]       = useState(false);
  const [carregandoNotas,      setCarregandoNotas]      = useState(false);

  // Carrega disciplinas do professor ao montar
  useEffect(() => {
    async function carregarDisciplinas() {
      setCarregandoDisc(true);
      try {
        const { data } = await api.get<Disciplina[]>('/api/disciplinas');
        setDisciplinas(data);
      } catch (err: any) {
        Alert.alert('Erro', err.message || 'Não foi possível carregar as disciplinas.');
      } finally {
        setCarregandoDisc(false);
      }
    }
    carregarDisciplinas();
  }, []);

  const selecionarDisciplina = useCallback(async (disc: Disciplina) => {
    setDisciplinaSelecionada(disc);
    setNotas([]);
    setEdicao({});
    setCarregandoNotas(true);

    try {
      const resp = await notasService.listarPorDisciplina(disc.id);
      setNotas(resp.notas);

      // Pré-popula o estado de edição com as notas existentes
      const estadoInicial: Record<number, EdicaoNotas> = {};
      for (const n of resp.notas) {
        estadoInicial[n.aluno_id] = {
          nota1: n.nota1 != null ? String(n.nota1) : '',
          nota2: n.nota2 != null ? String(n.nota2) : '',
        };
      }
      setEdicao(estadoInicial);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível carregar as notas.');
    } finally {
      setCarregandoNotas(false);
    }
  }, []);

  const atualizarNota = (alunoId: number, campo: 'nota1' | 'nota2', valor: string) => {
    // Permite apenas números com até 1 casa decimal no intervalo 0-10
    if (valor !== '' && !/^\d{0,2}([.,]\d?)?$/.test(valor)) return;
    setEdicao((prev) => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [campo]: valor },
    }));
  };

  const salvarAluno = async (nota: NotaTurma) => {
    if (!disciplinaSelecionada) return;

    const campos = edicao[nota.aluno_id];
    if (!campos) return;

    const nota1Str = campos.nota1.replace(',', '.');
    const nota2Str = campos.nota2.replace(',', '.');
    const nota1 = nota1Str !== '' ? parseFloat(nota1Str) : null;
    const nota2 = nota2Str !== '' ? parseFloat(nota2Str) : null;

    if (nota1 != null && (isNaN(nota1) || nota1 < 0 || nota1 > 10)) {
      Alert.alert('Nota inválida', `Nota 1 de ${nota.aluno} deve ser entre 0 e 10.`);
      return;
    }
    if (nota2 != null && (isNaN(nota2) || nota2 < 0 || nota2 > 10)) {
      Alert.alert('Nota inválida', `Nota 2 de ${nota.aluno} deve ser entre 0 e 10.`);
      return;
    }

    setSalvando((prev) => ({ ...prev, [nota.aluno_id]: true }));
    try {
      await notasService.lancar({
        alunoId:      nota.aluno_id,
        disciplinaId: disciplinaSelecionada.id,
        nota1,
        nota2,
      });

      // Atualiza localmente para refletir média/situação sem nova requisição
      await selecionarDisciplina(disciplinaSelecionada);
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setSalvando((prev) => ({ ...prev, [nota.aluno_id]: false }));
    }
  };

  // Tela de seleção de disciplina
  if (!disciplinaSelecionada) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        {carregandoDisc ? (
          <View style={estilos.centro}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={estilos.textoSecundario}>Carregando disciplinas...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
            <Text style={estilos.instrucao}>Selecione a disciplina para lançar notas:</Text>
            {disciplinas.length === 0 && (
              <Text style={estilos.textoSecundario}>Nenhuma disciplina disponível.</Text>
            )}
            {disciplinas.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={estilos.cardDisciplina}
                onPress={() => selecionarDisciplina(d)}
                activeOpacity={0.75}
              >
                <Text style={estilos.cardDiscTitulo}>{d.nome}</Text>
                <Text style={estilos.cardDiscSub}>{d.curso} · {d.semestre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // Tela de lançamento de notas
  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho da disciplina selecionada */}
        <TouchableOpacity style={estilos.chipVoltar} onPress={() => setDisciplinaSelecionada(null)}>
          <Text style={estilos.chipVoltarTexto}>← Trocar disciplina</Text>
        </TouchableOpacity>

        <View style={estilos.cabecalho}>
          <Text style={estilos.cabecalhoTitulo}>{disciplinaSelecionada.nome}</Text>
          <Text style={estilos.cabecalhoSub}>
            {disciplinaSelecionada.curso} · {disciplinaSelecionada.semestre}
          </Text>
        </View>

        {carregandoNotas ? (
          <View style={estilos.centro}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={estilos.textoSecundario}>Carregando turma...</Text>
          </View>
        ) : notas.length === 0 ? (
          <Text style={estilos.textoSecundario}>Nenhum aluno matriculado nesta disciplina.</Text>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <View style={estilos.tabelaCabecalho}>
              <Text style={[estilos.colAluno, estilos.thTexto]}>Aluno</Text>
              <Text style={[estilos.colNota,  estilos.thTexto]}>N1</Text>
              <Text style={[estilos.colNota,  estilos.thTexto]}>N2</Text>
              <Text style={[estilos.colMedia, estilos.thTexto]}>Méd.</Text>
              <Text style={[estilos.colAcao,  estilos.thTexto]}> </Text>
            </View>

            {notas.map((item) => {
              const campos  = edicao[item.aluno_id] ?? { nota1: '', nota2: '' };
              const isSalvando = salvando[item.aluno_id] ?? false;
              const situacao   = item.situacao;

              let corBadge = theme.colors.textSecondary;
              if (situacao === 'Aprovado')  corBadge = theme.colors.success;
              if (situacao === 'Exame')     corBadge = theme.colors.warning;
              if (situacao === 'Reprovado') corBadge = theme.colors.danger;

              return (
                <View key={item.aluno_id} style={estilos.linha}>
                  <View style={estilos.colAluno}>
                    <Text style={estilos.alunoNome} numberOfLines={1}>{item.aluno}</Text>
                    <Text style={estilos.alunoMatricula}>{item.matricula}</Text>
                    {situacao && (
                      <Text style={[estilos.situacaoTexto, { color: corBadge }]}>{situacao}</Text>
                    )}
                  </View>

                  <TextInput
                    style={estilos.inputNota}
                    value={campos.nota1}
                    onChangeText={(v) => atualizarNota(item.aluno_id, 'nota1', v)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.colors.textSecondary}
                    maxLength={4}
                  />

                  <TextInput
                    style={estilos.inputNota}
                    value={campos.nota2}
                    onChangeText={(v) => atualizarNota(item.aluno_id, 'nota2', v)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.colors.textSecondary}
                    maxLength={4}
                  />

                  <Text style={estilos.mediaTexto}>
                    {item.media != null ? Number(item.media).toFixed(1) : '—'}
                  </Text>

                  <TouchableOpacity
                    style={[estilos.botaoSalvar, isSalvando && estilos.botaoSalvarDisabled]}
                    onPress={() => salvarAluno(item)}
                    disabled={isSalvando}
                  >
                    {isSalvando
                      ? <ActivityIndicator size="small" color={theme.colors.white} />
                      : <Text style={estilos.botaoSalvarTexto}>✓</Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:            { flex: 1, backgroundColor: theme.colors.background },
  conteudo:            { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  centro:              { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl, gap: theme.spacing.md },
  textoSecundario:     { fontSize: theme.font.md, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md },
  instrucao:           { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
  cardDisciplina:      { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardDiscTitulo:      { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  cardDiscSub:         { fontSize: theme.font.sm, color: theme.colors.textSecondary, marginTop: 2 },
  chipVoltar:          { alignSelf: 'flex-start', paddingHorizontal: theme.spacing.sm, paddingVertical: 4, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.full, marginBottom: theme.spacing.md },
  chipVoltarTexto:     { fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  cabecalho:           { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  cabecalhoTitulo:     { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.white },
  cabecalhoSub:        { fontSize: theme.font.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabelaCabecalho:     { flexDirection: 'row', backgroundColor: theme.colors.primary, borderTopLeftRadius: theme.radius.sm, borderTopRightRadius: theme.radius.sm, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, alignItems: 'center' },
  thTexto:             { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm, textAlign: 'center' },
  linha:               { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  colAluno:            { flex: 3, paddingRight: theme.spacing.xs },
  colNota:             { flex: 1, textAlign: 'center' },
  colMedia:            { flex: 1, textAlign: 'center' },
  colAcao:             { width: 36 },
  alunoNome:           { fontSize: theme.font.sm, fontWeight: '600', color: theme.colors.text },
  alunoMatricula:      { fontSize: 11, color: theme.colors.textSecondary },
  situacaoTexto:       { fontSize: 11, fontWeight: '700', marginTop: 1 },
  inputNota:           { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingVertical: 4, paddingHorizontal: 4, fontSize: theme.font.sm, textAlign: 'center', backgroundColor: theme.colors.background, marginHorizontal: 2, color: theme.colors.text },
  mediaTexto:          { flex: 1, fontSize: theme.font.sm, fontWeight: '700', textAlign: 'center', color: theme.colors.text },
  botaoSalvar:         { width: 32, height: 32, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  botaoSalvarDisabled: { opacity: 0.5 },
  botaoSalvarTexto:    { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.md },
});