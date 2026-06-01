// Povoa o banco com dados de exemplo para testes

require('dotenv').config();

const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'appscholar',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

// Converte um nome completo para e-mail institucional
// Ex: "Ana Clara" -> "ana.clara@fatec.sp.gov.br"
// normalize('NFD') + replace remove acentos (ã -> a, é -> e etc.)
function nomeParaEmail(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '.')            // todos os espaços viram pontos
    + '@fatec.sp.gov.br';
}

async function seed() {
  try {
    await client.connect();
    console.log('[seed] Conectado ao PostgreSQL.');

    // Usa transação para garantir que tudo é inserido ou nada
    await client.query('BEGIN');

    // Limpa dados anteriores na ordem correta (respeitando as FKs)
    await client.query('DELETE FROM notas');
    await client.query('DELETE FROM disciplinas');
    await client.query('DELETE FROM alunos');
    await client.query('DELETE FROM professores');
    await client.query('DELETE FROM usuarios');
    console.log('[seed] Dados antigos removidos.');

    // Gera um único hash de senha para todos (senha padrão: 123456)
    // O "10" é o custo do bcrypt (número de rounds de hashing)
    const senhaHash = await bcrypt.hash('123456', 10);

    const professoresData = [
      { nome: 'Luciano Silva',    titulacao: 'Mestre',      area: 'Engenharia de Software', tempo_docencia: 8,  email: 'luciano.silva@fatec.sp.gov.br' },
      { nome: 'Camila Fernandes', titulacao: 'Doutora',     area: 'Banco de Dados',          tempo_docencia: 12, email: 'camila.fernandes@fatec.sp.gov.br' },
      { nome: 'Roberto Almeida', titulacao: 'Mestre',      area: 'Redes e Sistemas',        tempo_docencia: 5,  email: 'roberto.almeida@fatec.sp.gov.br' },
      { nome: 'Marcos Costa',    titulacao: 'Mestre',      area: 'Sistemas Embarcados',     tempo_docencia: 7,  email: 'marcos.costa@fatec.sp.gov.br' },
      { nome: 'Fernanda Lima',   titulacao: 'Especialista', area: 'Matematica Aplicada',    tempo_docencia: 4,  email: 'fernanda.lima@fatec.sp.gov.br' },
    ];

    const nomesAlunos = [
      'Ana Clara', 'Bruno Souza', 'Carlos Eduardo', 'Daniela Rocha', 'Eduardo Lima',
      'Fernanda Alves', 'Gabriel Martins', 'Helena Costa', 'Igor Santos', 'Juliana Pereira',
      'Lucas Carvalho', 'Mariana Ribeiro', 'Nicolas Gomes', 'Olivia Ferreira', 'Pedro Henrique',
      'Quintino Castro', 'Rafaela Melo', 'Samuel Nogueira', 'Tatiana Mendes', 'Vinicius Moraes',
    ];

    // Gera os dados de cada aluno: matrícula sequencial 2026001, 2026002 etc.
    const alunosData = nomesAlunos.map((nome, index) => ({
      nome,
      matricula: `2026${String(index + 1).padStart(3, '0')}`,
      curso: 'Desenvolvimento de Software Multiplataforma',
      email: nomeParaEmail(nome),
      telefone: `(12) 99999-${String(index + 1).padStart(4, '0')}`,
      cep: '12245-000',
      endereco: `Rua Voluntarios da Patria, ${100 + index}`,
      cidade: 'Jacareí',
      estado: 'SP',
    }));

    // Cria um usuário de login para: 1 admin + todos os professores + todos os alunos
    const usuarios = [
      { email: 'admin@fatec.sp.gov.br', senha_hash: senhaHash, perfil: 'admin' },
      ...professoresData.map(p => ({ email: p.email, senha_hash: senhaHash, perfil: 'professor' })),
      ...alunosData.map(a => ({ email: a.email, senha_hash: senhaHash, perfil: 'aluno' })),
    ];

    for (const u of usuarios) {
      await client.query(
        'INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, $3)',
        [u.email, u.senha_hash, u.perfil]
      );
    }
    console.log(`[seed] ${usuarios.length} usuarios inseridos.`);

    // Insere professores e guarda o id gerado pelo banco para usar nas disciplinas
    const professorIds = {};
    for (const p of professoresData) {
      const res = await client.query(
        'INSERT INTO professores (nome, titulacao, area, tempo_docencia, email) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [p.nome, p.titulacao, p.area, p.tempo_docencia, p.email]
      );
      professorIds[p.nome] = res.rows[0].id;
    }
    console.log(`[seed] ${professoresData.length} professores inseridos.`);

    // Define as disciplinas e associa cada uma a um professor pelo nome
    const disciplinas = [
      { nome: 'Programacao para Dispositivos Moveis I', carga_horaria: 80, professor: professoresData[0].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Banco de Dados Relacional',              carga_horaria: 80, professor: professoresData[1].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Programacao Web',                        carga_horaria: 80, professor: professoresData[2].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Internet das Coisas',                    carga_horaria: 60, professor: professoresData[3].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Estatistica Aplicada',                   carga_horaria: 60, professor: professoresData[4].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
    ];

    // Insere as disciplinas e guarda os ids para usar no lançamento de notas
    const disciplinaIds = {};
    for (const d of disciplinas) {
      const res = await client.query(
        'INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [d.nome, d.carga_horaria, professorIds[d.professor], d.curso, d.semestre]
      );
      disciplinaIds[d.nome] = res.rows[0].id;
    }
    console.log(`[seed] ${disciplinas.length} disciplinas inseridas.`);

    // Insere os alunos e coleta os ids gerados
    const alunoIds = [];
    for (const a of alunosData) {
      const res = await client.query(
        `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [a.nome, a.matricula, a.curso, a.email, a.telefone, a.cep, a.endereco, a.cidade, a.estado]
      );
      alunoIds.push(res.rows[0].id);
    }
    console.log(`[seed] ${alunoIds.length} alunos inseridos.`);

    // Para cada aluno, gera notas aleatórias entre 5.0 e 10.0 em todas as disciplinas
    // Math.random() * 5 + 5 -> número entre 5 e 10
    let notasInseridas = 0;
    for (const alunoId of alunoIds) {
      for (const d of disciplinas) {
        const nota1 = parseFloat((Math.random() * 5 + 5).toFixed(1));
        const nota2 = parseFloat((Math.random() * 5 + 5).toFixed(1));
        await client.query(
          'INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2) VALUES ($1, $2, $3, $4)',
          [alunoId, disciplinaIds[d.nome], nota1, nota2]
        );
        notasInseridas++;
      }
    }
    console.log(`[seed] ${notasInseridas} notas inseridas.`);

    // Confirma todas as inserções de uma vez
    await client.query('COMMIT');
    console.log('[seed] Concluido com sucesso!');
    console.log('---');
    console.log('[seed] Logins gerados (senha padrao para todos: 123456):');
    console.log('[seed]   admin     -> admin@fatec.sp.gov.br');
    console.log('[seed]   professor -> luciano.silva@fatec.sp.gov.br');
    console.log('[seed]   professor -> fernanda.lima@fatec.sp.gov.br');
    console.log('[seed]   aluno     -> ana.clara@fatec.sp.gov.br');
    console.log('[seed]   aluno     -> vinicius.moraes@fatec.sp.gov.br');
    console.log('');
    console.log('[seed] Emails gerados para os alunos:');
    alunosData.forEach(a => console.log(`[seed]   ${a.nome.padEnd(20)} -> ${a.email}`));

  } catch (err) {
    // Se qualquer inserção falhar, desfaz tudo para não deixar o banco pela metade
    await client.query('ROLLBACK');
    console.error('[seed] Erro durante a execucao:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();