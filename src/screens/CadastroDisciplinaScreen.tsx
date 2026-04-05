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
  nomeDisciplina: string;
  cargaHoraria: string;
  professorResponsavel: string;
  curso: string;
  semestre: string;
};

const formularioVazio: DadosFormulario = {
  nomeDisciplina: '', cargaHoraria: '', professorResponsavel: '', curso: '', semestre: '',
};

export default function CadastroDisciplinaScreen() {
  const [formulario, setFormulario] = useState<DadosFormulario>(formularioVazio);
  const [erros, setErros] = useState<Partial<DadosFormulario>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('CadastroDisciplinaScreen montada.');
  }, []);

  const atualizarCampo = (campo: keyof DadosFormulario, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }));
  };

  const validar = (): boolean => {
    const novosErros: Partial<DadosFormulario> = {};
    if (!formulario.nomeDisciplina.trim()) novosErros.nomeDisciplina = 'Nome da disciplina é obrigatório.';
    if (!formulario.cargaHoraria.trim()) novosErros.cargaHoraria = 'Carga horária é obrigatória.';
    if (!formulario.professorResponsavel.trim()) novosErros.professorResponsavel = 'Professor responsável é obrigatório.';
    if (!formulario.curso.trim()) novosErros.curso = 'Curso é obrigatório.';
    if (!formulario.semestre.trim()) novosErros.semestre = 'Semestre é obrigatório.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;
    setLoading(true);
    setTimeout(() => {
      console.log('Disciplina cadastrada:', formulario);
      setLoading(false);
      Alert.alert('Sucesso', `Disciplina "${formulario.nomeDisciplina}" cadastrada!`, [
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

        <Text style={estilos.secaoTitulo}>Dados da Disciplina</Text>

        <InputField label="Nome da disciplina *" placeholder="Ex: Engenharia de Software"
          value={formulario.nomeDisciplina} onChangeText={(v) => atualizarCampo('nomeDisciplina', v)}
          error={erros.nomeDisciplina} />

        <InputField label="Carga horária (horas) *" placeholder="Ex: 80"
          value={formulario.cargaHoraria} onChangeText={(v) => atualizarCampo('cargaHoraria', v)}
          keyboardType="numeric" error={erros.cargaHoraria} />

        <InputField label="Professor responsável *" placeholder="Ex: André Olímpio"
          value={formulario.professorResponsavel} onChangeText={(v) => atualizarCampo('professorResponsavel', v)}
          error={erros.professorResponsavel} />

        <InputField label="Curso *" placeholder="Ex: DSM"
          value={formulario.curso} onChangeText={(v) => atualizarCampo('curso', v)}
          error={erros.curso} />

        <InputField label="Semestre *" placeholder="Ex: 3º Semestre"
          value={formulario.semestre} onChangeText={(v) => atualizarCampo('semestre', v)}
          error={erros.semestre} />

        <PrimaryButton title="Salvar Disciplina" onPress={handleSalvar} loading={loading} />

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