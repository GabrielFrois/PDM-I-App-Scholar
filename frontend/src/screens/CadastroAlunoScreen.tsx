// Tela com duas visões:
// Admin: lista de alunos com botões Editar/Remover + formulário de cadastro/edição
// Aluno: abre direto no formulário com seus dados carregados e campos sensíveis bloqueados

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
import { useAuth } from '../contexts/AuthContext';
import { useFormulario } from '../hooks/useFormulario';
import { useIBGE } from '../hooks/useIBGE';
import { cadastroService, type AlunoListagem, type DadosAluno } from '../services/cadastroService';
import { theme } from '../styles/theme';

type Aba = 'lista' | 'formulario';

// Estado inicial vazio do formulário (usado no reset e na criação de novo aluno)
const VAZIO: DadosAluno = {
  nome: '', matricula: '', curso: '', email: '',
  telefone: '', cep: '', endereco: '', cidade: '', estado: '',
};

// Campos que o aluno não pode editar (dados institucionais)
const BLOQUEADOS_ALUNO = ['nome', 'matricula', 'curso', 'email'];

export default function CadastroAlunoScreen() {
  const { user }  = useAuth();
  const navegacao = useNavigation();
  const ehAluno   = user?.perfil === 'aluno';

  // Aluno começa no formulário; admin começa na lista
  const [aba, setAba]                 = useState<Aba>(ehAluno ? 'formulario' : 'lista');
  const [alunoId, setAlunoId]         = useState<number | null>(null);
  const [loading, setLoading]         = useState(false);
  const [carregando, setCarregando]   = useState(ehAluno); // true enquanto busca dados do aluno logado
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [alunos,          setAlunos]          = useState<AlunoListagem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);

  // useFormulario gerencia estado dos campos + regras de validação inline
  const { formulario, erros, atualizarCampo, validar, resetar, preencherFormulario } =
    useFormulario(VAZIO, {
      nome:      (v) => !v.trim() ? 'Nome é obrigatório.' : '',
      matricula: (v) => !v.trim() ? 'Matrícula é obrigatória.' : '',
      curso:     (v) => !v.trim() ? 'Curso é obrigatório.' : '',
      email: (v) => {
        if (!v.trim()) return 'E-mail é obrigatório.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido.';
        return '';
      },
      telefone: (v) => {
        if (!v.trim()) return 'Telefone é obrigatório.';
        if (v.replace(/\D/g, '').length < 10) return 'Telefone inválido (mínimo 10 dígitos).';
        return '';
      },
      cep:      (v) => !v.trim() ? 'CEP é obrigatório.' : '',
      endereco: (v) => !v.trim() ? 'Endereço é obrigatório.' : '',
      cidade:   (v) => !v.trim() ? 'Cidade é obrigatória.' : '',
      estado:   (v) => !v.trim() ? 'Estado é obrigatório.' : '',
    });

  // useIBGE fornece estados e municípios, recebe a sigla do estado selecionado para carregar as cidades
  const { estados, cidades, carregandoEstados, carregandoCidades } = useIBGE(
    formulario.estado || null,
  );
  const opcoesEstados: OpcaoSelect[] = estados.map((e) => ({ label: `${e.sigla} — ${e.nome}`, value: e.sigla }));
  const opcoesCidades: OpcaoSelect[] = cidades.map((c) => ({ label: c.nome, value: c.nome }));

  // Retorna true se o campo deve ser bloqueado para edição pelo aluno
  const bloqueado = (campo: string) => ehAluno && BLOQUEADOS_ALUNO.includes(campo);

  // useCallback evita recriar a função a cada render (necessário por ser usada no useLayoutEffect)
  const voltarParaLista = useCallback(() => {
    setAlunoId(null);
    resetar();
    setAba('lista');
  }, [resetar]);

  // Só ativo quando o admin está no formulário (evita o back nativo que não reseta o estado)
  useLayoutEffect(() => {
    if (ehAluno) return;
    navegacao.setOptions({
      headerTitleAlign: 'center',
      headerLeft: () => (
        <HeaderBackButton
          onPress={aba === 'formulario' ? voltarParaLista : () => navegacao.goBack()}
          tintColor="#FFFFFF"
          style={{ marginLeft: -8 }}
        />
      ),
    });
  }, [aba, navegacao, voltarParaLista]);

  // Aluno: ao montar, busca seus próprios dados pelo e-mail do token e preenche o formulário
  useEffect(() => {
    if (!ehAluno || !user?.email) return;
    (async () => {
      try {
        const aluno = await cadastroService.buscarAlunoPorEmail(user!.email);
        if (aluno) {
          setAlunoId((aluno as any).id);
          preencherFormulario({
            nome:      (aluno as any).nome      ?? '',
            matricula: (aluno as any).matricula ?? '',
            curso:     (aluno as any).curso     ?? '',
            email:     (aluno as any).email     ?? '',
            telefone:  (aluno as any).telefone  ?? '',
            cep:       (aluno as any).cep       ?? '',
            endereco:  (aluno as any).endereco  ?? '',
            cidade:    (aluno as any).cidade    ?? '',
            estado:    (aluno as any).estado    ?? '',
          });
        }
      } catch { /* silencioso */ }
      finally { setCarregando(false); }
    })();
  }, []);

  // Admin: carrega a lista de alunos
  const carregarLista = useCallback(async () => {
    setCarregandoLista(true);
    try { setAlunos(await cadastroService.listarAlunos()); }
    catch { /* silencioso */ }
    finally { setCarregandoLista(false); }
  }, []);

  useEffect(() => { if (!ehAluno) carregarLista(); }, []);

  // Admin clica em "Editar": preenche o formulário com os dados do aluno selecionado
  const abrirEdicao = (aluno: AlunoListagem) => {
    setAlunoId(aluno.id);
    preencherFormulario({
      nome:      aluno.nome      ?? '',
      matricula: aluno.matricula ?? '',
      curso:     aluno.curso     ?? '',
      email:     aluno.email     ?? '',
      telefone:  (aluno as any).telefone ?? '',
      cep:       (aluno as any).cep      ?? '',
      endereco:  (aluno as any).endereco ?? '',
      cidade:    aluno.cidade    ?? '',
      estado:    aluno.estado    ?? '',
    });
    setAba('formulario');
  };

  // Exibe Alert de confirmação antes de remover (soft delete)
  const confirmarRemocao = (aluno: AlunoListagem) => {
    Alert.alert('Remover aluno', `Deseja remover ${aluno.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await cadastroService.removerAluno(aluno.id); await carregarLista(); }
        catch (err: any) { Alert.alert('Erro', err.message); }
      }},
    ]);
  };

  // Chamada quando o campo CEP perde o foco: busca endereço na API ViaCEP
  // e preenche automaticamente os campos de endereço, estado e cidade
  const buscarCep = async (cep: string) => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const dado = await res.json();
      if (dado.erro) { Alert.alert('CEP não encontrado'); return; }
      atualizarCampo('endereco', dado.logradouro || '');
      atualizarCampo('estado',   dado.uf         || '');
      atualizarCampo('cidade',   dado.localidade || '');
    } catch { Alert.alert('Erro', 'Não foi possível buscar o CEP.'); }
    finally { setBuscandoCep(false); }
  };

  // Valida o formulário e chama criar ou atualizar conforme alunoId
  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      if (alunoId) {
        await cadastroService.atualizarAluno(alunoId, formulario);
        Alert.alert('Sucesso', ehAluno ? 'Seus dados foram atualizados!' : 'Aluno atualizado!');
        if (!ehAluno) { await carregarLista(); voltarParaLista(); }
      } else {
        await cadastroService.salvarAluno(formulario);
        Alert.alert('Sucesso', `Aluno ${formulario.nome} cadastrado!`, [
          { text: 'OK', onPress: () => { resetar(); if (!ehAluno) carregarLista(); } },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally { setLoading(false); }
  };

  // Spinner enquanto carrega os dados do aluno logado
  if (carregando) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={estilos.textoCarga}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Visão de lista (admin)
  if (aba === 'lista') {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.listaContainer}>
          <View style={estilos.listaHeader}>
            <Text style={estilos.listaTitle}>
              {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={estilos.botaoNovo} onPress={() => { setAlunoId(null); resetar(); setAba('formulario'); }}>
              <Text style={estilos.botaoNovoTexto}>+ Novo</Text>
            </TouchableOpacity>
          </View>

          {carregandoLista ? (
            <View style={estilos.centro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : alunos.length === 0 ? (
            <View style={estilos.centro}>
              <Text style={estilos.textoVazio}>Nenhum aluno cadastrado.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.listaScroll}>
              {alunos.map((aluno) => (
                <View key={aluno.id} style={estilos.card}>
                  <View style={estilos.cardInfo}>
                    <Text style={estilos.cardNome} numberOfLines={1}>{aluno.nome}</Text>
                    <Text style={estilos.cardSub}>Mat. {aluno.matricula}</Text>
                    <Text style={estilos.cardSub} numberOfLines={1}>{aluno.curso}</Text>
                    <Text style={estilos.cardSub}>{aluno.cidade} — {aluno.estado}</Text>
                  </View>
                  <View style={estilos.cardAcoes}>
                    <TouchableOpacity style={estilos.btnEditar} onPress={() => abrirEdicao(aluno)}>
                      <Text style={estilos.btnEditarTexto}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={estilos.btnRemover} onPress={() => confirmarRemocao(aluno)}>
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

  // Visão de formulário (admin e aluno)
  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>

        {/* Aviso de edição (visível para admin quando há um aluno carregado) */}
        {!ehAluno && alunoId && (
          <View style={[estilos.aviso, { backgroundColor: '#FEF3E2' }]}>
            <Text style={[estilos.avisoTexto, { color: theme.colors.warning }]}>Editando aluno existente</Text>
          </View>
        )}

        <Text style={estilos.secaoTitulo}>Dados Pessoais</Text>

        <InputField label="Nome completo *" placeholder="Ex: Gabriel Oliveira"
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)}
          error={erros.nome} editable={!bloqueado('nome')} />

        <InputField label="Matrícula *" placeholder="Ex: 2026001"
          value={formulario.matricula} onChangeText={(v) => atualizarCampo('matricula', v)}
          keyboardType="numeric" error={erros.matricula} editable={!bloqueado('matricula')} />

        <InputField label="Curso *" placeholder="Ex: Desenvolvimento de Software"
          value={formulario.curso} onChangeText={(v) => atualizarCampo('curso', v)}
          error={erros.curso} editable={!bloqueado('curso')} />

        <InputField label="E-mail *" placeholder="aluno@fatec.sp.gov.br"
          value={formulario.email} onChangeText={(v) => atualizarCampo('email', v)}
          keyboardType="email-address" autoCapitalize="none"
          error={erros.email} editable={!bloqueado('email')} />

        <InputField label="Telefone *" placeholder="(12) 99999-9999"
          value={formulario.telefone} onChangeText={(v) => atualizarCampo('telefone', v)}
          keyboardType="phone-pad" error={erros.telefone} />

        <View style={estilos.divisor} />
        <Text style={estilos.secaoTitulo}>Endereço</Text>

        {/* onBlur: dispara busca no ViaCEP quando o campo perde foco */}
        <InputField label="CEP *" placeholder="12345678"
          value={formulario.cep} onChangeText={(v) => atualizarCampo('cep', v)}
          onBlur={() => buscarCep(formulario.cep)}
          keyboardType="numeric" maxLength={8}
          hint={buscandoCep ? 'Buscando endereço...' : 'Digite o CEP para preencher automaticamente'}
          error={erros.cep} />

        <InputField label="Endereço *" placeholder="Rua, número, complemento"
          value={formulario.endereco} onChangeText={(v) => atualizarCampo('endereco', v)}
          error={erros.endereco} />

        {/* Ao trocar o estado, limpa a cidade para forçar nova seleção */}
        <SelectField label="Estado *"
          placeholder={carregandoEstados ? 'Carregando estados...' : 'Selecione o estado'}
          opcoes={opcoesEstados} valor={formulario.estado}
          onChange={(v) => { atualizarCampo('estado', v); atualizarCampo('cidade', ''); }}
          disabled={carregandoEstados} error={erros.estado} />

        {/* Cidade desabilitada até que um estado seja selecionado */}
        <SelectField label="Cidade *"
          placeholder={!formulario.estado ? 'Selecione o estado primeiro' : carregandoCidades ? 'Carregando cidades...' : 'Selecione a cidade'}
          opcoes={opcoesCidades} valor={formulario.cidade}
          onChange={(v) => atualizarCampo('cidade', v)}
          disabled={!formulario.estado || carregandoCidades} error={erros.cidade} />

        <PrimaryButton
          title={alunoId ? 'Salvar alterações' : 'Cadastrar Aluno'}
          onPress={handleSalvar} loading={loading} />
        {!ehAluno && (
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
  divisor:          { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
});