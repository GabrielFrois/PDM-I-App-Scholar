// Comportamento por perfil:
// aluno: carrega automaticamente o próprio boletim (matrícula vem do token)
// admin: exibe lista paginada de alunos; ao clicar em um, abre o boletim
// professor: campo de busca por matrícula

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useAuth } from '../contexts/AuthContext';
import { useBoletim } from '../hooks/useBoletim';
import { cadastroService, type AlunoListagem } from '../services/cadastroService';
import type { Nota } from '../services/boletimService';
import { theme } from '../styles/theme';

// Quantos alunos mostrar por página na lista do admin
const ALUNOS_POR_PAGINA = 8;

// Formata um valor de nota para uma casa decimal; retorna '—' se nulo
function formatarNota(valor: number | null | undefined): string {
  if (valor == null) return '—';
  return Number(valor).toFixed(1);
}

// Retorna as cores de fundo e texto para o badge de situação, ou null se sem situação
function corSituacao(situacao: Nota['situacao']): { fundo: string; texto: string } | null {
  switch (situacao) {
    case 'Aprovado':  return { fundo: '#E6F4EA', texto: theme.colors.success };
    case 'Exame':     return { fundo: '#FEF3E2', texto: theme.colors.warning };
    case 'Reprovado': return { fundo: '#FCE8E6', texto: theme.colors.danger  };
    default:          return null;
  }
}

