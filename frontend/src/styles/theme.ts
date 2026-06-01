export const theme = {
  colors: {
    primary:       '#1A73E8', // azul principal (botões, links, cabeçalhos)
    secondary:     '#F0F4FF', // azul claro (fundo de itens selecionados)
    background:    '#F5F7FA', // cinza claro (fundo das telas)
    surface:       '#FFFFFF', // branco (cards, inputs)
    danger:        '#D32F2F', // vermelho (erros, reprovado, remover)
    success:       '#388E3C', // verde (aprovado)
    warning:       '#F57C00', // laranja (exame, avisos)
    text:          '#1C1C1E', // preto suave (texto principal)
    textSecondary: '#6B7280', // cinza (subtítulos, placeholders)
    border:        '#D1D5DB', // cinza claro (bordas de inputs e cards)
    white:         '#FFFFFF',
  },
  spacing: {
    xs:  4,  // espaçamento mínimo
    sm:  8,
    md:  16, // espaçamento padrão
    lg:  24,
    xl:  32,
    xxl: 48, // padding inferior das ScrollViews
  },
  radius: {
    sm:   8,   // inputs e botões
    md:   12,  // cards
    lg:   16,  // modais e bottom sheets
    full: 999, // elementos totalmente arredondados
  },
  font: {
    sm:  13, // labels, hints, textos secundários
    md:  15, // texto padrão de inputs e listas
    lg:  18, // títulos de seção
    xl:  22, // títulos de tela
    xxl: 28, // nome do app na tela de login
  },
};