// Tela de cadastro e gerenciamento de cursos.

import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import SelectField, { type OpcaoSelect } from '../components/SelectField';
import { useFormulario } from '../hooks/useFormulario';
import {
  cadastroService,
  type CursoListagem,
  type DadosCurso,
  type ProfessorListagem,
} from '../services/cadastroService';
import { theme } from '../styles/theme';

type Aba = 'lista' | 'form';

const AREAS = [
  'Tecnologia da Informação', 'Engenharia', 'Saúde', 'Negócios',
  'Educação', 'Ciências Exatas', 'Humanidades', 'Artes e Design',
];

const VAZIO: DadosCurso = {
  nome: '', area: '', duracaoSem: '6', coordenadorId: '', descricao: '',
};

export default function CadastroCursoScreen() {
  const navegacao = useNavigation();

  const [aba,          setAba]          = useState<Aba>('lista');
  const [cursoId,      setCursoId]      = useState<number | null>(null);
  const [cursos,       setCursos]       = useState<CursoListagem[]>([]);
  const [professores,  setProfessores]  = useState<ProfessorListagem[]>([]);
  const [filtro,       setFiltro]       = useState('');
  const [carregando,   setCarregando]   = useState(false);
  const [salvando,     setSalvando]     = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar, preencherFormulario } =
    useFormulario(VAZIO, {
      nome:      (v) => !v.trim() ? 'Nome do curso é obrigatório.' : '',
      area:      (v) => !v.trim() ? 'Área é obrigatória.' : '',
      duracaoSem:(v) => {
        const n = parseInt(v);
        if (!v.trim() || isNaN(n)) return 'Duração é obrigatória.';
        if (n < 1 || n > 12)      return 'Duração deve ser entre 1 e 12 semestres.';
        return '';
      },
      coordenadorId: () => '',
      descricao:     () => '',
    });

  // Opções para os SelectFields
  const opcoesArea: OpcaoSelect[] = AREAS.map((a) => ({ label: a, value: a }));
  const opcoesProfessores: OpcaoSelect[] = [
    { label: 'Sem coordenador', value: '' },
    ...professores.map((p) => ({ label: `${p.nome} — ${p.area}`, value: String(p.id) })),
  ];

  const voltarParaLista = useCallback(() => {
    setCursoId(null);
    resetar();
    setAba('lista');
  }, [resetar]);

  // Botão Voltar no header navega entre abas
  useLayoutEffect(() => {
    navegacao.setOptions({
      headerTitleAlign: 'center',
      headerLeft: () => (
        <HeaderBackButton
          onPress={aba !== 'lista' ? voltarParaLista : () => navegacao.goBack()}
          tintColor="#FFFFFF"
          style={{ marginLeft: -8 }}
        />
      ),
    });
  }, [aba, navegacao, voltarParaLista]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      // Carrega cursos e professores em paralelo
      const [listaCursos, listaProfs] = await Promise.all([
        cadastroService.listarCursos(),
        cadastroService.listarProfessores(),
      ]);
      setCursos(listaCursos);
      setProfessores(listaProfs);
    } catch { }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const abrirEdicao = (curso: CursoListagem) => {
    setCursoId(curso.id);
    preencherFormulario({
      nome:          curso.nome,
      area:          curso.area,
      duracaoSem:    String(curso.duracao_sem),
      coordenadorId: curso.coordenador_id ? String(curso.coordenador_id) : '',
      descricao:     curso.descricao ?? '',
    });
    setAba('form');
  };

  const confirmarRemocao = (curso: CursoListagem) => {
    Alert.alert('Remover curso', `Deseja remover "${curso.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await cadastroService.removerCurso(curso.id);
            await carregarDados();
          } catch (err: any) { Alert.alert('Erro', err.message); }
        },
      },
    ]);
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setSalvando(true);
    try {
      if (cursoId) {
        await cadastroService.atualizarCurso(cursoId, formulario);
        Alert.alert('Sucesso', 'Curso atualizado!');
      } else {
        await cadastroService.salvarCurso(formulario);
        Alert.alert('Sucesso', `Curso "${formulario.nome}" cadastrado!`, [
          { text: 'OK', onPress: () => resetar() },
        ]);
      }
      await carregarDados();
      voltarParaLista();
    } catch (err: any) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally { setSalvando(false); }
  };

  // Aba lista
  if (aba === 'lista') {
    const cursosFiltrados = cursos.filter((c) => {
      const t = filtro.trim().toLowerCase();
      return !t || c.nome.toLowerCase().includes(t) || c.area.toLowerCase().includes(t);
    });

    return (
      <SafeAreaView style={s.safeArea} edges={['bottom']}>
        <View style={s.listaContainer}>

          <View style={s.listaHeader}>
            <Text style={s.listaTitle}>
              {cursosFiltrados.length} curso{cursosFiltrados.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={s.botaoNovo}
              onPress={() => { setCursoId(null); resetar(); setAba('form'); }}>
              <Text style={s.botaoNovoTexto}>+ Novo</Text>
            </TouchableOpacity>
          </View>

          <View style={s.buscaContainer}>
            <TextInput
              style={s.buscaInput}
              placeholder="Buscar por nome ou área"
              placeholderTextColor={theme.colors.textSecondary}
              value={filtro}
              onChangeText={setFiltro}
            />
          </View>

          {carregando ? (
            <View style={s.centro}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : cursosFiltrados.length === 0 ? (
            <View style={s.centro}>
              <Text style={s.textoVazio}>
                {filtro ? 'Nenhum resultado encontrado.' : 'Nenhum curso cadastrado.'}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.listaScroll}>
              {cursosFiltrados.map((curso) => (
                <View key={curso.id} style={s.card}>
                  <View style={s.cardTopo}>
                    {/* Badge colorida com a área do curso */}
                    <View style={s.badge}>
                      <Text style={s.badgeTexto}>{curso.area}</Text>
                    </View>
                    <Text style={s.cardDuracao}>{curso.duracao_sem} sem.</Text>
                  </View>

                  <Text style={s.cardNome}>{curso.nome}</Text>

                  {curso.coordenador && (
                    <Text style={s.cardSub}>👤 {curso.coordenador}</Text>
                  )}
                  {curso.descricao ? (
                    <Text style={s.cardDescricao} numberOfLines={2}>{curso.descricao}</Text>
                  ) : null}

                  <View style={s.cardAcoes}>
                    <TouchableOpacity style={s.btnEditar} onPress={() => abrirEdicao(curso)}>
                      <Text style={s.btnEditarTexto}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnRemover} onPress={() => confirmarRemocao(curso)}>
                      <Text style={s.btnRemoverTexto}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Aba Formulário (novo / edição)
  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.conteudo}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>

        {cursoId && (
          <View style={s.aviso}>
            <Text style={s.avisoTexto}>Editando curso existente</Text>
          </View>
        )}

        <Text style={s.secaoTitulo}>Dados do Curso</Text>

        <InputField
          label="Nome do curso *"
          placeholder="Ex: Desenvolvimento de Software Multiplataforma"
          value={formulario.nome}
          onChangeText={(v) => atualizarCampo('nome', v)}
          error={erros.nome}
        />

        <SelectField
          label="Área *"
          placeholder="Selecione a área"
          opcoes={opcoesArea}
          valor={formulario.area}
          onChange={(v) => atualizarCampo('area', v)}
          error={erros.area}
        />

        <InputField
          label="Duração (semestres) *"
          placeholder="Ex: 6"
          value={formulario.duracaoSem}
          onChangeText={(v) => atualizarCampo('duracaoSem', v)}
          keyboardType="numeric"
          maxLength={2}
          error={erros.duracaoSem}
          hint="Entre 1 e 12 semestres"
        />

        <SelectField
          label="Coordenador"
          placeholder="Selecione o coordenador (opcional)"
          opcoes={opcoesProfessores}
          valor={formulario.coordenadorId}
          onChange={(v) => atualizarCampo('coordenadorId', v)}
          error={erros.coordenadorId}
        />

        <InputField
          label="Descrição"
          placeholder="Breve descrição do curso (opcional)"
          value={formulario.descricao}
          onChangeText={(v) => atualizarCampo('descricao', v)}
          multiline
          numberOfLines={3}
        />

        <PrimaryButton
          title={cursoId ? 'Salvar alterações' : 'Cadastrar Curso'}
          onPress={handleSalvar}
          loading={salvando}
        />
        <PrimaryButton
          title="Limpar formulário"
          variant="outline"
          onPress={resetar}
          style={{ marginTop: theme.spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: theme.colors.background },
  scroll:        { flex: 1 },
  conteudo:      { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  centro:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  textoVazio:    { fontSize: theme.font.md, color: theme.colors.textSecondary, textAlign: 'center' },
  listaContainer:{ flex: 1 },
  listaHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  listaTitle:    { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  listaScroll:   { padding: theme.spacing.lg, gap: theme.spacing.sm },
  buscaContainer:{ padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  buscaInput:    { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: theme.font.md, color: theme.colors.text },
  botaoNovo:     { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.radius.full },
  botaoNovoTexto:{ color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  card:          { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTopo:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  badge:         { backgroundColor: '#E8F0FE', paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.radius.full },
  badgeTexto:    { fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  cardDuracao:   { fontSize: theme.font.sm, color: theme.colors.textSecondary, fontWeight: '600' },
  cardNome:      { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  cardSub:       { fontSize: theme.font.sm, color: theme.colors.textSecondary, marginBottom: 2 },
  cardDescricao: { fontSize: theme.font.sm, color: theme.colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
  cardAcoes:     { flexDirection: 'row', gap: theme.spacing.xs, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm, marginTop: theme.spacing.sm },
  btnEditar:     { flex: 1, backgroundColor: theme.colors.secondary, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnEditarTexto:{ fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  btnRemover:    { flex: 1, backgroundColor: '#FCE8E6', paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnRemoverTexto:{ fontSize: theme.font.sm, color: theme.colors.danger, fontWeight: '600' },
  aviso:         { backgroundColor: '#FEF3E2', borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.md },
  avisoTexto:    { fontSize: theme.font.sm, color: theme.colors.warning },
  secaoTitulo:   { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
});