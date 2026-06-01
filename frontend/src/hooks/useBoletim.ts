// Busca e organiza os dados do boletim de um aluno a partir da matrícula

import { useEffect, useState } from 'react';
import { boletimService, type Nota, type RespostaBoletim } from '../services/boletimService';

type EstadoBoletim = {
  boletim:    RespostaBoletim | null;
  carregando: boolean;
  erro:       string | null;
};

// Recebe uma matrícula e retorna as notas, contagens e dados do aluno
export function useBoletim(matricula?: string | null) {
  const [estado, setEstado] = useState<EstadoBoletim>({
    boletim:    null,
    carregando: false,
    erro:       null,
  });

  // Dispara a busca sempre que a matrícula mudar
  useEffect(() => {
    // Se não há matrícula, limpa o estado sem fazer requisição
    if (!matricula) {
      setEstado({ boletim: null, carregando: false, erro: null });
      return;
    }

    setEstado({ boletim: null, carregando: true, erro: null });

    boletimService
      .buscarBoletim(matricula)
      .then((boletim) => setEstado({ boletim, carregando: false, erro: null }))
      .catch((err: any) => {
        const mensagem = err.message || 'Erro ao carregar boletim.';
        setEstado({ boletim: null, carregando: false, erro: mensagem });
      });
  }, [matricula]);

  // Atalhos derivados do boletim para facilitar o uso na tela
  const notas: Nota[] = estado.boletim?.disciplinas ?? [];
  const aprovadas     = notas.filter((n) => n.situacao === 'Aprovado').length;
  const reprovadas    = notas.filter((n) => n.situacao === 'Reprovado').length;
  const emExame       = notas.filter((n) => n.situacao === 'Exame').length;

  return {
    notas,
    nomeAluno:  estado.boletim?.aluno     ?? null,
    curso:      estado.boletim?.curso     ?? null,
    matricula:  estado.boletim?.matricula ?? null,
    carregando: estado.carregando,
    erro:       estado.erro,
    aprovadas,
    reprovadas,
    emExame,
  };
}