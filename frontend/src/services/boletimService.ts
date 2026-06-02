// Busca o boletim completo de um aluno pelo número de matrícula

import type { AxiosError } from 'axios';
import { api } from './api';

// Uma linha do boletim: disciplina + notas + média + situação
export type Nota = {
  id:         number;
  disciplina: string;
  semestre:   string;
  nota1:      number;
  nota2:      number;
  media:      number;
  situacao:   'Aprovado' | 'Exame' | 'Reprovado';
};

// Resposta completa do endpoint GET /api/boletim/:matricula
export type RespostaBoletim = {
  aluno:       string;
  matricula:   string;
  curso:       string;
  disciplinas: Nota[];
};

export const boletimService = {
  // Chama o backend e retorna o boletim; lança Error com mensagem legível em caso de falha
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