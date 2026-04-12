export type Nota = {
  id: number;
  disciplina: string;
  nota1: number;
  nota2: number;
  media: number;
  situacao: 'Aprovado' | 'Exame' | 'Reprovado';
};

// Dados simulados para visualização
const BOLETIM_MOCK: Nota[] = [
  { id: 1, disciplina: 'Programação Web',     nota1: 8.5, nota2: 9.0,  media: 8.75, situacao: 'Aprovado'  },
  { id: 2, disciplina: 'Banco de Dados',      nota1: 5.0, nota2: 6.0,  media: 5.5, situacao: 'Exame'     },
  { id: 3, disciplina: 'Dispositivos Móveis', nota1: 9.5, nota2: 10.0, media: 9.75, situacao: 'Aprovado'  },
  { id: 4, disciplina: 'Internet das Coisas', nota1: 4.0, nota2: 5.5,  media: 4.75, situacao: 'Reprovado' },
  { id: 5, disciplina: 'Estatística',         nota1: 10.0, nota2: 9.0, media: 9.5,  situacao: 'Aprovado'  },
];

export const boletimService = {
  buscarNotas: (_emailAluno: string): Promise<Nota[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(BOLETIM_MOCK), 1000);
    });
  },
};