export default function BoletimScreen() {
  const { user } = useAuth();
  const perfil    = user?.perfil ?? 'aluno';
  const navegacao = useNavigation();

  // Para o professor: matrícula digitada no campo de busca
  const [inputMatricula, setInputMatricula] = useState('');

  // Matrícula que de fato está sendo consultada.
  // Para o aluno já é inicializada com a matrícula do token; para admin/professor começa undefined.
  const [matriculaBusca, setMatriculaBusca] = useState<string | undefined>(
    perfil === 'aluno' ? user?.matricula : undefined,
  );

  // Lista completa de alunos (apenas admin)
  const [alunos,           setAlunos]           = useState<AlunoListagem[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  // Texto do campo de filtro da lista de alunos (admin)
  const [filtroAlunos, setFiltroAlunos] = useState('');

  // Controle de paginação da lista de alunos (admin)
  const [pagina, setPagina] = useState(1);

  // Hook que busca o boletim no backend sempre que `matriculaBusca` mudar
  const { notas, nomeAluno, curso, carregando, erro, aprovadas, reprovadas, emExame } =
    useBoletim(matriculaBusca);

  // Lógica do botão de voltar do header:
  // admin com boletim aberto -> volta para a lista de alunos (limpa `matriculaBusca`)
  // qualquer outro caso -> sai da tela normalmente
  const handleVoltar = useCallback(() => {
    if (perfil === 'admin' && matriculaBusca) {
      setMatriculaBusca(undefined);
      setInputMatricula('');
      setPagina(1);
    } else {
      navegacao.goBack();
    }
  }, [perfil, matriculaBusca, navegacao]);

  // Sobrescreve o botão de voltar nativo do header com nossa lógica customizada.
  // useLayoutEffect garante que a atualização acontece antes da renderização visual.
  useLayoutEffect(() => {
    navegacao.setOptions({
      headerTitleAlign: 'center',
      headerLeft: () => (
        <HeaderBackButton onPress={handleVoltar} tintColor="#FFFFFF" style={{ marginLeft: -8 }} />
      ),
    });
  }, [navegacao, handleVoltar]);

  // Carrega a lista de alunos assim que a tela monta (somente para admin)
  useEffect(() => {
    if (perfil !== 'admin') return;
    setCarregandoAlunos(true);
    cadastroService.listarAlunos()
      .then((lista) => {
        // Ordena por número de matrícula (numérico quando possível, lexicográfico como fallback)
        const ordenados = [...lista].sort((a, b) => {
          const na = parseInt(a.matricula, 10);
          const nb = parseInt(b.matricula, 10);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return a.matricula.localeCompare(b.matricula);
        });
        setAlunos(ordenados);
      })
      .catch(() => {})
      .finally(() => setCarregandoAlunos(false));
  }, [perfil]);

  // Acionado pelo botão "Buscar" (fluxo do professor)
  const handleBuscar = () => {
    const valor = inputMatricula.trim();
    if (valor) { setMatriculaBusca(valor); setPagina(1); }
  };

  // Acionado ao clicar em um aluno da lista (fluxo do admin)
  const selecionarAluno = (aluno: AlunoListagem) => {
    setMatriculaBusca(aluno.matricula);
    setPagina(1);
  };

  // Filtra a lista de alunos pelo texto digitado no campo de busca do admin
  const alunosFiltrados = alunos.filter((a) => {
    const termo = filtroAlunos.trim().toLowerCase();
    if (!termo) return true;
    return a.matricula.toLowerCase().includes(termo) || a.nome.toLowerCase().includes(termo);
  });

  // Fatia da lista de alunos para a página atual
  const totalPaginas = Math.ceil(alunosFiltrados.length / ALUNOS_POR_PAGINA);
  const alunosPagina = alunosFiltrados.slice(
    (pagina - 1) * ALUNOS_POR_PAGINA,
    pagina * ALUNOS_POR_PAGINA,
  );

  // Flags derivadas de estado para controlar o que renderizar
  const mostrarListaAlunos = perfil === 'admin' && !matriculaBusca;
  const mostrarBoletim     = !!matriculaBusca && !carregando && !erro;

  // Nome e curso a exibir no cabeçalho do boletim
  const nomeExibido  = perfil === 'aluno' ? (user?.nome ?? '') : (nomeAluno ?? `Matrícula: ${matriculaBusca}`);
  const cursoExibido = curso ?? '';

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {perfil !== 'aluno' && !matriculaBusca && (
          <View style={estilos.buscaContainer}>
            <TextInput
              style={estilos.buscaInput}
              placeholder="Buscar por matrícula ou nome"
              placeholderTextColor={theme.colors.textSecondary}
              value={perfil === 'admin' ? filtroAlunos : inputMatricula}
              onChangeText={(v) => {
                if (perfil === 'admin') {
                  // Admin: filtra a lista em tempo real
                  setFiltroAlunos(v);
                  setPagina(1);
                  if (!v.trim() && matriculaBusca) setMatriculaBusca(undefined);
                } else {
                  // Professor: apenas atualiza o input; a busca é disparada manualmente
                  setInputMatricula(v);
                  if (!v.trim()) setMatriculaBusca(undefined);
                }
              }}
              returnKeyType="search"
              onSubmitEditing={perfil === 'professor' ? handleBuscar : undefined}
            />
            {/* Botão "Buscar" só aparece para professor (admin filtra em tempo real) */}
            {perfil === 'professor' && (
              <TouchableOpacity style={estilos.buscaBotao} onPress={handleBuscar}>
                <Text style={estilos.buscaBotaoTexto}>Buscar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lista paginada de alunos, visível apenas para admin antes de selecionar um aluno */}
        {mostrarListaAlunos && (
          <>
            <View style={estilos.listaHeader}>
              <Text style={estilos.listaTitulo}>Alunos cadastrados</Text>
              <Text style={estilos.listaTotal}>{alunosFiltrados.length} aluno{alunosFiltrados.length !== 1 ? 's' : ''}</Text>
            </View>

            {carregandoAlunos ? (
              <View style={estilos.containerCentro}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
            ) : alunosFiltrados.length === 0 ? (
              <Text style={estilos.textoSecundario}>Nenhum aluno encontrado.</Text>
            ) : (
              <>
                {alunosPagina.map((aluno) => (
                  <TouchableOpacity key={aluno.id} style={estilos.cardAluno} onPress={() => selecionarAluno(aluno)} activeOpacity={0.75}>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.cardAlunoNome} numberOfLines={1}>{aluno.nome}</Text>
                      <Text style={estilos.cardAlunoInfo}>Matrícula: {aluno.matricula}</Text>
                      <Text style={estilos.cardAlunoInfo}>{aluno.curso}</Text>
                    </View>
                    <Text style={estilos.cardAlunoSeta}>›</Text>
                  </TouchableOpacity>
                ))}

                {/* Controles de paginação, só aparecem se houver mais de uma página */}
                {totalPaginas > 1 && (
                  <View style={estilos.paginacao}>
                    <TouchableOpacity style={[estilos.pagBotao, pagina === 1 && estilos.pagBotaoDisabled]}
                      onPress={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}>
                      <Text style={[estilos.pagBotaoTexto, pagina === 1 && estilos.pagTextoDisabled]}>‹ Anterior</Text>
                    </TouchableOpacity>
                    <Text style={estilos.pagInfo}>{pagina} / {totalPaginas}</Text>
                    <TouchableOpacity style={[estilos.pagBotao, pagina === totalPaginas && estilos.pagBotaoDisabled]}
                      onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                      <Text style={[estilos.pagBotaoTexto, pagina === totalPaginas && estilos.pagTextoDisabled]}>Próximo ›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Instrução para professor antes de digitar uma matrícula */}
        {!matriculaBusca && perfil === 'professor' && (
          <View style={estilos.containerCentro}>
            <Text style={estilos.textoSecundario}>Digite a matrícula para consultar o boletim.</Text>
          </View>
        )}

        {/* Spinner de carregamento do boletim */}
        {carregando && (
          <View style={estilos.containerCentro}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={estilos.textoCarregando}>Carregando boletim...</Text>
          </View>
        )}

        {/* Mensagem de erro retornada pela API */}
        {!carregando && erro && (
          <View style={estilos.containerCentro}>
            <Text style={{ color: theme.colors.danger, textAlign: 'center' }}>{erro}</Text>
          </View>
        )}

        {/* Boletim */}
        {mostrarBoletim && (
          <>
            {/* Cabeçalho colorido com nome e curso do aluno */}
            <View style={estilos.cabecalho}>
              <Text style={estilos.cabecalhoTitulo}>Boletim Acadêmico</Text>
              <Text style={estilos.cabecalhoNome}>{nomeExibido}</Text>
              {cursoExibido ? <Text style={estilos.cabecalhoSemestre}>{cursoExibido}</Text> : null}
            </View>

            {/* Cards de resumo: totais por situação */}
            <View style={estilos.resumo}>
              <View style={[estilos.resumoItem, { backgroundColor: '#E6F4EA' }]}>
                <Text style={[estilos.resumoNumero, { color: theme.colors.success }]}>{aprovadas}</Text>
                <Text style={estilos.resumoRotulo}>Aprovado</Text>
              </View>
              <View style={[estilos.resumoItem, { backgroundColor: '#FEF3E2' }]}>
                <Text style={[estilos.resumoNumero, { color: theme.colors.warning }]}>{emExame}</Text>
                <Text style={estilos.resumoRotulo}>Exame</Text>
              </View>
              <View style={[estilos.resumoItem, { backgroundColor: '#FCE8E6' }]}>
                <Text style={[estilos.resumoNumero, { color: theme.colors.danger }]}>{reprovadas}</Text>
                <Text style={estilos.resumoRotulo}>Reprovado</Text>
              </View>
            </View>

            {notas.length === 0 ? (
              <Text style={estilos.textoSecundario}>Nenhuma disciplina matriculada encontrada.</Text>
            ) : (
              <>
                {/* Cabeçalho da tabela de notas */}
                <View style={estilos.cabecalhoTabela}>
                  <Text style={[estilos.coluna, estilos.colunaDisciplina, estilos.cabecalhoTabelaTexto]}>Disciplina</Text>
                  <Text style={[estilos.coluna, estilos.colunaNota,       estilos.cabecalhoTabelaTexto]}>N1</Text>
                  <Text style={[estilos.coluna, estilos.colunaNota,       estilos.cabecalhoTabelaTexto]}>N2</Text>
                  <Text style={[estilos.coluna, estilos.colunaNota,       estilos.cabecalhoTabelaTexto]}>Méd.</Text>
                  <Text style={[estilos.coluna, estilos.colunaSituacao,   estilos.cabecalhoTabelaTexto]}>Situação</Text>
                </View>

                {/* Uma linha por disciplina */}
                {notas.map((item, index) => {
                  const cor = corSituacao(item.situacao);
                  return (
                    <View key={item.id ?? item.disciplina} style={[estilos.linha, index % 2 === 0 ? estilos.linhaPar : estilos.linhaImpar]}>
                      <Text style={[estilos.coluna, estilos.colunaDisciplina, estilos.celula]} numberOfLines={2}>{item.disciplina}</Text>
                      <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula]}>{formatarNota(item.nota1)}</Text>
                      <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula]}>{formatarNota(item.nota2)}</Text>
                      <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula, estilos.media]}>{formatarNota(item.media)}</Text>
                      <View style={[estilos.coluna, estilos.colunaSituacao, estilos.colunaAlinhada]}>
                        {cor ? (
                          // Badge colorido quando a situação já foi calculada
                          <View style={[estilos.badge, { backgroundColor: cor.fundo }]}>
                            <Text style={[estilos.badgeTexto, { color: cor.texto }]}>{item.situacao}</Text>
                          </View>
                        ) : (
                          // Traço quando as notas ainda não foram lançadas
                          <Text style={[estilos.celula, { color: theme.colors.textSecondary }]}>—</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:             { flex: 1, backgroundColor: theme.colors.background },
  scroll:               { flex: 1 },
  conteudo:             { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  buscaContainer:       { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  buscaInput:           { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: theme.font.md, color: theme.colors.text },
  buscaBotao:           { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.md, justifyContent: 'center' },
  buscaBotaoTexto:      { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.md },
  listaHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  listaTitulo:          { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  listaTotal:           { fontSize: theme.font.sm, color: theme.colors.textSecondary },
  cardAluno:            { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardAlunoNome:        { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text },
  cardAlunoInfo:        { fontSize: theme.font.sm, color: theme.colors.textSecondary, marginTop: 1 },
  cardAlunoSeta:        { fontSize: 24, color: theme.colors.primary, marginLeft: theme.spacing.sm },
  paginacao:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md },
  pagBotao:             { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.sm },
  pagBotaoDisabled:     { backgroundColor: theme.colors.border },
  pagBotaoTexto:        { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  pagTextoDisabled:     { color: theme.colors.textSecondary },
  pagInfo:              { fontSize: theme.font.sm, color: theme.colors.textSecondary, fontWeight: '600' },
  containerCentro:      { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl, gap: theme.spacing.md },
  textoCarregando:      { fontSize: theme.font.md, color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
  textoSecundario:      { fontSize: theme.font.md, color: theme.colors.textSecondary, textAlign: 'center' },
  cabecalho:            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  cabecalhoTitulo:      { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.white },
  cabecalhoNome:        { fontSize: theme.font.md, color: 'rgba(255,255,255,0.9)', marginTop: theme.spacing.xs },
  cabecalhoSemestre:    { fontSize: theme.font.sm, color: 'rgba(255,255,255,0.7)', marginTop: theme.spacing.xs },
  resumo:               { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  resumoItem:           { flex: 1, borderRadius: theme.radius.sm, padding: theme.spacing.md, alignItems: 'center' },
  resumoNumero:         { fontSize: theme.font.xl, fontWeight: '800' },
  resumoRotulo:         { fontSize: theme.font.sm - 1, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'center' },
  cabecalhoTabela:      { flexDirection: 'row', backgroundColor: theme.colors.primary, borderTopLeftRadius: theme.radius.sm, borderTopRightRadius: theme.radius.sm, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm },
  cabecalhoTabelaTexto: { color: theme.colors.white, fontWeight: '700', fontSize: theme.font.sm },
  linha:                { flexDirection: 'row', paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, alignItems: 'center', minHeight: 52 },
  linhaPar:             { backgroundColor: theme.colors.surface },
  linhaImpar:           { backgroundColor: '#F8FAFF' },
  coluna:               { paddingHorizontal: 2 },
  colunaDisciplina:     { flex: 2.5 },
  colunaNota:           { flex: 1, textAlign: 'center' },
  colunaSituacao:       { flex: 2 },
  colunaAlinhada:       { alignItems: 'center' },
  celula:               { fontSize: theme.font.sm, color: theme.colors.text, textAlign: 'center' },
  media:                { fontWeight: '700' },
  badge:                { paddingHorizontal: theme.spacing.xs, paddingVertical: 3, borderRadius: theme.radius.full },
  badgeTexto:           { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});