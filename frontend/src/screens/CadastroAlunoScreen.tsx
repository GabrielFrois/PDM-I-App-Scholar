import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useFormulario } from '../hooks/useFormulario';
import { cadastroService, type DadosAluno } from '../services/cadastroService';
import { theme } from '../styles/theme';

const VAZIO: DadosAluno = {
  nome: '', matricula: '', curso: '', email: '',
  telefone: '', cep: '', endereco: '', cidade: '', estado: '',
};

export default function CadastroAlunoScreen() {
  const [loading, setLoading] = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar } = useFormulario(VAZIO, {
    nome:       (v) => !v.trim() ? 'Nome é obrigatório.'       : '',
    matricula:  (v) => !v.trim() ? 'Matrícula é obrigatória.'  : '',
    curso:      (v) => !v.trim() ? 'Curso é obrigatório.'      : '',
    email:      (v) => !v.trim() ? 'E-mail é obrigatório.'     : '',
    telefone:   (v) => !v.trim() ? 'Telefone é obrigatório.'   : '',
    cep:        (v) => !v.trim() ? 'CEP é obrigatório.'        : '',
    endereco:   (v) => !v.trim() ? 'Endereço é obrigatório.'   : '',
    cidade:     (v) => !v.trim() ? 'Cidade é obrigatória.'     : '',
    estado:     (v) => !v.trim() ? 'Estado é obrigatório.'     : '',
  });

  useEffect(() => {
    console.log('CadastroAlunoScreen montada.');
  }, []);

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await cadastroService.salvarAluno(formulario);
      console.log('Aluno cadastrado:', formulario);
      Alert.alert('Sucesso', `Aluno ${formulario.nome} cadastrado com sucesso!`, [
        { text: 'OK', onPress: resetar },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
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

        <InputField label="CEP *" placeholder="12345-678"
          value={formulario.cep} onChangeText={(v) => atualizarCampo('cep', v)}
          keyboardType="numeric" error={erros.cep} />

        <InputField label="Endereço *" placeholder="Rua, número, complemento"
          value={formulario.endereco} onChangeText={(v) => atualizarCampo('endereco', v)} error={erros.endereco} />

        <InputField label="Cidade *" placeholder="Ex: Jacareí"
          value={formulario.cidade} onChangeText={(v) => atualizarCampo('cidade', v)} error={erros.cidade} />

        <InputField label="Estado *" placeholder="Ex: SP"
          value={formulario.estado} onChangeText={(v) => atualizarCampo('estado', v)}
          maxLength={2} autoCapitalize="characters" error={erros.estado} />

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