// Botão reutilizável com variante preenchida (primary) ou contornada (outline)
// Exibe um spinner enquanto loading=true e desabilita o toque

import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleSheet,
    Text,
} from 'react-native';
import { theme } from '../styles/theme';

type Props = PressableProps & {
  title:    string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
};

export default function PrimaryButton({
  title,
  loading = false,
  variant = 'primary',
  ...rest
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.outline,
        pressed && { opacity: 0.8 },
        (loading || rest.disabled) && { opacity: 0.6 },
      ]}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.white : theme.colors.primary} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textOutline]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  text: {
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  textPrimary: {
    color: theme.colors.white,
  },
  textOutline: {
    color: theme.colors.primary,
  },
});