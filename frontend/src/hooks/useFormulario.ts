// Hook genérico que gerencia estado, erros e validação de formulários

import { useState } from 'react';

// T é o tipo do objeto de formulário (ex: { nome: string; email: string })
export function useFormulario<T extends Record<string, string>>(
  valoresIniciais: T,
  // Mapa de campos -> função que recebe o valor e retorna mensagem de erro (ou '' se válido)
  regrasValidacao?: Partial<Record<keyof T, (valor: string) => string>>,
) {
  const [formulario, setFormulario] = useState<T>(valoresIniciais);
  const [erros, setErros] = useState<Partial<T>>({});

  // Atualiza um campo e limpa o erro daquele campo imediatamente
  const atualizarCampo = (campo: keyof T, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: '' }));
    }
  };

  // Preenche múltiplos campos de uma vez e limpa todos os erros
  // Usado ao carregar dados da API para edição
  const preencherFormulario = (dados: Partial<T>) => {
    setFormulario((prev) => ({ ...prev, ...dados }));
    setErros({});
  };

  // Executa todas as regras de validação e retorna true se o formulário for válido
  const validar = (): boolean => {
    if (!regrasValidacao) return true;

    const novosErros: Partial<T> = {};
    let valido = true;

    for (const campo in regrasValidacao) {
      const regra = regrasValidacao[campo];
      if (regra) {
        const mensagem = regra(formulario[campo] ?? '');
        if (mensagem) {
          novosErros[campo] = mensagem as T[typeof campo];
          valido = false;
        }
      }
    }

    setErros(novosErros);
    return valido;
  };

  // Volta todos os campos e erros ao estado inicial
  const resetar = () => {
    setFormulario(valoresIniciais);
    setErros({});
  };

  return { formulario, erros, atualizarCampo, preencherFormulario, validar, resetar };
}