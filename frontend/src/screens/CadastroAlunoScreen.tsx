import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import SelectField, { type OpcaoSelect } from '../components/SelectField';
import { useAuth } from '../contexts/AuthContext';
import { useFormulario } from '../hooks/useFormulario';
import { useIBGE } from '../hooks/useIBGE';
import { cadastroService, type DadosAluno } from '../services/cadastroService';
import { theme } from '../styles/theme';

const VAZIO: DadosAluno = {
  nome: '', matricula: '', curso: '', email: '',
  telefone: '', cep: '', endereco: '', cidade: '', estado: '',
};

export default function CadastroAlunoScreen() {
  const { user } = useAuth();
  const ehAluno = user?.perfil === 'aluno';

  const [loading, setLoading]         = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregando, setCarregando]   = useState(ehAluno);
  const [alunoId, setAlunoId]         = useState<number | null>(null);

  const { formulario, erros, atualizarCampo, validar, resetar, preencherFormulario } =
    useFormulario(VAZIO, {
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

  useEffect(() => {
    if (!ehAluno || !user?.email) return;

    async function carregarDados() {
      try {
        const aluno = await cadastroService.buscarAlunoPorEmail(user!.email);
        if (aluno) {
          setAlunoId((aluno as any).id);
          preencherFormulario({
            nome:      (aluno as any).nome      ?? '',
            matricula: (aluno as any).matricula  ?? '',
            curso:     (aluno as any).curso      ?? '',
            email:     (aluno as any).email      ?? '',
            telefone:  (aluno as any).telefone   ?? '',
            cep:       (aluno as any).cep        ?? '',
            endereco:  (aluno as any).endereco   ?? '',
            cidade:    (aluno as any).cidade     ?? '',
            estado:    (aluno as any).estado     ?? '',
          });
        }
      } catch {
        // formulário fica vazio
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

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
      if (ehAluno && alunoId) {
        await cadastroService.atualizarAluno(alunoId, formulario);
        Alert.alert('Sucesso', 'Seus dados foram atualizados!');
      } else {
        await cadastroService.salvarAluno(formulario);
        Alert.alert('Sucesso', `Aluno ${formulario.nome} cadastrado com sucesso!`, [
          { text: 'OK', onPress: resetar },
        ]);
      }
    } catch (err: any) {
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
        {ehAluno && alunoId && (
          <View style={estilos.bannerEdicao}>
            <Text style={estilos.bannerTexto}>Editando seu cadastro</Text>
          </View>
        )}

        <Text style={estilos.secaoTitulo}>Dados Pessoais</Text>

        <InputField label="Nome completo *" placeholder="Ex: Gabriel Oliveira"
          value={formulario.nome} onChangeText={(v) => atualizarCampo('nome', v)} error={erros.nome} />

        <InputField label="Matrícula *" placeholder="Ex: 2026001"
          value={formulario.matricula} onChangeText={(v) => atualizarCampo('matricula', v)}
          keyboardType="numeric" error={erros.matricula}
          editable={!ehAluno} />

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

        <PrimaryButton
          title={ehAluno && alunoId ? 'Salvar alterações' : 'Cadastrar Aluno'}
          onPress={handleSalvar}
          loading={loading}
        />
        {!ehAluno && (
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
  divisor:      { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
});