import { useEffect, useState } from 'react';

export type Estado = {
  id: number;
  sigla: string;
  nome: string;
};

export type Cidade = {
  id: number;
  nome: string;
};

export function useIBGE(siglaEstado?: string | null) {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  // Carrega estados uma vez ao montar
  useEffect(() => {
    setCarregandoEstados(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((r) => r.json())
      .then((data: Estado[]) => setEstados(data))
      .catch(() => setEstados([]))
      .finally(() => setCarregandoEstados(false));
  }, []);

  // Carrega cidades sempre que a sigla do estado mudar
  useEffect(() => {
    if (!siglaEstado) {
      setCidades([]);
      return;
    }

    setCarregandoCidades(true);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaEstado}/municipios?orderBy=nome`,
    )
      .then((r) => r.json())
      .then((data: Cidade[]) => setCidades(data))
      .catch(() => setCidades([]))
      .finally(() => setCarregandoCidades(false));
  }, [siglaEstado]);

  return { estados, cidades, carregandoEstados, carregandoCidades };
}