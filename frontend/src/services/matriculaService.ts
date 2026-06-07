import type { AxiosError } from 'axios';
import { api } from './api';

export type DisciplinaMatricula = {
  id:            number;
  nome:          string;
  semestre:      string;
  carga_horaria: number;
  curso:         string;
  professor:     string | null;
};

export type RespostaMatriculas = {
  aluno:       string;
  disciplinas: DisciplinaMatricula[];
  ids:         number[]; // ids das disciplinas em que o aluno já está matriculado
};

function extrairErro(err: unknown): string {
  const e = err as AxiosError<{ erro: string }>;
  return e.response?.data?.erro ?? 'Erro ao realizar operação. Tente novamente.';
}

export const matriculaService = {
  // Busca as matrículas atuais de um aluno e os ids para os checkboxes
  buscarPorAluno: async (alunoId: number): Promise<RespostaMatriculas> => {
    try {
      const { data } = await api.get<RespostaMatriculas>(`/api/matriculas/${alunoId}`);
      return data;
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  },

  // Salva o estado completo dos checkboxes (adiciona novas, remove desmarcadas)
  sincronizar: async (alunoId: number, disciplinaIds: number[]): Promise<void> => {
    try {
      await api.post('/api/matriculas/sincronizar', { alunoId, disciplinaIds });
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  },
};