import { useState } from 'react';

export function useFormulario<T extends Record<string, string>>(
  valoresIniciais: T,
  regrasValidacao?: Partial<Record<keyof T, (valor: string) => string>>,
) {
  const [formulario, setFormulario] = useState<T>(valoresIniciais);
  const [erros, setErros] = useState<Partial<T>>({});

  // Atualiza um campo e limpa o erro dele imediatamente
  const atualizarCampo = (campo: keyof T, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: '' }));
    }
  };

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

  // Restaura o formulário e os erros ao estado inicial
  const resetar = () => {
    setFormulario(valoresIniciais);
    setErros({});
  };

  return { formulario, erros, atualizarCampo, validar, resetar };
}