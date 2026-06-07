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
import { useAuth } from '../contexts/AuthContext';
import { useFormulario } from '../hooks/useFormulario';
import { useIBGE } from '../hooks/useIBGE';
import {
  cadastroService,
  type AlunoListagem,
  type DadosAluno,
  type DisciplinaListagem,
} from '../services/cadastroService';
import { matriculaService } from '../services/matriculaService';
import { theme } from '../styles/theme';

type Aba = 'lista' | 'dados' | 'matricula';

const VAZIO: DadosAluno = {
  nome: '', matricula: '', curso: '', email: '',
  telefone: '', cep: '', endereco: '', cidade: '', estado: '', senha: '',
};

const BLOQUEADOS_ALUNO = ['nome', 'matricula', 'curso', 'email'];

function agruparPorSemestre(disciplinas: DisciplinaListagem[]): Record<string, DisciplinaListagem[]> {
  return disciplinas.reduce<Record<string, DisciplinaListagem[]>>((acc, d) => {
    const sem = d.semestre ?? 'Sem semestre';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(d);
    return acc;
  }, {});
}

export default function CadastroAlunoScreen() {
  const { user }  = useAuth();
  const navegacao = useNavigation();
  const ehAluno   = user?.perfil === 'aluno';

  const [aba, setAba]                           = useState<Aba>(ehAluno ? 'dados' : 'lista');
  const [alunoId, setAlunoId]                   = useState<number | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoListagem | null>(null);
  const [loading, setLoading]                   = useState(false);
  const [carregando, setCarregando]             = useState(ehAluno);
  const [buscandoCep, setBuscandoCep]           = useState(false);

  const [alunos,          setAlunos]          = useState<AlunoListagem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [filtro,          setFiltro]          = useState('');

  const [disciplinas,    setDisciplinas]    = useState<DisciplinaListagem[]>([]);
  const [marcadas,       setMarcadas]       = useState<Set<number>>(new Set());
  const [carregandoDisc, setCarregandoDisc] = useState(false);
  const [salvandoMat,    setSalvandoMat]    = useState(false);
  const [feedbackMat,    setFeedbackMat]    = useState<{ texto: string; erro: boolean } | null>(null);

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
      senha:    () => '',
    });

  const { estados, cidades, carregandoEstados, carregandoCidades } = useIBGE(formulario.estado || null);
  const opcoesEstados: OpcaoSelect[] = estados.map((e) => ({ label: `${e.sigla} — ${e.nome}`, value: e.sigla }));
  const opcoesCidades: OpcaoSelect[] = cidades.map((c) => ({ label: c.nome, value: c.nome }));

  const bloqueado = (campo: string) => ehAluno && BLOQUEADOS_ALUNO.includes(campo);

  const voltarParaLista = useCallback(() => {
    setAlunoId(null);
    setAlunoSelecionado(null);
    setFeedbackMat(null);
    resetar();
    setAba('lista');
  }, [resetar]);

  useLayoutEffect(() => {
    if (ehAluno) return;
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
  }, [aba, navegacao, voltarParaLista, ehAluno]);

  useEffect(() => {
    if (!ehAluno || !user?.email) return;
    (async () => {
      try {
        const aluno = await cadastroService.buscarAlunoPorEmail(user!.email);
        if (aluno) {
          setAlunoId(aluno.id);
          preencherFormulario({
            nome:      aluno.nome      ?? '',
            matricula: aluno.matricula ?? '',
            curso:     aluno.curso     ?? '',
            email:     aluno.email     ?? '',
            telefone:  aluno.telefone  ?? '',
            cep:       aluno.cep       ?? '',
            endereco:  aluno.endereco  ?? '',
            cidade:    aluno.cidade    ?? '',
            estado:    aluno.estado    ?? '',
            senha:     '',
          });
        }
      } catch { }
      finally { setCarregando(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehAluno, user?.email]);

  const carregarLista = useCallback(async () => {
    setCarregandoLista(true);
    try { setAlunos(await cadastroService.listarAlunos()); }
    catch { }
    finally { setCarregandoLista(false); }
  }, []);

  useEffect(() => {
    if (!ehAluno) {
      carregarLista();
      cadastroService.listarDisciplinas().then(setDisciplinas).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehAluno]);

  const abrirMatricula = async (aluno: AlunoListagem) => {
    setAlunoSelecionado(aluno);
    setFeedbackMat(null);
    setCarregandoDisc(true);
    setAba('matricula');
    try {
      const res = await matriculaService.buscarPorAluno(aluno.id);
      setMarcadas(new Set(res.ids));
    } catch {
      setMarcadas(new Set());
    } finally {
      setCarregandoDisc(false);
    }
  };

  const abrirEdicao = (aluno: AlunoListagem) => {
    setAlunoId(aluno.id);
    setAlunoSelecionado(aluno);
    preencherFormulario({
      nome:      aluno.nome      ?? '',
      matricula: aluno.matricula ?? '',
      curso:     aluno.curso     ?? '',
      email:     aluno.email     ?? '',
      telefone:  aluno.telefone  ?? '',
      cep:       aluno.cep       ?? '',
      endereco:  aluno.endereco  ?? '',
      cidade:    aluno.cidade    ?? '',
      estado:    aluno.estado    ?? '',
      senha:     '',
    });
    setAba('dados');
  };

  const confirmarRemocao = (aluno: AlunoListagem) => {
    Alert.alert('Remover aluno', `Deseja remover ${aluno.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await cadastroService.removerAluno(aluno.id); await carregarLista(); }
        catch (err: any) { Alert.alert('Erro', err.message); }
      }},
    ]);
  };

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

  const handleSalvar = async () => {
    if (!validar()) return;
    if (!ehAluno && !alunoId) {
      const s = (formulario.senha ?? '').trim();
      if (s.length < 6) {
        Alert.alert('Senha inválida', 'Informe uma senha inicial com pelo menos 6 caracteres.');
        return;
      }
    }
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

  const toggleDisciplina = (id: number) => {
    setMarcadas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const salvarMatriculas = async () => {
    if (!alunoSelecionado) return;
    setSalvandoMat(true);
    setFeedbackMat(null);
    try {
      await matriculaService.sincronizar(alunoSelecionado.id, Array.from(marcadas));
      setFeedbackMat({ texto: 'Matrículas salvas com sucesso!', erro: false });
    } catch (err: any) {
      setFeedbackMat({ texto: err.message ?? 'Erro ao salvar.', erro: true });
    } finally {
      setSalvandoMat(false);
    }
  };

  // ── Spinner enquanto aluno carrega seus dados
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

  // ── ABA LISTA
  if (aba === 'lista') {
    const alunosFiltrados = alunos.filter(a => {
      const t = filtro.trim().toLowerCase();
      return !t || a.matricula.toLowerCase().includes(t) || a.nome.toLowerCase().includes(t);
    });

    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.listaContainer}>
          <View style={estilos.listaHeader}>
            <Text style={estilos.listaTitle}>
              {alunosFiltrados.length} aluno{alunosFiltrados.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={estilos.botaoNovo}
              onPress={() => { setAlunoId(null); setAlunoSelecionado(null); resetar(); setAba('dados'); }}>
              <Text style={estilos.botaoNovoTexto}>+ Novo</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.buscaContainer}>
            <TextInput
              style={estilos.buscaInput}
              placeholder="Buscar por nome ou matrícula"
              placeholderTextColor={theme.colors.textSecondary}
              value={filtro}
              onChangeText={setFiltro}
            />
          </View>

          {carregandoLista ? (
            <View style={estilos.centro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : alunosFiltrados.length === 0 ? (
            <View style={estilos.centro}>
              <Text style={estilos.textoVazio}>{filtro ? 'Nenhum resultado encontrado.' : 'Nenhum aluno cadastrado.'}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.listaScroll}>
              {alunosFiltrados.map((aluno) => (
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
                    <TouchableOpacity style={estilos.btnMatricula} onPress={() => abrirMatricula(aluno)}>
                      <Text style={estilos.btnMatriculaTexto}>Matrículas</Text>
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

  // ── ABA MATRÍCULA
  if (aba === 'matricula' && alunoSelecionado) {
    const grupos = agruparPorSemestre(disciplinas);
    const semestresOrdenados = Object.keys(grupos).sort();

    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={estilos.cabecalhoMatricula}>
            <Text style={estilos.cabecalhoTitulo}>Matrículas em Disciplinas</Text>
            <Text style={estilos.cabecalhoNome}>{alunoSelecionado.nome}</Text>
            <Text style={estilos.cabecalhoSub}>Matrícula: {alunoSelecionado.matricula}</Text>
          </View>

          {feedbackMat && (
            <View style={[estilos.feedback, feedbackMat.erro ? estilos.feedbackErro : estilos.feedbackSucesso]}>
              <Text style={[estilos.feedbackTexto, { color: feedbackMat.erro ? theme.colors.danger : theme.colors.success }]}>
                {feedbackMat.texto}
              </Text>
            </View>
          )}

          {carregandoDisc ? (
            <View style={estilos.centro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : (
            <>
              {semestresOrdenados.map(semestre => (
                <View key={semestre} style={estilos.grupoSemestre}>
                  <Text style={estilos.grupoTitulo}>{semestre}</Text>
                  {grupos[semestre].map(disc => {
                    const marcada = marcadas.has(disc.id);
                    return (
                      <TouchableOpacity key={disc.id}
                        style={[estilos.itemDisc, marcada && estilos.itemDiscMarcado]}
                        onPress={() => toggleDisciplina(disc.id)} activeOpacity={0.75}>
                        <View style={[estilos.checkbox, marcada && estilos.checkboxMarcado]}>
                          {marcada && <Text style={estilos.checkboxCheck}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[estilos.discNome, marcada && estilos.discNomeMarcado]}>{disc.nome}</Text>
                          <Text style={estilos.discInfo}>{disc.professor ?? 'Sem professor'} · {disc.carga_horaria}h</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {disciplinas.length === 0 && (
                <Text style={estilos.textoVazio}>Nenhuma disciplina cadastrada.</Text>
              )}

              <Text style={estilos.contador}>
                {marcadas.size} disciplina{marcadas.size !== 1 ? 's' : ''} selecionada{marcadas.size !== 1 ? 's' : ''}
              </Text>

              <TouchableOpacity
                style={[estilos.botaoSalvarMat, salvandoMat && estilos.botaoSalvarMatDisabled]}
                onPress={salvarMatriculas} disabled={salvandoMat}>
                {salvandoMat
                  ? <ActivityIndicator size="small" color={theme.colors.white} />
                  : <Text style={estilos.botaoSalvarMatTexto}>Salvar Matrículas</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ABA DADOS (formulário)
  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>

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

        {!ehAluno && !alunoId && (
          <InputField label="Senha *" placeholder="Mínimo 6 caracteres"
            value={formulario.senha ?? ''} onChangeText={(v) => atualizarCampo('senha', v)}
            secureTextEntry error={erros.senha} />
        )}

        <View style={estilos.divisor} />
        <Text style={estilos.secaoTitulo}>Endereço</Text>

        <InputField label="CEP *" placeholder="12345678"
          value={formulario.cep} onChangeText={(v) => atualizarCampo('cep', v)}
          onBlur={() => buscarCep(formulario.cep)}
          keyboardType="numeric" maxLength={8}
          hint={buscandoCep ? 'Buscando endereço...' : 'Digite o CEP para preencher automaticamente'}
          error={erros.cep} />

        <InputField label="Endereço *" placeholder="Rua, número, complemento"
          value={formulario.endereco} onChangeText={(v) => atualizarCampo('endereco', v)}
          error={erros.endereco} />

        <SelectField label="Estado *"
          placeholder={carregandoEstados ? 'Carregando estados...' : 'Selecione o estado'}
          opcoes={opcoesEstados} valor={formulario.estado}
          onChange={(v) => { atualizarCampo('estado', v); atualizarCampo('cidade', ''); }}
          disabled={carregandoEstados} error={erros.estado} />

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
  safeArea:              { flex: 1, backgroundColor: theme.colors.background },
  scroll:                { flex: 1 },
  conteudo:              { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  centro:                { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  textoCarga:            { fontSize: theme.font.md, color: theme.colors.textSecondary },
  textoVazio:            { fontSize: theme.font.md, color: theme.colors.textSecondary, textAlign: 'center' },
  listaContainer:        { flex: 1 },
  listaHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  listaTitle:            { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  listaScroll:           { padding: theme.spacing.lg, gap: theme.spacing.sm },
  buscaContainer:        { padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  buscaInput:            { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: theme.font.md, color: theme.colors.text },
  botaoNovo:             { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.radius.full },
  botaoNovoTexto:        { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  card:                  { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardInfo:              { gap: 3, marginBottom: theme.spacing.sm },
  cardNome:              { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  cardSub:               { fontSize: theme.font.sm, color: theme.colors.textSecondary },
  cardAcoes:             { flexDirection: 'row', gap: theme.spacing.xs, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm },
  btnEditar:             { flex: 1, backgroundColor: theme.colors.secondary, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnEditarTexto:        { fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  btnMatricula:          { flex: 1.2, backgroundColor: '#F3E8FD', paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnMatriculaTexto:     { fontSize: theme.font.sm, color: '#7B1FA2', fontWeight: '600' },
  btnRemover:            { flex: 1, backgroundColor: '#FCE8E6', paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: 'center' },
  btnRemoverTexto:       { fontSize: theme.font.sm, color: theme.colors.danger, fontWeight: '600' },
  aviso:                 { backgroundColor: '#E8F0FE', borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.md },
  avisoTexto:            { fontSize: theme.font.sm, color: theme.colors.primary },
  secaoTitulo:           { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
  divisor:               { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
  cabecalhoMatricula:    { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  cabecalhoTitulo:       { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.white },
  cabecalhoNome:         { fontSize: theme.font.md, color: 'rgba(255,255,255,0.9)', marginTop: theme.spacing.xs },
  cabecalhoSub:          { fontSize: theme.font.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  feedback:              { borderRadius: theme.radius.sm, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  feedbackSucesso:       { backgroundColor: '#E6F4EA' },
  feedbackErro:          { backgroundColor: '#FCE8E6' },
  feedbackTexto:         { fontSize: theme.font.md, fontWeight: '600', textAlign: 'center' },
  grupoSemestre:         { marginBottom: theme.spacing.lg },
  grupoTitulo:           { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.primary, marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.xs, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  itemDisc:              { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, padding: theme.spacing.md, marginBottom: theme.spacing.xs, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  itemDiscMarcado:       { borderColor: theme.colors.primary, backgroundColor: '#EEF4FF' },
  checkbox:              { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white },
  checkboxMarcado:       { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkboxCheck:         { color: theme.colors.white, fontSize: 13, fontWeight: '700' },
  discNome:              { fontSize: theme.font.md, fontWeight: '600', color: theme.colors.text },
  discNomeMarcado:       { color: theme.colors.primary },
  discInfo:              { fontSize: theme.font.sm, color: theme.colors.textSecondary, marginTop: 2 },
  contador:              { textAlign: 'center', fontSize: theme.font.sm, color: theme.colors.textSecondary, marginVertical: theme.spacing.md },
  botaoSalvarMat:        { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingVertical: theme.spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  botaoSalvarMatDisabled:{ opacity: 0.6 },
  botaoSalvarMatTexto:   { color: theme.colors.white, fontSize: theme.font.md, fontWeight: '700' },
});