// Chamadas HTTP para listar e lançar notas por disciplina

import type { AxiosError } from 'axios';
import { api } from './api';

// Uma linha da turma: dados do aluno + suas notas naquela disciplina
export type NotaTurma = {
  id:        number;
  aluno_id:  number;
  aluno:     string;
  matricula: string;
  nota1:     number | null;  // null = nota ainda não lançada
  nota2:     number | null;
  media:     number | null;
  situacao:  'Aprovado' | 'Exame' | 'Reprovado' | null;
};

// Resposta do GET /api/notas/disciplina/:id
export type RespostaNotasDisciplina = {
  disciplina: string;
  notas:      NotaTurma[];
};

// Payload enviado ao PUT /api/notas
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
  // Busca todas as notas dos alunos de uma disciplina
  listarPorDisciplina: async (disciplinaId: number): Promise<RespostaNotasDisciplina> => {
    try {
      const { data } = await api.get<RespostaNotasDisciplina>(`/api/notas/disciplina/${disciplinaId}`);
      return data;
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  },

  // Lança ou atualiza as notas de um aluno em uma disciplina (upsert no backend)
  lancar: async (dados: DadosLancamento): Promise<void> => {
    try {
      await api.put('/api/notas', dados);
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  },
};