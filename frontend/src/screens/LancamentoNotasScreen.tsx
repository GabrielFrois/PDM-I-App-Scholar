// Tela de lançamento de notas para professores e admin
// Fluxo em duas visões dentro da mesma tela:
// Seleção de disciplina -> lista de cards com as disciplinas disponíveis
// Lançamento de notas -> tabela com inputs de N1/N2 por aluno da turma

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { cadastroService, type DisciplinaListagem } from '../services/cadastroService';
import { notasService, type NotaTurma } from '../services/notasService';
import { theme } from '../styles/theme';

// Tipo auxiliar para o estado de edição: um par nota1/nota2 por aluno (como string para os inputs)
type EdicaoNotas = {
  nota1: string;
  nota2: string;
};

// Badge colorido exibido ao lado do nome do aluno após as notas serem salvas
// Retorna null enquanto a situação ainda não foi calculada
function BadgeSituacao({ situacao }: { situacao: NotaTurma['situacao'] }) {
  if (!situacao) return null;
  const cores: Record<string, { bg: string; fg: string }> = {
    Aprovado:  { bg: '#E6F4EA', fg: theme.colors.success },
    Exame:     { bg: '#FEF3E2', fg: theme.colors.warning },
    Reprovado: { bg: '#FCE8E6', fg: theme.colors.danger  },
  };
  const { bg, fg } = cores[situacao] ?? { bg: '#F3F4F6', fg: theme.colors.textSecondary };
  return (
    <View style={[estilos.badge, { backgroundColor: bg }]}>
      <Text style={[estilos.badgeTexto, { color: fg }]}>{situacao}</Text>
    </View>
  );
}

