import type { AxiosError } from 'axios';
import { api } from './api';

export type DadosAluno = {
  nome: string;
  matricula: string;
  curso: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
};

export type DadosProfessor = {
  nome: string;
  titulacao: string;
  areaAtuacao: string;
  tempoDocencia: string;
  email: string;
};

export type DadosDisciplina = {
  nomeDisciplina: string;
  cargaHoraria: string;
  professorResponsavel: string;
  curso: string;
  semestre: string;
};

function extrairMensagemErro(err: unknown): string {
  const error = err as AxiosError<{ erro: string }>;
  return error.response?.data?.erro ?? 'Erro ao salvar. Tente novamente.';
}

export const cadastroService = {
  salvarAluno: async (dados: DadosAluno): Promise<void> => {
    try {
      await api.post('/api/alunos', dados);
    } catch (err) {
      throw new Error(extrairMensagemErro(err));
    }
  },

  salvarProfessor: async (dados: DadosProfessor): Promise<void> => {
    try {
      await api.post('/api/professores', dados);
    } catch (err) {
      throw new Error(extrairMensagemErro(err));
    }
  },

  salvarDisciplina: async (dados: DadosDisciplina): Promise<void> => {
    try {
      await api.post('/api/disciplinas', dados);
    } catch (err) {
      throw new Error(extrairMensagemErro(err));
    }
  },
};