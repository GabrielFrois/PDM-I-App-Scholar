import type { AxiosError } from 'axios';
import { api } from './api';

export type DadosAluno = {
  nome: string; matricula: string; cursoId: string; email: string;
  telefone: string; cep: string; endereco: string; cidade: string; estado: string;
  senha?: string;
};

export type DadosProfessor = {
  nome: string; titulacao: string; areaAtuacao: string; tempoDocencia: string; email: string;
  senha?: string;
};

// curso agora é cursoId (FK) em vez de texto livre
export type DadosDisciplina = {
  nomeDisciplina: string; cargaHoraria: string;
  professorId: string;
  cursoId: string;
  semestre: string;
};

export type AlunoListagem = {
  id: number; nome: string; matricula: string;
  curso_id: number | null; curso: string | null;
  email: string; cidade: string; estado: string;
  telefone?: string; cep?: string; endereco?: string;
};

export type ProfessorListagem = {
  id: number; nome: string; titulacao: string; area: string;
  tempo_docencia: number; email: string;
};

export type DisciplinaListagem = {
  id: number; nome: string; carga_horaria: number;
  professor_id: number | null; professor: string | null;
  curso_id: number | null; curso: string | null;
  semestre: string;
};

export type RespostaPaginada<T> = {
  dados: T[]; total: number; pagina: number; limite: number;
};

export type CursoListagem = {
  id: number;
  nome: string;
  area: string;
  duracao_sem: number;
  coordenador_id: number | null;
  coordenador: string | null;
  descricao: string | null;
};

export type CursoSimples = {
  id: number;
  nome: string;
};

export type DadosCurso = {
  nome: string;
  area: string;
  duracaoSem: string;
  coordenadorId: string;
  descricao: string;
};

function extrairMensagemErro(err: unknown): string {
  const error = err as AxiosError<{ erro: string }>;
  return error.response?.data?.erro ?? 'Erro ao salvar. Tente novamente.';
}

export const cadastroService = {

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

  buscarAlunoPorEmail: async (email: string): Promise<AlunoListagem | null> => {
    try {
      const { data } = await api.get<AlunoListagem | null>('/api/alunos', { params: { email } });
      return data;
    } catch { return null; }
  },

  listarAlunos: async (pagina = 1, limite = 200): Promise<AlunoListagem[]> => {
    try {
      const { data } = await api.get<RespostaPaginada<AlunoListagem>>('/api/alunos', { params: { pagina, limite } });
      return data.dados;
    } catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

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

  // Cursos

  salvarCurso: async (dados: DadosCurso) => {
    try { await api.post('/api/cursos', dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  atualizarCurso: async (id: number, dados: DadosCurso) => {
    try { await api.put(`/api/cursos/${id}`, dados); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  removerCurso: async (id: number) => {
    try { await api.delete(`/api/cursos/${id}`); }
    catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  listarCursos: async (pagina = 1, limite = 200): Promise<CursoListagem[]> => {
    try {
      const { data } = await api.get<RespostaPaginada<CursoListagem>>('/api/cursos', { params: { pagina, limite } });
      return data.dados;
    } catch (err) { throw new Error(extrairMensagemErro(err)); }
  },

  listarCursosSimples: async (): Promise<CursoSimples[]> => {
    try {
      const { data } = await api.get<CursoSimples[]>('/api/cursos', { params: { simples: true } });
      return data;
    } catch { return []; }
  },
};