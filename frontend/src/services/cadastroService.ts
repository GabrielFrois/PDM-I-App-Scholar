// Centraliza todas as chamadas HTTP para alunos, professores e disciplinas

import type { AxiosError } from 'axios';
import { api } from './api';

// Tipos de payload enviados ao backend nos formulários de cadastro

export type DadosAluno = {
  nome: string; matricula: string; curso: string; email: string;
  telefone: string; cep: string; endereco: string; cidade: string; estado: string;
};

export type DadosProfessor = {
  nome: string; titulacao: string; areaAtuacao: string; tempoDocencia: string; email: string;
};

export type DadosDisciplina = {
  nomeDisciplina: string; cargaHoraria: string;
  professorId: string;
  curso: string; semestre: string;
};

// Tipos de retorno da API nas listagens

export type AlunoListagem = {
  id: number; nome: string; matricula: string; curso: string;
  email: string; cidade: string; estado: string;
};

export type ProfessorListagem = {
  id: number; nome: string; titulacao: string; area: string;
  tempo_docencia: number; email: string;
};

export type DisciplinaListagem = {
  id: number; nome: string; carga_horaria: number;
  professor_id: number | null; professor: string | null;
  curso: string; semestre: string;
};

// Formato da resposta paginada retornada pelo backend
export type RespostaPaginada<T> = {
  dados: T[]; total: number; pagina: number; limite: number;
};

// Extrai a mensagem de erro do campo `erro` da resposta do backend
// Se não houver, usa mensagem genérica
function extrairMensagemErro(err: unknown): string {
  const error = err as AxiosError<{ erro: string }>;
  return error.response?.data?.erro ?? 'Erro ao salvar. Tente novamente.';
}

export const cadastroService = {

  // Alunos
  salvarAluno: async (dados: DadosAluno) => {
    try { await api.post('/api/alunos', dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  atualizarAluno: async (id: number, dados: DadosAluno) => {
    try { await api.put(`/api/alunos/${id}`, dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  removerAluno: async (id: number) => {
    try { await api.delete(`/api/alunos/${id}`); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  // Busca um aluno específico pelo e-mail (usado pelo aluno ao abrir seu cadastro)
  buscarAlunoPorEmail: async (email: string): Promise<(AlunoListagem & DadosAluno) | null> => {
    try {
      const { data } = await api.get<(AlunoListagem & DadosAluno) | null>('/api/alunos', { params: { email } });
      return data;
    } catch { return null; }
  },

  // Lista todos os alunos com limite alto para exibir tudo de uma vez na tela
  listarAlunos: async (pagina = 1, limite = 200): Promise<AlunoListagem[]> => {
    try {
      const { data } = await api.get<RespostaPaginada<AlunoListagem>>('/api/alunos', { params: { pagina, limite } });
      return data.dados;
    } catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  // Professores
  salvarProfessor: async (dados: DadosProfessor) => {
    try { await api.post('/api/professores', dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  atualizarProfessor: async (id: number, dados: DadosProfessor) => {
    try { await api.put(`/api/professores/${id}`, dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  removerProfessor: async (id: number) => {
    try { await api.delete(`/api/professores/${id}`); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  // Busca professor pelo e-mail (usado pelo professor ao abrir seu cadastro)
  buscarProfessorPorEmail: async (email: string): Promise<ProfessorListagem | null> => {
    try {
      const { data } = await api.get<ProfessorListagem | null>('/api/professores', { params: { email } });
      return data;
    } catch { return null; }
  },

  listarProfessores: async (pagina = 1, limite = 200): Promise<ProfessorListagem[]> => {
    try {
      const { data } = await api.get<RespostaPaginada<ProfessorListagem>>('/api/professores', { params: { pagina, limite } });
      return data.dados;
    } catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  // Disciplinas
  salvarDisciplina: async (dados: DadosDisciplina) => {
    try { await api.post('/api/disciplinas', dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  atualizarDisciplina: async (id: number, dados: DadosDisciplina) => {
    try { await api.put(`/api/disciplinas/${id}`, dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  removerDisciplina: async (id: number) => {
    try { await api.delete(`/api/disciplinas/${id}`); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  listarDisciplinas: async (pagina = 1, limite = 200): Promise<DisciplinaListagem[]> => {
    try {
      const { data } = await api.get<RespostaPaginada<DisciplinaListagem>>('/api/disciplinas', { params: { pagina, limite } });
      return data.dados;
    } catch (err) { throw new Error(extrairMensagemErro(err)); }
  },
};