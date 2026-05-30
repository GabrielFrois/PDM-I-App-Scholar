import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useFormulario } from '../hooks/useFormulario';
import { cadastroService, type DadosProfessor, type ProfessorListagem } from '../services/cadastroService';
import { theme } from '../styles/theme';

type Aba = 'lista' | 'formulario';

const VAZIO: DadosProfessor = {
  nome: '', titulacao: '', areaAtuacao: '', tempoDocencia: '', email: '',
};

const BLOQUEADOS_PROFESSOR = ['nome', 'email'];

export default function CadastroProfessorScreen() {
  const { user }    = useAuth();
  const navegacao   = useNavigation();
  const ehProfessor = user?.perfil === 'professor';

  const [aba, setAba]                 = useState<Aba>(ehProfessor ? 'formulario' : 'lista');
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [loading, setLoading]         = useState(false);
  const [carregando, setCarregando]   = useState(ehProfessor);

  const [professores,     setProfessores]     = useState<ProfessorListagem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar, preencherFormulario } =
    useFormulario(VAZIO, {
      nome:          (v) => !v.trim() ? 'Nome é obrigatório.' : '',
      titulacao:     (v) => !v.trim() ? 'Titulação é obrigatória.' : '',
      areaAtuacao:   (v) => !v.trim() ? 'Área de atuação é obrigatória.' : '',
      tempoDocencia: (v) => !v.trim() ? 'Tempo de docência é obrigatório.' : '',
      email: (v) => {
        if (!v.trim()) return 'E-mail é obrigatório.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido.';
        return '';
      },
    });

  const bloqueado = (campo: string) => ehProfessor && BLOQUEADOS_PROFESSOR.includes(campo);

  // Declarado antes do useLayoutEffect para evitar closure stale
  const voltarParaLista = useCallback(() => {
    setProfessorId(null);
    resetar();
    setAba('lista');
  }, [resetar]);

  // Substitui o botão Voltar nativo quando está no formulário de edição
  useLayoutEffect(() => {
    if (ehProfessor) return;
    navegacao.setOptions({
      headerLeft: aba === 'formulario'
        ? () => (
            <TouchableOpacity onPress={voltarParaLista} style={estilos.botaoHeader}>
              <Text style={estilos.botaoHeaderTexto}>‹ Lista</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [aba, navegacao, voltarParaLista]);

  useEffect(() => {
    if (!ehProfessor || !user?.email) return;
    (async () => {
      try {
        const prof = await cadastroService.buscarProfessorPorEmail(user!.email);
        if (prof) {
          setProfessorId(prof.id);
          preencherFormulario({
            nome:          prof.nome           ?? '',
            titulacao:     prof.titulacao      ?? '',
            areaAtuacao:   prof.area           ?? '',
            tempoDocencia: String(prof.tempo_docencia ?? ''),
            email:         prof.email          ?? '',
          });
        }
      } catch { /* silencioso */ }
      finally { setCarregando(false); }
    })();
  }, []);

  const carregarLista = useCallback(async () => {
    setCarregandoLista(true);
    try { setProfessores(await cadastroService.listarProfessores()); }
    catch { /* silencioso */ }
    finally { setCarregandoLista(false); }
  }, []);

  useEffect(() => { if (!ehProfessor) carregarLista(); }, []);

  const abrirEdicao = (prof: ProfessorListagem) => {
    setProfessorId(prof.id);
    preencherFormulario({
      nome:          prof.nome           ?? '',
      titulacao:     prof.titulacao      ?? '',
      areaAtuacao:   prof.area           ?? '',
      tempoDocencia: String(prof.tempo_docencia ?? ''),
      email:         prof.email          ?? '',
    });
    setAba('formulario');
  };

  const confirmarRemocao = (prof: ProfessorListagem) => {
    Alert.alert('Remover professor', `Deseja remover ${prof.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await cadastroService.removerProfessor(prof.id); await carregarLista(); }
        catch (err: any) { Alert.alert('Erro', err.message); }
      }},
    ]);
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      if (professorId) {
        await cadastroService.atualizarProfessor(professorId, formulario);
        Alert.alert('Sucesso', ehProfessor ? 'Seus dados foram atualizados!' : 'Professor atualizado!');
        if (!ehProfessor) { await carregarLista(); voltarParaLista(); }
      } else {
        await cadastroService.salvarProfessor(formulario);
        Alert.alert('Sucesso', `Professor ${formulario.nome} cadastrado!`, [
          { text: 'OK', onPress: () => { resetar(); if (!ehProfessor) carregarLista(); } },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally { setLoading(false); }
  };

  if (carregando) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={estilos.textoCarga}>Carregando seus dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Lista
  if (aba === 'lista') {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.listaContainer}>
          <View style={estilos.listaHeader}>
            <Text style={estilos.listaTitle}>
              {professores.length} professor{professores.length !== 1 ? 'es' : ''} cadastrado{professores.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={estilos.botaoNovo} onPress={() => { setProfessorId(null); resetar(); setAba('formulario'); }}>
              <Text style={estilos.botaoNovoTexto}>+ Novo</Text>
            </TouchableOpacity>
          </View>

          {carregandoLista ? (
            <View style={estilos.centro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : professores.length === 0 ? (
            <View style={estilos.centro}><Text style={estilos.textoVazio}>Nenhum professor cadastrado.</Text></View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.listaScroll}>
              {professores.map((prof) => (
                <View key={prof.id} style={estilos.card}>
                  <View style={estilos.cardInfo}>
                    <Text style={estilos.cardNome} numberOfLines={1}>{prof.nome}</Text>
                    <Text style={estilos.cardSub}>{prof.titulacao} · {prof.area}</Text>
                    <Text style={estilos.cardSub}>{prof.tempo_docencia} ano{prof.tempo_docencia !== 1 ? 's' : ''} de docência</Text>
                    <Text style={estilos.cardSub} numberOfLines={1}>{prof.email}</Text>
                  </View>
                  <View style={estilos.cardAcoes}>
                    <TouchableOpacity style={estilos.btnEditar} onPress={() => abrirEdicao(prof)}>
                      <Text style={estilos.btnEditarTexto}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={estilos.btnRemover} onPress={() => confirmarRemocao(prof)}>
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

  // Formulário
  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>

        {!ehProfessor && professorId && (
          <View style={[estilos.aviso, { backgroundColor: '#FEF3E2' }]}>
            <Text style={[estilos.avisoTexto, { color: theme.colors.warning }]}>Editando professor existente</Text>
          </View>
        )}

        <Text style={estilos.secaoTitulo}>Dados do Professor</Text>

        <InputField label="Nome completo *" placeholder="Ex: André Olímpio"
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)}
          error={erros.nome} editable={!bloqueado('nome')} />

        <InputField label="Titulação *" placeholder="Ex: Doutor, Mestre, Especialista"
          value={formulario.titulacao} onChangeText={(v) => atualizarCampo('titulacao', v)}
          error={erros.titulacao} />

        <InputField label="Área de atuação *" placeholder="Ex: Engenharia de Software"
          value={formulario.areaAtuacao} onChangeText={(v) => atualizarCampo('areaAtuacao', v)}
          error={erros.areaAtuacao} />

        <InputField label="Tempo de docência (anos) *" placeholder="Ex: 10"
          value={formulario.tempoDocencia} onChangeText={(v) => atualizarCampo('tempoDocencia', v)}
          keyboardType="numeric" error={erros.tempoDocencia} />

        <InputField label="E-mail *" placeholder="professor@fatec.sp.gov.br"
          value={formulario.email} onChangeText={(v) => atualizarCampo('email', v)}
          keyboardType="email-address" autoCapitalize="none"
          error={erros.email} editable={!bloqueado('email')} />

        <PrimaryButton
          title={professorId ? 'Salvar alterações' : 'Cadastrar Professor'}
          onPress={handleSalvar} loading={loading} />
        {!ehProfessor && (
          <PrimaryButton title="Limpar formulário" variant="outline" onPress={resetar}
            style={{ marginTop: theme.spacing.sm }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: theme.colors.background },
  scroll:           { flex: 1 },
  conteudo:         { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  centro:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  textoCarga:       { fontSize: theme.font.md, color: theme.colors.textSecondary },
  textoVazio:       { fontSize: theme.font.md, color: theme.colors.textSecondary },
  listaContainer:   { flex: 1 },
  listaHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  listaTitle:       { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  listaScroll:      { padding: theme.spacing.lg, gap: theme.spacing.sm },
  botaoNovo:        { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.radius.full },
  botaoNovoTexto:   { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  botaoHeader:      { paddingHorizontal: theme.spacing.sm, paddingVertical: 4 },
  botaoHeaderTexto: { color: theme.colors.white, fontSize: theme.font.md, fontWeight: '600' },
  card:             { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardInfo:         { gap: 3, marginBottom: theme.spacing.sm },
  cardNome:         { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  cardSub:          { fontSize: theme.font.sm, color: theme.colors.textSecondary },
  cardAcoes:        { flexDirection: 'row', gap: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm },
  btnEditar:        { flex: 1, backgroundColor: theme.colors.secondary, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnEditarTexto:   { fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  btnRemover:       { flex: 1, backgroundColor: '#FCE8E6', paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnRemoverTexto:  { fontSize: theme.font.sm, color: theme.colors.danger, fontWeight: '600' },
  aviso:            { backgroundColor: '#E8F0FE', borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.md },
  avisoTexto:       { fontSize: theme.font.sm, color: theme.colors.primary },
  secaoTitulo:      { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
});