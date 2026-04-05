import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', senha: '' });

  const { login } = useAuth();

  const handleLogin = () => {
    const newErrors = { email: '', senha: '' };
    let valid = true;

    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
      valid = false;
    }
    if (!senha.trim()) {
      newErrors.senha = 'A senha é obrigatória.';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    setLoading(true);
    setTimeout(() => {
      const sucesso = login(email.trim(), senha.trim());
      setLoading(false);
      if (!sucesso) {
        Alert.alert('Acesso negado', 'E-mail ou senha inválidos.');
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={estilos.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >

        <View style={estilos.cabecalho}>
          <View style={estilos.logoCirculo}>
            <Ionicons name="school-outline" size={36} color={theme.colors.white} />
          </View>
          <Text style={estilos.nomeApp}>App Scholar</Text>
          <Text style={estilos.subtitulo}>Gerenciamento Acadêmico</Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.cardTitulo}>Entrar</Text>
          <InputField
            label="E-mail institucional"
            hint="Teste: admin@fatec.sp.gov.br"
            placeholder="seu@fatec.sp.gov.br"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <InputField
            label="Senha"
            hint="Teste: 123456"
            placeholder="••••••••"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            error={errors.senha}
          />

          <View style={estilos.areaBotao}>
            <PrimaryButton
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  conteudo: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoCirculo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  nomeApp: {
    fontSize: theme.font.xxl,
    fontWeight: '800',
    color: theme.colors.white,
  },
  subtitulo: {
    fontSize: theme.font.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitulo: {
    fontSize: theme.font.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  areaBotao: {
    marginTop: theme.spacing.md,
  },
});