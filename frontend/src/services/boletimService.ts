import type { AxiosError } from 'axios';
import { api } from './api';

export type Nota = {
  id:        number;
  disciplina: string;
  nota1:     number;
  nota2:     number;
  media:     number;
  situacao:  'Aprovado' | 'Exame' | 'Reprovado';
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
      const error = err as AxiosError<{ erro: string }>;
      const mensagem = error.response?.data?.erro ?? 'Erro ao carregar boletim.';
      throw new Error(mensagem);
    }
  },
};