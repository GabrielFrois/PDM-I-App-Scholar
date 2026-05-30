import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useBoletim } from '../hooks/useBoletim';
import { cadastroService, type AlunoListagem } from '../services/cadastroService';
import type { Nota } from '../services/boletimService';
import { theme } from '../styles/theme';

const ALUNOS_POR_PAGINA = 8;

function corSituacao(situacao: Nota['situacao']) {
  switch (situacao) {
    case 'Aprovado':  return { fundo: '#E6F4EA', texto: theme.colors.success };
    case 'Exame':     return { fundo: '#FEF3E2', texto: theme.colors.warning };
    case 'Reprovado': return { fundo: '#FCE8E6', texto: theme.colors.danger  };
  }
}

export default function BoletimScreen() {
  const { user } = useAuth();
  const perfil = user?.perfil ?? 'aluno';

  const [inputMatricula, setInputMatricula] = useState('');
  const [matriculaBusca, setMatriculaBusca] = useState<string | undefined>(
    perfil === 'aluno' ? user?.matricula : undefined,
  );

  const [alunos,           setAlunos]           = useState<AlunoListagem[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [pagina,           setPagina]           = useState(1);

  const { notas, nomeAluno, curso, carregando, erro, aprovadas, reprovadas, emExame } =
    useBoletim(matriculaBusca);

  useEffect(() => {
    if (perfil !== 'admin') return;
    setCarregandoAlunos(true);
    cadastroService.listarAlunos()
      .then((lista) => {
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
  }, []);

  const handleBuscar = () => {
    const valor = inputMatricula.trim();
    if (valor) {
      setMatriculaBusca(valor);
      setPagina(1);
    }
  };

  const selecionarAluno = (aluno: AlunoListagem) => {
    setInputMatricula(aluno.matricula);
    setMatriculaBusca(aluno.matricula);
    setPagina(1);
  };

  const alunosFiltrados = alunos.filter((a) => {
    const termo = inputMatricula.trim().toLowerCase();
    if (!termo) return true;
    return (
      a.matricula.toLowerCase().includes(termo) ||
      a.nome.toLowerCase().includes(termo)
    );
  });

  const totalPaginas = Math.ceil(alunosFiltrados.length / ALUNOS_POR_PAGINA);
  const alunosPagina = alunosFiltrados.slice(
    (pagina - 1) * ALUNOS_POR_PAGINA,
    pagina * ALUNOS_POR_PAGINA,
  );

  const mostrarListaAlunos = perfil === 'admin' && !matriculaBusca;
  const mostrarBoletim     = !!matriculaBusca && !carregando && !erro;

  // Nome exibido no cabeçalho do boletim
  const nomeExibido = perfil === 'aluno' ? (user?.nome ?? '') : (nomeAluno ?? `Matrícula: ${matriculaBusca}`);
  const cursoExibido = curso ?? '';

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campo de busca (admin / professor) */}
        {perfil !== 'aluno' && (
          <View style={estilos.buscaContainer}>
            <TextInput
              style={estilos.buscaInput}
              placeholder="Buscar por matrícula ou nome"
              placeholderTextColor={theme.colors.textSecondary}
              value={inputMatricula}
              onChangeText={(v) => {
                setInputMatricula(v);
                if (!v.trim()) {
                  setMatriculaBusca(undefined);
                  setPagina(1);
                }
              }}
              returnKeyType="search"
              onSubmitEditing={handleBuscar}
            />
            <TouchableOpacity style={estilos.buscaBotao} onPress={handleBuscar}>
              <Text style={estilos.buscaBotaoTexto}>Buscar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista paginada de alunos (admin, antes de selecionar) */}
        {mostrarListaAlunos && (
          <>
            <View style={estilos.listaHeader}>
              <Text style={estilos.listaTitulo}>Alunos cadastrados</Text>
              <Text style={estilos.listaTotal}>
                {alunosFiltrados.length} aluno{alunosFiltrados.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {carregandoAlunos ? (
              <View style={estilos.containerCentro}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : alunosFiltrados.length === 0 ? (
              <Text style={estilos.textoSecundario}>Nenhum aluno encontrado.</Text>
            ) : (
              <>
                {alunosPagina.map((aluno) => (
                  <TouchableOpacity
                    key={aluno.id}
                    style={estilos.cardAluno}
                    onPress={() => selecionarAluno(aluno)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.cardAlunoNome} numberOfLines={1}>{aluno.nome}</Text>
                      <Text style={estilos.cardAlunoInfo}>Matrícula: {aluno.matricula}</Text>
                      <Text style={estilos.cardAlunoInfo}>{aluno.curso}</Text>
                    </View>
                    <Text style={estilos.cardAlunoSeta}>›</Text>
                  </TouchableOpacity>
                ))}

                {totalPaginas > 1 && (
                  <View style={estilos.paginacao}>
                    <TouchableOpacity
                      style={[estilos.pagBotao, pagina === 1 && estilos.pagBotaoDisabled]}
                      onPress={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                    >
                      <Text style={[estilos.pagBotaoTexto, pagina === 1 && estilos.pagTextoDisabled]}>
                        ‹ Anterior
                      </Text>
                    </TouchableOpacity>
                    <Text style={estilos.pagInfo}>{pagina} / {totalPaginas}</Text>
                    <TouchableOpacity
                      style={[estilos.pagBotao, pagina === totalPaginas && estilos.pagBotaoDisabled]}
                      onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={pagina === totalPaginas}
                    >
                      <Text style={[estilos.pagBotaoTexto, pagina === totalPaginas && estilos.pagTextoDisabled]}>
                        Próximo ›
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Placeholder professor sem busca */}
        {!matriculaBusca && perfil === 'professor' && (
          <View style={estilos.containerCentro}>
            <Text style={estilos.textoSecundario}>Digite a matrícula para consultar o boletim.</Text>
          </View>
        )}

        {/* Carregando */}
        {carregando && (
          <View style={estilos.containerCentro}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={estilos.textoCarregando}>Carregando boletim...</Text>
          </View>
        )}

        {/* Erro */}
        {!carregando && erro && (
          <View style={estilos.containerCentro}>
            <Text style={{ color: theme.colors.danger, textAlign: 'center' }}>{erro}</Text>
          </View>
        )}

        {/* Boletim */}
        {mostrarBoletim && (
          <>
            <View style={estilos.cabecalho}>
              <Text style={estilos.cabecalhoTitulo}>Boletim Acadêmico</Text>
              <Text style={estilos.cabecalhoNome}>{nomeExibido}</Text>
              {cursoExibido ? (
                <Text style={estilos.cabecalhoSemestre}>{cursoExibido}</Text>
              ) : null}
            </View>

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
              <Text style={estilos.textoSecundario}>Nenhuma nota encontrada para esta matrícula.</Text>
            ) : (
              <>
                <View style={estilos.cabecalhoTabela}>
                  <Text style={[estilos.coluna, estilos.colunaDisciplina, estilos.cabecalhoTabelaTexto]}>Disciplina</Text>
                  <Text style={[estilos.coluna, estilos.colunaNota,       estilos.cabecalhoTabelaTexto]}>N1</Text>
                  <Text style={[estilos.coluna, estilos.colunaNota,       estilos.cabecalhoTabelaTexto]}>N2</Text>
                  <Text style={[estilos.coluna, estilos.colunaNota,       estilos.cabecalhoTabelaTexto]}>Méd.</Text>
                  <Text style={[estilos.coluna, estilos.colunaSituacao,   estilos.cabecalhoTabelaTexto]}>Situação</Text>
                </View>

                {notas.map((item, index) => {
                  const cor = corSituacao(item.situacao);
                  return (
                    <View key={item.id} style={[estilos.linha, index % 2 === 0 ? estilos.linhaPar : estilos.linhaImpar]}>
                      <Text style={[estilos.coluna, estilos.colunaDisciplina, estilos.celula]} numberOfLines={2}>{item.disciplina}</Text>
                      <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula]}>{Number(item.nota1).toFixed(1)}</Text>
                      <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula]}>{Number(item.nota2).toFixed(1)}</Text>
                      <Text style={[estilos.coluna, estilos.colunaNota, estilos.celula, estilos.media]}>{Number(item.media).toFixed(1)}</Text>
                      <View style={[estilos.coluna, estilos.colunaSituacao, estilos.colunaAlinhada]}>
                        <View style={[estilos.badge, { backgroundColor: cor.fundo }]}>
                          <Text style={[estilos.badgeTexto, { color: cor.texto }]}>{item.situacao}</Text>
                        </View>
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