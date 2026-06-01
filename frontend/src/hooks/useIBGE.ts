// Busca estados e municípios brasileiros via API pública do IBGE

import { useEffect, useState } from 'react';

export type Estado = {
  id:    number;
  sigla: string;
  nome:  string;
};

export type Cidade = {
  id:   number;
  nome: string;
};

// siglaEstado: quando fornecida, carrega os municípios daquele estado
export function useIBGE(siglaEstado?: string | null) {
  const [estados,           setEstados]           = useState<Estado[]>([]);
  const [cidades,           setCidades]           = useState<Cidade[]>([]);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  // Carrega a lista de estados ordenada por nome, executado apenas uma vez ao montar
  useEffect(() => {
    setCarregandoEstados(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((r) => r.json())
      .then((data: Estado[]) => setEstados(data))
      .catch(() => setEstados([]))        // em caso de falha, lista fica vazia
      .finally(() => setCarregandoEstados(false));
  }, []);

  // Recarrega as cidades sempre que a sigla do estado selecionado mudar
  useEffect(() => {
    if (!siglaEstado) {
      setCidades([]); // limpa cidades ao desselecionar estado
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
  }, [siglaEstado]); // dependência: re-executa quando o estado muda

  return { estados, cidades, carregandoEstados, carregandoCidades };
}