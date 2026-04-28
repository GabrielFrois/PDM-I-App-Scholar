import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { theme } from '../styles/theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export default function InputField({ label, hint, error, ...rest }: Props) {
  return (
    <View style={estilos.container}>
      <Text style={estilos.label}>{label}</Text>

      {hint ? <Text style={estilos.hint}>{hint}</Text> : null}

      <TextInput
        style={[estilos.input, error ? estilos.inputErro : null]}
        placeholderTextColor={theme.colors.textSecondary}
        {...rest}
      />

      {error ? <Text style={estilos.textoErro}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  hint: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.font.md,
    color: theme.colors.text,
  },
  inputErro: {
    borderColor: theme.colors.danger,
  },
  textoErro: {
    fontSize: theme.font.sm,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
});