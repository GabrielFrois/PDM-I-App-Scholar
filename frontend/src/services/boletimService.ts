import type { AxiosError } from 'axios';
import { api } from './api';

// nota1, nota2, media e situacao são nullable
export type Nota = {
  id:         number;
  disciplina: string;
  semestre:   string;
  nota1:      number | null;
  nota2:      number | null;
  media:      number | null;
  situacao:   'Aprovado' | 'Exame' | 'Reprovado' | null;
};

export type RespostaBoletim = {
  aluno:       string;
  matricula:   string;
  curso:       string;
  disciplinas: Nota[];
};

export const boletimService = {
  buscarBoletim: async (matricula: string): Promise<RespostaBoletim> => {
    try {
      const { data } = await api.get<RespostaBoletim>(`/api/boletim/${matricula}`);
      return data;
    } catch (err) {
      const error    = err as AxiosError<{ erro: string }>;
      const mensagem = error.response?.data?.erro ?? 'Erro ao carregar boletim.';
      throw new Error(mensagem);
    }
  },
};