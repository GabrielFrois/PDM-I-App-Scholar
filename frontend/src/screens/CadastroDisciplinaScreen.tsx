// Tela de gerenciamento de disciplinas: somente admin
// Fluxo: aba "Lista" (todas as disciplinas) -> clica em uma -> aba "Formulário" (editar/remover)
//        ou botão "Nova Disciplina" -> aba "Formulário" em branco

import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import SelectField, { type OpcaoSelect } from '../components/SelectField';
import { useFormulario } from '../hooks/useFormulario';
import { cadastroService, type DisciplinaListagem, type ProfessorListagem } from '../services/cadastroService';
import { theme } from '../styles/theme';

type Aba = 'lista' | 'formulario';

type FormDisciplina = {
  nomeDisciplina: string; cargaHoraria: string;
  professorId: string; curso: string; semestre: string;
};

const VAZIO: FormDisciplina = {
  nomeDisciplina: '', cargaHoraria: '', professorId: '', curso: '', semestre: '',
};

const OPCOES_SEMESTRE: OpcaoSelect[] = [
  { label: '1º Semestre', value: '1º Semestre' },
  { label: '2º Semestre', value: '2º Semestre' },
  { label: '3º Semestre', value: '3º Semestre' },
  { label: '4º Semestre', value: '4º Semestre' },
  { label: '5º Semestre', value: '5º Semestre' },
  { label: '6º Semestre', value: '6º Semestre' },
];

