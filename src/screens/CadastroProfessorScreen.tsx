import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useFormulario } from '../hooks/useFormulario';
import { cadastroService, type DadosProfessor } from '../services/cadastroService';
import { theme } from '../styles/theme';

const VAZIO: DadosProfessor = {
  nome: '', titulacao: '', areaAtuacao: '', tempoDocencia: '', email: '',
};

export default function CadastroProfessorScreen() {
  const [loading, setLoading] = useState(false);

  const { formulario, erros, atualizarCampo, validar, resetar } = useFormulario(VAZIO, {
    nome:           (v) => !v.trim() ? 'Nome é obrigatório.'              : '',
    titulacao:      (v) => !v.trim() ? 'Titulação é obrigatória.'         : '',
    areaAtuacao:    (v) => !v.trim() ? 'Área de atuação é obrigatória.'   : '',
    tempoDocencia:  (v) => !v.trim() ? 'Tempo de docência é obrigatório.' : '',
    email:          (v) => !v.trim() ? 'E-mail é obrigatório.'            : '',
  });

  useEffect(() => {
    console.log('CadastroProfessorScreen montada.');
  }, []);

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await cadastroService.salvarProfessor(formulario);
      console.log('Professor cadastrado:', formulario);
      Alert.alert('Sucesso', `Professor ${formulario.nome} cadastrado!`, [
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
        <Text style={estilos.secaoTitulo}>Dados do Professor</Text>

        <InputField label="Nome completo *" placeholder="Ex: André Olímpio"
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)} error={erros.nome} />

        <InputField label="Titulação *" placeholder="Ex: Doutor, Mestre, Especialista"
          value={formulario.titulacao} onChangeText={(v) => atualizarCampo('titulacao', v)} error={erros.titulacao} />

        <InputField label="Área de atuação *" placeholder="Ex: Engenharia de Software"
          value={formulario.areaAtuacao} onChangeText={(v) => atualizarCampo('areaAtuacao', v)} error={erros.areaAtuacao} />

        <InputField label="Tempo de docência (anos) *" placeholder="Ex: 10"
          value={formulario.tempoDocencia} onChangeText={(v) => atualizarCampo('tempoDocencia', v)}
          keyboardType="numeric" error={erros.tempoDocencia} />

        <InputField label="E-mail *" placeholder="professor@fatec.sp.gov.br"
          value={formulario.email} onChangeText={(v) => atualizarCampo('email', v)}
          keyboardType="email-address" autoCapitalize="none" error={erros.email} />

        <PrimaryButton title="Salvar Professor" onPress={handleSalvar} loading={loading} />
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