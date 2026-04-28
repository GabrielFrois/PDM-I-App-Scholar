require('dotenv').config();

const { Client } = require('pg');

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

    // Limpa dados antigos (respeita a ordem das FK)
    await client.query('DELETE FROM notas');
    await client.query('DELETE FROM disciplinas');
    await client.query('DELETE FROM alunos');
    await client.query('DELETE FROM professores');
    await client.query('DELETE FROM usuarios');
    console.log('[seed] Dados antigos removidos.');

    // Usuarios
    // Senha de todos: 123456
    const usuarios = [
      { email: 'gabriel@fatec.sp.gov.br', senha_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', perfil: 'aluno' },
      { email: 'admin@fatec.sp.gov.br',   senha_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', perfil: 'admin' },
    ];

    for (const u of usuarios) {
      await client.query(
        'INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, $3)',
        [u.email, u.senha_hash, u.perfil]
      );
    }
    console.log('[seed] Usuarios inseridos.');

    // Professores
    const professores = [
  { nome: 'Andre Olimpio', titulacao: 'A definir', area: 'Engenharia de Software', tempo_docencia: 8, email: 'andre.olimpio@fatec.sp.gov.br' },
  { nome: 'Lucineide Nunes Pimenta', titulacao: 'A definir', area: 'A definir', tempo_docencia: 0, email: 'lucineide.pimenta@fatec.sp.gov.br' },
  { nome: 'Neymar Siqueira Dellari', titulacao: 'A definir', area: 'A definir', tempo_docencia: 0, email: 'neymar.dellari@fatec.sp.gov.br' },
  { nome: 'Leandro Toss Hoffmann', titulacao: 'A definir', area: 'A definir', tempo_docencia: 0, email: 'leandro.hoffmann@fatec.sp.gov.br' },
  { nome: 'Anderson José da Silva', titulacao: 'A definir', area: 'A definir', tempo_docencia: 0, email: 'anderson.silva@fatec.sp.gov.br' },
  { nome: 'Erico Luciano Pagotto', titulacao: 'A definir', area: 'A definir', tempo_docencia: 0, email: 'erico.pagotto@fatec.sp.gov.br' }
];

    const professorIds = {};
    for (const p of professores) {
      const res = await client.query(
        'INSERT INTO professores (nome, titulacao, area, tempo_docencia, email) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [p.nome, p.titulacao, p.area, p.tempo_docencia, p.email]
      );
      professorIds[p.nome] = res.rows[0].id;
    }
    console.log('[seed] Professores inseridos.');

    // Disciplinas
    const disciplinas = [
      { nome: 'Programacao para Dispositivos Moveis I', carga_horaria: 80, professor: 'Andre Olimpio',  curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Integração e Entrega Contínua',              carga_horaria: 80, professor: 'Lucineide Nunes Pimenta',    curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Laboratório de Desenvolvimento Web',                        carga_horaria: 80, professor: 'Neymar Siqueira Dellari',  curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Internet das Coisas',                    carga_horaria: 80, professor: 'Leandro Toss Hoffmann', curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Estatistica Aplicada',                   carga_horaria: 80, professor: 'Anderson José da Silva',    curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Experiência do Usuário',                   carga_horaria: 40, professor: 'Erico Luciano Pagotto',    curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
    ];

    const disciplinaIds = {};
    for (const d of disciplinas) {
      const res = await client.query(
        'INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [d.nome, d.carga_horaria, professorIds[d.professor], d.curso, d.semestre]
      );
      disciplinaIds[d.nome] = res.rows[0].id;
    }
    console.log('[seed] Disciplinas inseridas.');

    // Alunos
    const alunoRes = await client.query(
      `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      ['Gabriel Oliveira', '2026001', 'Desenvolvimento de Software Multiplataforma',
       'gabriel@fatec.sp.gov.br', '(12) 99999-1111',
       '12245-000', 'Rua Voluntarios da Patria, 100', 'Jacarei', 'SP']
    );
    const alunoId = alunoRes.rows[0].id;
    console.log('[seed] Aluno inserido.');

    // Notas
    // media e situacao sao calculadas automaticamente pelo banco
    const notas = [
      { disciplina: 'Programacao para Dispositivos Moveis I', nota1: 9.5,  nota2: 10.0 },
      { disciplina: 'Integração e Entrega Contínua',              nota1: 5.0,  nota2: 6.0  },
      { disciplina: 'Laboratório de Desenvolvimento Web',                        nota1: 8.5,  nota2: 9.0  },
      { disciplina: 'Internet das Coisas',                    nota1: 4.0,  nota2: 5.5  },
      { disciplina: 'Estatistica Aplicada',                   nota1: 10.0, nota2: 9.0  },
      { disciplina: 'Experiência do Usuário',                   nota1: 9.5, nota2: 9.0  },
    ];

    for (const n of notas) {
      await client.query(
        'INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2) VALUES ($1, $2, $3, $4)',
        [alunoId, disciplinaIds[n.disciplina], n.nota1, n.nota2]
      );
    }
    console.log('[seed] Notas inseridas.');

    await client.query('COMMIT');

    console.log('[seed] Concluido com sucesso!');
    console.log('[seed] Usuarios: gabriel@fatec.sp.gov.br | admin@fatec.sp.gov.br');
    console.log('[seed] Senha de todos: 123456');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();