export default function CadastroDisciplinaScreen() {
  const navegacao = useNavigation();

  const [aba, setAba]                   = useState<Aba>('lista');
  const [loading, setLoading]           = useState(false);
  const [disciplinaId, setDisciplinaId] = useState<number | null>(null);
  const [disciplinas,     setDisciplinas]     = useState<DisciplinaListagem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [professores,     setProfessores]     = useState<ProfessorListagem[]>([]);
  const [carregandoProfs, setCarregandoProfs] = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar, preencherFormulario } =
    useFormulario(VAZIO, {
      nomeDisciplina: (v) => !v.trim() ? 'Nome da disciplina é obrigatório.' : '',
      cargaHoraria:   (v) => !v.trim() ? 'Carga horária é obrigatória.'      : '',
      curso:          (v) => !v.trim() ? 'Curso é obrigatório.'               : '',
      semestre:       (v) => !v.trim() ? 'Semestre é obrigatório.'            : '',
      professorId:    () => '',
    });

  const opcoesProfessores: OpcaoSelect[] = [
    { label: 'Sem professor responsável', value: '' },
    ...professores.map((p) => ({ label: `${p.nome} (${p.titulacao})`, value: String(p.id) })),
  ];

  const voltarParaLista = useCallback(() => { setDisciplinaId(null); resetar(); setAba('lista'); }, [resetar]);

  useLayoutEffect(() => {
    navegacao.setOptions({
      headerTitleAlign: 'center',
      headerLeft: () => (
        <HeaderBackButton
          onPress={aba === 'formulario' ? voltarParaLista : () => navegacao.goBack()}
          tintColor="#FFFFFF" style={{ marginLeft: -8 }}
        />
      ),
    });
  }, [aba, navegacao, voltarParaLista]);

  const carregarLista = useCallback(async () => {
    setCarregandoLista(true);
    try { setDisciplinas(await cadastroService.listarDisciplinas()); }
    catch { } finally { setCarregandoLista(false); }
  }, []);

  const carregarProfessores = useCallback(async () => {
    setCarregandoProfs(true);
    try { setProfessores(await cadastroService.listarProfessores()); }
    catch { } finally { setCarregandoProfs(false); }
  }, []);

  useEffect(() => { carregarLista(); carregarProfessores(); }, [carregarLista, carregarProfessores]);

  const abrirEdicao = (disc: DisciplinaListagem) => {
    setDisciplinaId(disc.id);
    preencherFormulario({
      nomeDisciplina: disc.nome ?? '',
      cargaHoraria:   String(disc.carga_horaria ?? ''),
      professorId:    disc.professor_id != null ? String(disc.professor_id) : '',
      curso:          disc.curso ?? '',
      semestre:       disc.semestre ?? '',
    });
    setAba('formulario');
  };

  const confirmarRemocao = (disc: DisciplinaListagem) => {
    Alert.alert('Remover disciplina', `Deseja remover "${disc.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await cadastroService.removerDisciplina(disc.id); await carregarLista(); }
        catch (err: any) { Alert.alert('Erro', err.message); }
      }},
    ]);
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      if (disciplinaId) {
        await cadastroService.atualizarDisciplina(disciplinaId, formulario);
        Alert.alert('Sucesso', 'Disciplina atualizada!');
        await carregarLista(); voltarParaLista();
      } else {
        await cadastroService.salvarDisciplina(formulario);
        Alert.alert('Sucesso', `Disciplina "${formulario.nomeDisciplina}" cadastrada!`, [
          { text: 'OK', onPress: () => { resetar(); carregarLista(); } },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally { setLoading(false); }
  };

  if (aba === 'lista') {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.listaContainer}>
          <View style={estilos.listaHeader}>
            <Text style={estilos.listaTitle}>
              {disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''} cadastrada{disciplinas.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={estilos.botaoNovo} onPress={() => { setDisciplinaId(null); resetar(); setAba('formulario'); }}>
              <Text style={estilos.botaoNovoTexto}>+ Nova</Text>
            </TouchableOpacity>
          </View>

          {carregandoLista ? (
            <View style={estilos.centro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : disciplinas.length === 0 ? (
            <View style={estilos.centro}><Text style={estilos.textoVazio}>Nenhuma disciplina cadastrada.</Text></View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.listaScroll}>
              {disciplinas.map((disc) => (
                <View key={disc.id} style={estilos.card}>
                  <View style={estilos.cardInfo}>
                    <Text style={estilos.cardNome} numberOfLines={1}>{disc.nome}</Text>
                    <Text style={estilos.cardSub}>{disc.carga_horaria}h · {disc.semestre}</Text>
                    <Text style={estilos.cardSub} numberOfLines={1}>{disc.professor ?? 'Sem professor'}</Text>
                    <Text style={estilos.cardSub}>{disc.curso}</Text>
                  </View>
                  <View style={estilos.cardAcoes}>
                    <TouchableOpacity style={estilos.btnEditar} onPress={() => abrirEdicao(disc)}>
                      <Text style={estilos.btnEditarTexto}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={estilos.btnRemover} onPress={() => confirmarRemocao(disc)}>
                      <Text style={estilos.btnRemoverTexto}>Remover</Text>
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

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>

        {disciplinaId && (
          <View style={[estilos.aviso, { backgroundColor: '#FEF3E2' }]}>
            <Text style={[estilos.avisoTexto, { color: theme.colors.warning }]}>Editando disciplina existente</Text>
          </View>
        )}

        <Text style={estilos.secaoTitulo}>Dados da Disciplina</Text>

        <InputField label="Nome da disciplina *" placeholder="Ex: Programação Web"
          value={formulario.nomeDisciplina} onChangeText={(v) => atualizarCampo('nomeDisciplina', v)}
          error={erros.nomeDisciplina} />

        <InputField label="Carga horária (horas) *" placeholder="Ex: 80"
          value={formulario.cargaHoraria} onChangeText={(v) => atualizarCampo('cargaHoraria', v)}
          keyboardType="numeric" error={erros.cargaHoraria} />

        <InputField label="Curso *" placeholder="Ex: Desenvolvimento de Software"
          value={formulario.curso} onChangeText={(v) => atualizarCampo('curso', v)}
          error={erros.curso} />

        <SelectField label="Semestre *"
          placeholder="Selecione o semestre"
          opcoes={OPCOES_SEMESTRE} valor={formulario.semestre}
          onChange={(v) => atualizarCampo('semestre', v)}
          error={erros.semestre} />

        <SelectField label="Professor responsável"
          placeholder={carregandoProfs ? 'Carregando professores...' : 'Selecione o professor (opcional)'}
          opcoes={opcoesProfessores} valor={formulario.professorId}
          onChange={(v) => atualizarCampo('professorId', v)}
          disabled={carregandoProfs} error={erros.professorId} />

        <PrimaryButton title={disciplinaId ? 'Salvar alterações' : 'Cadastrar Disciplina'} onPress={handleSalvar} loading={loading} />
        <PrimaryButton title="Limpar formulário" variant="outline" onPress={resetar} style={{ marginTop: theme.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: theme.colors.background },
  scroll:         { flex: 1 },
  conteudo:       { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  centro:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  textoVazio:     { fontSize: theme.font.md, color: theme.colors.textSecondary },
  listaContainer: { flex: 1 },
  listaHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  listaTitle:     { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  listaScroll:    { padding: theme.spacing.lg, gap: theme.spacing.sm },
  botaoNovo:      { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.radius.full },
  botaoNovoTexto: { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  card:           { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardInfo:       { gap: 3, marginBottom: theme.spacing.sm },
  cardNome:       { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  cardSub:        { fontSize: theme.font.sm, color: theme.colors.textSecondary },
  cardAcoes:      { flexDirection: 'row', gap: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm },
  btnEditar:      { flex: 1, backgroundColor: theme.colors.secondary, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnEditarTexto: { fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  btnRemover:     { flex: 1, backgroundColor: '#FCE8E6', paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnRemoverTexto:{ fontSize: theme.font.sm, color: theme.colors.danger, fontWeight: '600' },
  aviso:          { backgroundColor: '#E8F0FE', borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.md },
  avisoTexto:     { fontSize: theme.font.sm, color: theme.colors.primary },
  secaoTitulo:    { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
});