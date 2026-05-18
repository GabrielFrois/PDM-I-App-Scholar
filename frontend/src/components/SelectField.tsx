import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../styles/theme';

export type OpcaoSelect = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  placeholder?: string;
  opcoes: OpcaoSelect[];
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  disabled?: boolean;
  hint?: string;
};

export default function SelectField({
  label,
  placeholder = 'Selecione...',
  opcoes,
  valor,
  onChange,
  error,
  disabled = false,
  hint,
}: Props) {
  const [aberto, setAberto] = useState(false);

  const opcaoSelecionada = opcoes.find((o) => o.value === valor);

  return (
    <View style={estilos.container}>
      <Text style={estilos.label}>{label}</Text>

      {hint ? <Text style={estilos.hint}>{hint}</Text> : null}

      <TouchableOpacity
        style={[
          estilos.selector,
          error ? estilos.selectorErro : null,
          disabled ? estilos.selectorDisabled : null,
        ]}
        onPress={() => !disabled && setAberto(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text
          style={[
            estilos.selectorTexto,
            !opcaoSelecionada ? estilos.placeholder : null,
          ]}
          numberOfLines={1}
        >
          {opcaoSelecionada ? opcaoSelecionada.label : placeholder}
        </Text>
        <Text style={estilos.chevron}>▾</Text>
      </TouchableOpacity>

      {error ? <Text style={estilos.textoErro}>{error}</Text> : null}

      <Modal visible={aberto} transparent animationType="slide" onRequestClose={() => setAberto(false)}>
        <TouchableOpacity style={estilos.overlay} onPress={() => setAberto(false)} activeOpacity={1}>
          <View style={estilos.sheet}>
            <View style={estilos.sheetHeader}>
              <Text style={estilos.sheetTitulo}>{label}</Text>
              <TouchableOpacity onPress={() => setAberto(false)}>
                <Text style={estilos.fechar}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={opcoes}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    estilos.opcao,
                    item.value === valor ? estilos.opcaoSelecionada : null,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setAberto(false);
                  }}
                >
                  <Text
                    style={[
                      estilos.opcaoTexto,
                      item.value === valor ? estilos.opcaoTextoSelecionado : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === valor && <Text style={estilos.check}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  container:            { marginBottom: theme.spacing.md },
  label:                { fontSize: theme.font.sm, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
  hint:                 { fontSize: theme.font.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontStyle: 'italic' },
  selector:             { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorErro:         { borderColor: theme.colors.danger },
  selectorDisabled:     { opacity: 0.5 },
  selectorTexto:        { fontSize: theme.font.md, color: theme.colors.text, flex: 1 },
  placeholder:          { color: theme.colors.textSecondary },
  chevron:              { fontSize: 14, color: theme.colors.textSecondary, marginLeft: 8 },
  textoErro:            { fontSize: theme.font.sm, color: theme.colors.danger, marginTop: theme.spacing.xs },
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:                { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, maxHeight: '60%' },
  sheetHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sheetTitulo:          { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text },
  fechar:               { fontSize: theme.font.md, color: theme.colors.primary, fontWeight: '600' },
  opcao:                { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
  opcaoSelecionada:     { backgroundColor: theme.colors.secondary },
  opcaoTexto:           { fontSize: theme.font.md, color: theme.colors.text },
  opcaoTextoSelecionado:{ color: theme.colors.primary, fontWeight: '600' },
  check:                { color: theme.colors.primary, fontWeight: '700' },
});