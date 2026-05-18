import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import SelectField, { type OpcaoSelect } from '../components/SelectField';
import { useFormulario } from '../hooks/useFormulario';
import { useIBGE } from '../hooks/useIBGE';
import { cadastroService, type DadosAluno } from '../services/cadastroService';
import { theme } from '../styles/theme';

const VAZIO: DadosAluno = {
  nome: '', matricula: '', curso: '', email: '',
  telefone: '', cep: '', endereco: '', cidade: '', estado: '',
};

export default function CadastroAlunoScreen() {
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar } = useFormulario(VAZIO, {
    nome:      (v) => !v.trim() ? 'Nome é obrigatório.'      : '',
    matricula: (v) => !v.trim() ? 'Matrícula é obrigatória.' : '',
    curso:     (v) => !v.trim() ? 'Curso é obrigatório.'     : '',
    email:     (v) => !v.trim() ? 'E-mail é obrigatório.'    : '',
    telefone:  (v) => !v.trim() ? 'Telefone é obrigatório.'  : '',
    cep:       (v) => !v.trim() ? 'CEP é obrigatório.'       : '',
    endereco:  (v) => !v.trim() ? 'Endereço é obrigatório.'  : '',
    cidade:    (v) => !v.trim() ? 'Cidade é obrigatória.'    : '',
    estado:    (v) => !v.trim() ? 'Estado é obrigatório.'    : '',
  });

  // carrega estados sempre, cidades só quando um estado está selecionado
  const { estados, cidades, carregandoEstados, carregandoCidades } = useIBGE(
    formulario.estado || null,
  );

  const opcoesEstados: OpcaoSelect[] = estados.map((e) => ({
    label: `${e.sigla} — ${e.nome}`,
    value: e.sigla,
  }));

  const opcoesCidades: OpcaoSelect[] = cidades.map((c) => ({
    label: c.nome,
    value: c.nome,
  }));

  // ViaCEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await response.json();

      if (dados.erro) {
        Alert.alert('CEP não encontrado', 'Verifique o CEP e tente novamente.');
        return;
      }

      atualizarCampo('endereco', dados.logradouro || '');
      atualizarCampo('estado', dados.uf || '');
      atualizarCampo('cidade', dados.localidade || '');
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP. Verifique sua conexão.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await cadastroService.salvarAluno(formulario);
      Alert.alert('Sucesso', `Aluno ${formulario.nome} cadastrado com sucesso!`, [
        { text: 'OK', onPress: resetar },
      ]);
    } catch (err: any) {
      const mensagem = err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.';
      Alert.alert('Erro', mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        <Text style={estilos.secaoTitulo}>Dados Pessoais</Text>

        <InputField label="Nome completo *" placeholder="Ex: Gabriel Oliveira"
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)} error={erros.nome} />

        <InputField label="Matrícula *" placeholder="Ex: 2026001"
          value={formulario.matricula} onChangeText={(v) => atualizarCampo('matricula', v)}
          keyboardType="numeric" error={erros.matricula} />

        <InputField label="Curso *" placeholder="Ex: Desenvolvimento de Software"
          value={formulario.curso} onChangeText={(v) => atualizarCampo('curso', v)} error={erros.curso} />

        <InputField label="E-mail *" placeholder="aluno@fatec.sp.gov.br"
          value={formulario.email} onChangeText={(v) => atualizarCampo('email', v)}
          keyboardType="email-address" autoCapitalize="none" error={erros.email} />

        <InputField label="Telefone *" placeholder="(12) 99999-9999"
          value={formulario.telefone} onChangeText={(v) => atualizarCampo('telefone', v)}
          keyboardType="phone-pad" error={erros.telefone} />

        <View style={estilos.divisor} />
        <Text style={estilos.secaoTitulo}>Endereço</Text>

        <InputField
          label="CEP *"
          placeholder="12345678"
          value={formulario.cep}
          onChangeText={(v) => atualizarCampo('cep', v)}
          onBlur={() => buscarCep(formulario.cep)}
          keyboardType="numeric"
          maxLength={8}
          hint={buscandoCep ? 'Buscando endereço...' : 'Digite o CEP para preencher o endereço automaticamente'}
          error={erros.cep}
        />

        <InputField label="Endereço *" placeholder="Rua, número, complemento"
          value={formulario.endereco} onChangeText={(v) => atualizarCampo('endereco', v)} error={erros.endereco} />

        <SelectField
          label="Estado *"
          placeholder={carregandoEstados ? 'Carregando estados...' : 'Selecione o estado'}
          opcoes={opcoesEstados}
          valor={formulario.estado}
          onChange={(v) => {
            atualizarCampo('estado', v);
            atualizarCampo('cidade', '');
          }}
          disabled={carregandoEstados}
          error={erros.estado}
        />

        <SelectField
          label="Cidade *"
          placeholder={
            !formulario.estado
              ? 'Selecione o estado primeiro'
              : carregandoCidades
              ? 'Carregando cidades...'
              : 'Selecione a cidade'
          }
          opcoes={opcoesCidades}
          valor={formulario.cidade}
          onChange={(v) => atualizarCampo('cidade', v)}
          disabled={!formulario.estado || carregandoCidades}
          error={erros.cidade}
        />

        <PrimaryButton title="Salvar Aluno" onPress={handleSalvar} loading={loading} />
        <PrimaryButton title="Limpar formulário" variant="outline" onPress={resetar}
          style={{ marginTop: theme.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: theme.colors.background },
  scroll:      { flex: 1 },
  conteudo:    { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  secaoTitulo: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
  divisor:     { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
});