import type { AxiosError } from 'axios';
import { api } from './api';

export type NotaTurma = {
  id:         number;
  aluno_id:   number;
  aluno:      string;
  matricula:  string;
  nota1:      number | null;
  nota2:      number | null;
  media:      number | null;
  situacao:   'Aprovado' | 'Exame' | 'Reprovado' | null;
};

export type RespostaNotasDisciplina = {
  disciplina: string;
  notas:      NotaTurma[];
};

export type DadosLancamento = {
  alunoId:      number;
  disciplinaId: number;
  nota1?:       number | null;
  nota2?:       number | null;
};

function extrairErro(err: unknown): string {
  const error = err as AxiosError<{ erro: string }>;
  return error.response?.data?.erro ?? 'Erro na operação. Tente novamente.';
}

export const notasService = {
  listarPorDisciplina: async (disciplinaId: number): Promise<RespostaNotasDisciplina> => {
    try {
      const { data } = await api.get<RespostaNotasDisciplina>(`/api/notas/disciplina/${disciplinaId}`);
      return data;
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  },

  lancar: async (dados: DadosLancamento): Promise<void> => {
    try {
      await api.put('/api/notas', dados);
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  },
};