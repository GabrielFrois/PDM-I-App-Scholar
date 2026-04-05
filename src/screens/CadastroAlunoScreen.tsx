import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../styles/theme';

type DadosFormulario = {
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

const formularioVazio: DadosFormulario = {
  nome: '', matricula: '', curso: '', email: '',
  telefone: '', cep: '', endereco: '', cidade: '', estado: '',
};

export default function CadastroAlunoScreen() {
  const [formulario, setFormulario] = useState<DadosFormulario>(formularioVazio);
  const [erros, setErros] = useState<Partial<DadosFormulario>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('CadastroAlunoScreen montada.');
  }, []);

  const atualizarCampo = (campo: keyof DadosFormulario, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<DadosFormulario> = {};
    if (!formulario.nome.trim()) novosErros.nome = 'Nome é obrigatório.';
    if (!formulario.matricula.trim()) novosErros.matricula = 'Matrícula é obrigatória.';
    if (!formulario.curso.trim()) novosErros.curso = 'Curso é obrigatório.';
    if (!formulario.email.trim()) novosErros.email = 'E-mail é obrigatório.';
    if (!formulario.telefone.trim()) novosErros.telefone = 'Telefone é obrigatório.';
    if (!formulario.cep.trim()) novosErros.cep = 'CEP é obrigatório.';
    if (!formulario.endereco.trim()) novosErros.endereco = 'Endereço é obrigatório.';
    if (!formulario.cidade.trim()) novosErros.cidade = 'Cidade é obrigatória.';
    if (!formulario.estado.trim()) novosErros.estado = 'Estado é obrigatório.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;
    setLoading(true);
    setTimeout(() => {
      console.log('Aluno cadastrado:', formulario);
      setLoading(false);
      Alert.alert('Sucesso', `Aluno ${formulario.nome} cadastrado com sucesso!`, [
        { text: 'OK', onPress: () => setFormulario(formularioVazio) },
      ]);
    }, 800);
  };

  return (
    // edges={['bottom']} — o topo já é gerenciado pelo header do navigator
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
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)}
          error={erros.nome} />

        <InputField label="Matrícula *" placeholder="Ex: 2026001"
          value={formulario.matricula} onChangeText={(v) => atualizarCampo('matricula', v)}
          keyboardType="numeric" error={erros.matricula} />

        <InputField label="Curso *" placeholder="Ex: Desenvolvimento de Software"
          value={formulario.curso} onChangeText={(v) => atualizarCampo('curso', v)}
          error={erros.curso} />

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
          value={formulario.endereco} onChangeText={(v) => atualizarCampo('endereco', v)}
          error={erros.endereco} />

        <InputField label="Cidade *" placeholder="Ex: Jacareí"
          value={formulario.cidade} onChangeText={(v) => atualizarCampo('cidade', v)}
          error={erros.cidade} />

        <InputField label="Estado *" placeholder="Ex: SP"
          value={formulario.estado} onChangeText={(v) => atualizarCampo('estado', v)}
          maxLength={2} autoCapitalize="characters" error={erros.estado} />

        <PrimaryButton title="Salvar Aluno" onPress={handleSalvar} loading={loading} />

        <PrimaryButton
          title="Limpar formulário"
          variant="outline"
          onPress={() => { setFormulario(formularioVazio); setErros({}); }}
          style={{ marginTop: theme.spacing.sm }}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  conteudo: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  secaoTitulo: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  divisor: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
});