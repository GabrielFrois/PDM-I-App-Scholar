import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../styles/theme';

type DadosFormulario = {
  nome: string;
  titulacao: string;
  areaAtuacao: string;
  tempoDocencia: string;
  email: string;
};

const formularioVazio: DadosFormulario = {
  nome: '', titulacao: '', areaAtuacao: '', tempoDocencia: '', email: '',
};

export default function CadastroProfessorScreen() {
  const [formulario, setFormulario] = useState<DadosFormulario>(formularioVazio);
  const [erros, setErros] = useState<Partial<DadosFormulario>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('CadastroProfessorScreen montada.');
  }, []);

  const atualizarCampo = (campo: keyof DadosFormulario, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<DadosFormulario> = {};
    if (!formulario.nome.trim()) novosErros.nome = 'Nome é obrigatório.';
    if (!formulario.titulacao.trim()) novosErros.titulacao = 'Titulação é obrigatória.';
    if (!formulario.areaAtuacao.trim()) novosErros.areaAtuacao = 'Área de atuação é obrigatória.';
    if (!formulario.tempoDocencia.trim()) novosErros.tempoDocencia = 'Tempo de docência é obrigatório.';
    if (!formulario.email.trim()) novosErros.email = 'E-mail é obrigatório.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;
    setLoading(true);
    setTimeout(() => {
      console.log('Professor cadastrado:', formulario);
      setLoading(false);
      Alert.alert('Sucesso', `Professor ${formulario.nome} cadastrado!`, [
        { text: 'OK', onPress: () => setFormulario(formularioVazio) },
      ]);
    }, 800);
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

        <Text style={estilos.secaoTitulo}>Dados do Professor</Text>

        <InputField label="Nome completo *" placeholder="Ex: André Olímpio"
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)}
          error={erros.nome} />

        <InputField label="Titulação *" placeholder="Ex: Doutor, Mestre, Especialista"
          value={formulario.titulacao} onChangeText={(v) => atualizarCampo('titulacao', v)}
          error={erros.titulacao} />

        <InputField label="Área de atuação *" placeholder="Ex: Engenharia de Software"
          value={formulario.areaAtuacao} onChangeText={(v) => atualizarCampo('areaAtuacao', v)}
          error={erros.areaAtuacao} />

        <InputField label="Tempo de docência (anos) *" placeholder="Ex: 10"
          value={formulario.tempoDocencia} onChangeText={(v) => atualizarCampo('tempoDocencia', v)}
          keyboardType="numeric" error={erros.tempoDocencia} />

        <InputField label="E-mail *" placeholder="professor@fatec.sp.gov.br"
          value={formulario.email} onChangeText={(v) => atualizarCampo('email', v)}
          keyboardType="email-address" autoCapitalize="none" error={erros.email} />

        <PrimaryButton title="Salvar Professor" onPress={handleSalvar} loading={loading} />

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
});