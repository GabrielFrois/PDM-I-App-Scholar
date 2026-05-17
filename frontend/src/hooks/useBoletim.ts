import { useEffect, useState } from 'react';
import { boletimService, type Nota } from '../services/boletimService';

type EstadoBoletim = {
  notas: Nota[];
  carregando: boolean;
  erro: string | null;
};

// Recebe matrícula agora (o backend busca por /boletim/:matricula)
export function useBoletim(matricula?: string | null) {
  const [estado, setEstado] = useState<EstadoBoletim>({
    notas: [],
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    if (!matricula) {
      setEstado({ notas: [], carregando: false, erro: null });
      return;
    }

    setEstado({ notas: [], carregando: true, erro: null });

    boletimService
      .buscarNotas(matricula)
      .then((notas) => setEstado({ notas, carregando: false, erro: null }))
      .catch((err: any) => {
        const mensagem =
          err.response?.data?.erro || err.message || 'Erro ao carregar boletim.';
        setEstado({ notas: [], carregando: false, erro: mensagem });
      });
  }, [matricula]);

  const aprovadas  = estado.notas.filter((n) => n.situacao === 'Aprovado').length;
  const reprovadas = estado.notas.filter((n) => n.situacao === 'Reprovado').length;
  const emExame    = estado.notas.filter((n) => n.situacao === 'Exame').length;

  return {
    notas: estado.notas,
    carregando: estado.carregando,
    erro: estado.erro,
    aprovadas,
    reprovadas,
    emExame,
  };
}