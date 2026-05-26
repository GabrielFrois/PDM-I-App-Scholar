import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useFormulario } from '../hooks/useFormulario';
import { cadastroService, type DadosProfessor } from '../services/cadastroService';
import { theme } from '../styles/theme';

const VAZIO: DadosProfessor = {
  nome: '', titulacao: '', areaAtuacao: '', tempoDocencia: '', email: '',
};

export default function CadastroProfessorScreen() {
  const { user } = useAuth();
  const ehProfessor = user?.perfil === 'professor';

  const [loading, setLoading]           = useState(false);
  const [carregando, setCarregando]     = useState(ehProfessor);
  const [professorId, setProfessorId]   = useState<number | null>(null);

  const { formulario, erros, atualizarCampo, validar, resetar, preencherFormulario } =
    useFormulario(VAZIO, {
      nome:          (v) => !v.trim() ? 'Nome é obrigatório.'              : '',
      titulacao:     (v) => !v.trim() ? 'Titulação é obrigatória.'         : '',
      areaAtuacao:   (v) => !v.trim() ? 'Área de atuação é obrigatória.'   : '',
      tempoDocencia: (v) => !v.trim() ? 'Tempo de docência é obrigatório.' : '',
      email:         (v) => !v.trim() ? 'E-mail é obrigatório.'            : '',
    });

  useEffect(() => {
    if (!ehProfessor || !user?.email) return;

    async function carregarDados() {
      try {
        const prof = await cadastroService.buscarProfessorPorEmail(user!.email);
        if (prof) {
          setProfessorId(prof.id);
          preencherFormulario({
            nome:          prof.nome                        ?? '',
            titulacao:     prof.titulacao                   ?? '',
            areaAtuacao:   prof.area                        ?? '',
            tempoDocencia: String(prof.tempo_docencia ?? ''),
            email:         prof.email                       ?? '',
          });
        }
      } catch {
        // silencioso
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const handleSalvar = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      if (ehProfessor && professorId) {
        await cadastroService.atualizarProfessor(professorId, formulario);
        Alert.alert('Sucesso', 'Seus dados foram atualizados!');
      } else {
        await cadastroService.salvarProfessor(formulario);
        Alert.alert('Sucesso', `Professor ${formulario.nome} cadastrado com sucesso!`, [
          { text: 'OK', onPress: resetar },
        ]);
      }
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.';
      Alert.alert('Erro', mensagem);
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
        <View style={estilos.centroCarga}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={estilos.textoCarga}>Carregando seus dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.safeArea} edges={['bottom']}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {ehProfessor && professorId && (
          <View style={estilos.bannerEdicao}>
            <Text style={estilos.bannerTexto}>Editando seu cadastro</Text>
          </View>
        )}

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

        <PrimaryButton
          title={ehProfessor && professorId ? 'Salvar alterações' : 'Cadastrar Professor'}
          onPress={handleSalvar}
          loading={loading}
        />
        {!ehProfessor && (
          <PrimaryButton title="Limpar formulário" variant="outline" onPress={resetar}
            style={{ marginTop: theme.spacing.sm }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: theme.colors.background },
  scroll:       { flex: 1 },
  conteudo:     { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  centroCarga:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  textoCarga:   { fontSize: theme.font.md, color: theme.colors.textSecondary },
  bannerEdicao: { backgroundColor: '#E8F0FE', borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.md },
  bannerTexto:  { fontSize: theme.font.sm, color: theme.colors.primary, fontWeight: '600' },
  secaoTitulo:  { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
});