export default function LancamentoNotasScreen() {
  const navegacao = useNavigation();

  // Lista de disciplinas disponíveis para o usuário logado
  const [disciplinas,           setDisciplinas]           = useState<DisciplinaListagem[]>([]);
  // Disciplina atualmente selecionada (null = ainda na tela de seleção)
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<DisciplinaListagem | null>(null);
  // Alunos da turma com suas notas atuais
  const [notas,                 setNotas]                 = useState<NotaTurma[]>([]);

  // Mapa de alunoId -> { nota1, nota2 } com os valores que o professor está digitando nos inputs
  const [edicao,   setEdicao]   = useState<Record<number, EdicaoNotas>>({});
  // Mapa de alunoId -> boolean para controlar o spinner individual do botão confirmar de cada aluno
  const [salvando, setSalvando] = useState<Record<number, boolean>>({});

  const [carregandoDisc,  setCarregandoDisc]  = useState(false);
  const [carregandoNotas, setCarregandoNotas] = useState(false);

  // Carrega as disciplinas ao montar a tela
  // O backend filtra automaticamente: professor recebe só as suas, admin recebe todas
  useEffect(() => {
    async function carregarDisciplinas() {
      setCarregandoDisc(true);
      try {
        setDisciplinas(await cadastroService.listarDisciplinas());
      } catch (err: any) {
        Alert.alert('Erro', err.message || 'Não foi possível carregar as disciplinas.');
      } finally {
        setCarregandoDisc(false);
      }
    }
    carregarDisciplinas();
  }, []);

  const handleVoltar = useCallback(() => {
    if (disciplinaSelecionada) {
      setDisciplinaSelecionada(null);
    } else {
      navegacao.goBack();
    }
  }, [disciplinaSelecionada, navegacao]);

  // Sobrescreve o botão de voltar nativo com lógica acima
  useLayoutEffect(() => {
    navegacao.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={handleVoltar} tintColor="#FFFFFF" style={{ marginLeft: -8 }} />
      ),
    });
  }, [navegacao, handleVoltar]);

  // Carrega a turma ao selecionar uma disciplina e inicializa o estado de edição
  const selecionarDisciplina = useCallback(async (disc: DisciplinaListagem) => {
    setDisciplinaSelecionada(disc);
    setNotas([]);
    setEdicao({});
    setCarregandoNotas(true);

    try {
      const resp = await notasService.listarPorDisciplina(disc.id);
      setNotas(resp.notas);

      // Pré-preenche os inputs com as notas já salvas no banco.
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

  // Regex: aceita até 2 dígitos inteiros e 1 decimal, ex: "10", "7.5", "9,8"
  const atualizarNota = (alunoId: number, campo: 'nota1' | 'nota2', valor: string) => {
    if (valor !== '' && !/^\d{0,2}([.,]\d?)?$/.test(valor)) return;
    setEdicao((prev) => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [campo]: valor },
    }));
  };

  // Envia as notas de um aluno para a API e recarrega a turma para exibir a média recalculada
  const salvarAluno = async (nota: NotaTurma) => {
    if (!disciplinaSelecionada) return;
    const campos = edicao[nota.aluno_id];
    if (!campos) return;

    // Normaliza vírgula para ponto antes de converter para float
    const nota1Str = campos.nota1.replace(',', '.');
    const nota2Str = campos.nota2.replace(',', '.');
    const nota1 = nota1Str !== '' ? parseFloat(nota1Str) : null;
    const nota2 = nota2Str !== '' ? parseFloat(nota2Str) : null;

    // Validação local que evita requisição desnecessária se o valor estiver fora do intervalo
    if (nota1 != null && (isNaN(nota1) || nota1 < 0 || nota1 > 10)) {
      Alert.alert('Nota inválida', `Nota 1 de ${nota.aluno} deve ser entre 0 e 10.`);
      return;
    }
    if (nota2 != null && (isNaN(nota2) || nota2 < 0 || nota2 > 10)) {
      Alert.alert('Nota inválida', `Nota 2 de ${nota.aluno} deve ser entre 0 e 10.`);
      return;
    }

    // Ativa o spinner apenas no botão do aluno sendo salvo (os demais permanecem editáveis)
    setSalvando((prev) => ({ ...prev, [nota.aluno_id]: true }));
    try {
      await notasService.lancar({
        alunoId:      nota.aluno_id,
        disciplinaId: disciplinaSelecionada.id,
        nota1,
        nota2,
      });
      // Recarrega a turma para exibir a média e situação calculadas pelo banco (GENERATED ALWAYS)
      await selecionarDisciplina(disciplinaSelecionada);
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setSalvando((prev) => ({ ...prev, [nota.aluno_id]: false }));
    }
  };

  // Visão 1: seleção de disciplina
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

  // Visão 2: lançamento de notas da turma
  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho azul com nome e informações da disciplina selecionada */}
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
            {/* Cabeçalho das colunas */}
            <View style={estilos.tabelaCabecalho}>
              <Text style={[estilos.colAluno, estilos.thTexto]}>Aluno</Text>
              <Text style={[estilos.colNota,  estilos.thTexto]}>N1</Text>
              <Text style={[estilos.colNota,  estilos.thTexto]}>N2</Text>
              <Text style={[estilos.colMedia, estilos.thTexto]}>Méd.</Text>
              <View style={estilos.colAcao} />
            </View>

            {/* Um cartão por aluno com inputs de N1, N2, média calculada e botão de salvar */}
            {notas.map((item) => {
              const campos     = edicao[item.aluno_id] ?? { nota1: '', nota2: '' };
              const isSalvando = salvando[item.aluno_id] ?? false;

              return (
                <View key={item.aluno_id} style={estilos.cartaoAluno}>
                  {/* Linha superior: nome, matrícula e badge de situação */}
                  <View style={estilos.linhaInfo}>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.alunoNome} numberOfLines={1}>{item.aluno}</Text>
                      <Text style={estilos.alunoMatricula}>Matrícula: {item.matricula}</Text>
                    </View>
                    <BadgeSituacao situacao={item.situacao} />
                  </View>

                  {/* Linha inferior: inputs de nota, média e botão de salvar */}
                  <View style={estilos.linhaNotas}>
                    <View style={estilos.grupoInput}>
                      <Text style={estilos.labelNota}>N1</Text>
                      <TextInput
                        style={estilos.inputNota}
                        value={campos.nota1}
                        onChangeText={(v) => atualizarNota(item.aluno_id, 'nota1', v)}
                        keyboardType="decimal-pad"
                        placeholder="—"
                        placeholderTextColor={theme.colors.textSecondary}
                        maxLength={4}
                      />
                    </View>

                    <View style={estilos.grupoInput}>
                      <Text style={estilos.labelNota}>N2</Text>
                      <TextInput
                        style={estilos.inputNota}
                        value={campos.nota2}
                        onChangeText={(v) => atualizarNota(item.aluno_id, 'nota2', v)}
                        keyboardType="decimal-pad"
                        placeholder="—"
                        placeholderTextColor={theme.colors.textSecondary}
                        maxLength={4}
                      />
                    </View>

                    {/* Média é calculada pelo banco (coluna GENERATED ALWAYS), só exibe após salvar */}
                    <View style={estilos.grupoMedia}>
                      <Text style={estilos.labelNota}>Méd.</Text>
                      <Text style={estilos.mediaTexto}>
                        {item.media != null ? Number(item.media).toFixed(1) : '—'}
                      </Text>
                    </View>

                    {/* Botão de confirmar com spinner individual por aluno */}
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
  cabecalho:           { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  cabecalhoTitulo:     { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.white },
  cabecalhoSub:        { fontSize: theme.font.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabelaCabecalho:     { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.xs },
  thTexto:             { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  colAluno:            { flex: 1 },
  colNota:             { width: 48, textAlign: 'center' },
  colMedia:            { width: 48, textAlign: 'center' },
  colAcao:             { width: 40 },
  cartaoAluno:         { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  linhaInfo:           { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm, gap: theme.spacing.sm },
  linhaNotas:          { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  alunoNome:           { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  alunoMatricula:      { fontSize: theme.font.sm, color: theme.colors.textSecondary, marginTop: 2 },
  badge:               { paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.radius.full },
  badgeTexto:          { fontSize: 12, fontWeight: '700' },
  grupoInput:          { alignItems: 'center', gap: 4 },
  grupoMedia:          { alignItems: 'center', gap: 4, width: 48 },
  labelNota:           { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
  inputNota:           { width: 52, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingVertical: 6, paddingHorizontal: 4, fontSize: theme.font.md, textAlign: 'center', backgroundColor: theme.colors.background, color: theme.colors.text },
  mediaTexto:          { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  botaoSalvar:         { width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  botaoSalvarDisabled: { opacity: 0.5 },
  botaoSalvarTexto:    { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.md },
});