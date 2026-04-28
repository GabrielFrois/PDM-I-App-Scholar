import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useFormulario } from '../hooks/useFormulario';
import { cadastroService, type DadosDisciplina } from '../services/cadastroService';
import { theme } from '../styles/theme';

const VAZIO: DadosDisciplina = {
  nomeDisciplina: '', cargaHoraria: '', professorResponsavel: '', curso: '', semestre: '',
};

export default function CadastroDisciplinaScreen() {
  const [loading, setLoading] = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar } = useFormulario(VAZIO, {
    nomeDisciplina:       (v) => !v.trim() ? 'Nome da disciplina é obrigatório.'    : '',
    cargaHoraria:         (v) => !v.trim() ? 'Carga horária é obrigatória.'         : '',
    professorResponsavel: (v) => !v.trim() ? 'Professor responsável é obrigatório.' : '',
    curso:                (v) => !v.trim() ? 'Curso é obrigatório.'                 : '',
    semestre:             (v) => !v.trim() ? 'Semestre é obrigatório.'              : '',
  });

  useEffect(() => {
    console.log('CadastroDisciplinaScreen montada.');
  }, []);

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await cadastroService.salvarDisciplina(formulario);
      console.log('Disciplina cadastrada:', formulario);
      Alert.alert('Sucesso', `Disciplina "${formulario.nomeDisciplina}" cadastrada!`, [
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
          value={formulario.curso} onChangeText={(v) => atualizarCampo('curso', v)} error={erros.curso} />

        <InputField label="Semestre *" placeholder="Ex: 3º Semestre"
          value={formulario.semestre} onChangeText={(v) => atualizarCampo('semestre', v)} error={erros.semestre} />

        <PrimaryButton title="Salvar Disciplina" onPress={handleSalvar} loading={loading} />
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
});