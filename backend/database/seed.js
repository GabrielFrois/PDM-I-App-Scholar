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

async function seed() {
  try {
    await client.connect();
    console.log('[seed] Conectado ao PostgreSQL.');

    await client.query('BEGIN');

    await client.query('DELETE FROM notas');
    await client.query('DELETE FROM disciplinas');
    await client.query('DELETE FROM alunos');
    await client.query('DELETE FROM professores');
    await client.query('DELETE FROM usuarios');
    console.log('[seed] Dados antigos removidos.');

    const senhaHash = await bcrypt.hash('123456', 10);

    // Definição dos Professores
    const professoresData = [
      { nome: 'Luciano Silva', titulacao: 'Mestre', area: 'Engenharia de Software', tempo_docencia: 8, email: 'luciano.silva@fatec.sp.gov.br' },
      { nome: 'Camila Fernandes', titulacao: 'Doutora', area: 'Banco de Dados', tempo_docencia: 12, email: 'camila.fernandes@fatec.sp.gov.br' },
      { nome: 'Roberto Almeida', titulacao: 'Mestre', area: 'Redes e Sistemas', tempo_docencia: 5, email: 'roberto.almeida@fatec.sp.gov.br' },
      { nome: 'Marcos Costa', titulacao: 'Mestre', area: 'Sistemas Embarcados', tempo_docencia: 7, email: 'marcos.costa@fatec.sp.gov.br' },
      { nome: 'Fernanda Lima', titulacao: 'Especialista', area: 'Matematica Aplicada', tempo_docencia: 4, email: 'fernanda.lima@fatec.sp.gov.br' }
    ];

    // Definição de 20 Alunos
    const nomesAlunos = [
      "Ana Clara", "Bruno Souza", "Carlos Eduardo", "Daniela Rocha", "Eduardo Lima",
      "Fernanda Alves", "Gabriel Martins", "Helena Costa", "Igor Santos", "Juliana Pereira",
      "Lucas Carvalho", "Mariana Ribeiro", "Nicolas Gomes", "Olivia Ferreira", "Pedro Henrique",
      "Quintino Castro", "Rafaela Melo", "Samuel Nogueira", "Tatiana Mendes", "Vinicius Moraes"
    ];

    const alunosData = nomesAlunos.map((nome, index) => ({
      nome,
      matricula: `2026${String(index + 1).padStart(3, '0')}`,
      curso: 'Desenvolvimento de Software Multiplataforma',
      email: `${nome.toLowerCase().replace(' ', '.')}@fatec.sp.gov.br`,
      telefone: `(12) 99999-${String(index + 1).padStart(4, '0')}`,
      cep: '12245-000',
      endereco: `Rua Voluntarios da Patria, ${100 + index}`, 
      cidade: 'Jacarei',
      estado: 'SP'
    }));

    // Montagem da tabela de Usuários
    const usuarios = [
      { email: 'admin@fatec.sp.gov.br', senha_hash: senhaHash, perfil: 'admin' },
      ...professoresData.map(p => ({ email: p.email, senha_hash: senhaHash, perfil: 'professor' })),
      ...alunosData.map(a => ({ email: a.email, senha_hash: senhaHash, perfil: 'aluno' }))
    ];

    for (const u of usuarios) {
      await client.query(
        'INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, $3)',
        [u.email, u.senha_hash, u.perfil]
      );
    }
    console.log(`[seed] ${usuarios.length} Usuarios inseridos.`);

    // Inserção dos Professores no banco
    const professorIds = {};
    for (const p of professoresData) {
      const res = await client.query(
        'INSERT INTO professores (nome, titulacao, area, tempo_docencia, email) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [p.nome, p.titulacao, p.area, p.tempo_docencia, p.email]
      );
      professorIds[p.nome] = res.rows[0].id;
    }
    console.log(`[seed] ${professoresData.length} Professores inseridos.`);

    // Inserção das Disciplinas
    const disciplinas = [
      { nome: 'Programacao para Dispositivos Moveis I', carga_horaria: 80, professor: professoresData[0].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Banco de Dados Relacional', carga_horaria: 80, professor: professoresData[1].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Programacao Web', carga_horaria: 80, professor: professoresData[2].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Internet das Coisas', carga_horaria: 60, professor: professoresData[3].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Estatistica Aplicada', carga_horaria: 60, professor: professoresData[4].nome, curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' }
    ];

    const disciplinaIds = {};
    for (const d of disciplinas) {
      const res = await client.query(
        'INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [d.nome, d.carga_horaria, professorIds[d.professor], d.curso, d.semestre]
      );
      disciplinaIds[d.nome] = res.rows[0].id;
    }
    console.log(`[seed] ${disciplinas.length} Disciplinas inseridas.`);

    // Inserção dos Alunos no banco
    const alunoIds = [];
    for (const a of alunosData) {
      const res = await client.query(
        `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [a.nome, a.matricula, a.curso, a.email, a.telefone, a.cep, a.endereco, a.cidade, a.estado]
      );
      alunoIds.push(res.rows[0].id);
    }
    console.log(`[seed] ${alunoIds.length} Alunos inseridos.`);

    // Inserção de Notas Aleatórias (para os 20 alunos nas 5 disciplinas)
    let notasInseridas = 0;
    for (const alunoId of alunoIds) {
      for (const d of disciplinas) {
        // Gera notas entre 5.0 e 10.0
        const nota1 = (Math.random() * 5 + 5).toFixed(1);
        const nota2 = (Math.random() * 5 + 5).toFixed(1);
        
        await client.query(
          'INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2) VALUES ($1, $2, $3, $4)',
          [alunoId, disciplinaIds[d.nome], nota1, nota2]
        );
        notasInseridas++;
      }
    }
    console.log(`[seed] ${notasInseridas} Notas inseridas.`);

    // Finaliza transação
    await client.query('COMMIT');
    console.log('[seed] Concluido com sucesso!');
    console.log('---');
    console.log('[seed] Exemplos de logins gerados (Senha padrao para todos: 123456):');
    console.log('[seed]   admin     -> admin@fatec.sp.gov.br');
    console.log('[seed]   professor -> luciano.silva@fatec.sp.gov.br');
    console.log('[seed]   professor -> fernanda.lima@fatec.sp.gov.br');
    console.log('[seed]   aluno     -> ana.clara@fatec.sp.gov.br');
    console.log('[seed]   aluno     -> vinicius.moraes@fatec.sp.gov.br');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Erro durante a execucao:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();