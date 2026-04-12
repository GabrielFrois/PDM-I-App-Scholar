import { useEffect, useState } from 'react';
import { boletimService, type Nota } from '../services/boletimService';

type EstadoBoletim = {
  notas: Nota[];
  carregando: boolean;
  erro: string | null;
};

export function useBoletim(emailAluno?: string | null) {
  const [estado, setEstado] = useState<EstadoBoletim>({
    notas: [],
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    if (!emailAluno) return;

    setEstado({ notas: [], carregando: true, erro: null });

    boletimService
      .buscarNotas(emailAluno)
      .then((notas) => setEstado({ notas, carregando: false, erro: null }))
      .catch((err: Error) =>
        setEstado({ notas: [], carregando: false, erro: err.message }),
      );
  }, [emailAluno]);

  const aprovadas = estado.notas.filter((n) => n.situacao === 'Aprovado').length;
  const reprovadas = estado.notas.filter((n) => n.situacao === 'Reprovado').length;
  const emExame = estado.notas.filter((n) => n.situacao === 'Exame').length;

  return {
    notas: estado.notas,
    carregando: estado.carregando,
    erro: estado.erro,
    aprovadas,
    reprovadas,
    emExame,
  };
}