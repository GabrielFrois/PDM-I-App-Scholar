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

export const cadastroService = {
  salvarAluno: (dados: DadosAluno): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[cadastroService] Salvando aluno:', dados);
      setTimeout(resolve, 800);
    });
  },

  salvarProfessor: (dados: DadosProfessor): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[cadastroService] Salvando professor:', dados);
      setTimeout(resolve, 800);
    });
  },

  salvarDisciplina: (dados: DadosDisciplina): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[cadastroService] Salvando disciplina:', dados);
      setTimeout(resolve, 800);
    });
  },
};