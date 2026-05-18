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

    const usuarios = [
      { email: 'gabriel@fatec.sp.gov.br',        senha_hash: senhaHash, perfil: 'aluno'     },
      { email: 'admin@fatec.sp.gov.br',           senha_hash: senhaHash, perfil: 'admin'     },
      { email: 'andre.olimpio@fatec.sp.gov.br',   senha_hash: senhaHash, perfil: 'professor' },
      { email: 'maria.costa@fatec.sp.gov.br',     senha_hash: senhaHash, perfil: 'professor' },
      { email: 'carlos.pereira@fatec.sp.gov.br',  senha_hash: senhaHash, perfil: 'professor' },
    ];

    for (const u of usuarios) {
      await client.query(
        'INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, $3)',
        [u.email, u.senha_hash, u.perfil]
      );
    }
    console.log('[seed] Usuarios inseridos.');

    const professores = [
      { nome: 'Andre Olimpio',  titulacao: 'Mestre',  area: 'Engenharia de Software', tempo_docencia: 8,  email: 'andre.olimpio@fatec.sp.gov.br'  },
      { nome: 'Maria Costa',    titulacao: 'Doutora', area: 'Banco de Dados',         tempo_docencia: 12, email: 'maria.costa@fatec.sp.gov.br'    },
      { nome: 'Carlos Pereira', titulacao: 'Mestre',  area: 'Redes e Sistemas',       tempo_docencia: 5,  email: 'carlos.pereira@fatec.sp.gov.br' },
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

    const disciplinas = [
      { nome: 'Programacao para Dispositivos Moveis I', carga_horaria: 80, professor: 'Andre Olimpio',  curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Banco de Dados Relacional',              carga_horaria: 80, professor: 'Maria Costa',    curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Programacao Web',                        carga_horaria: 80, professor: 'Andre Olimpio',  curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Internet das Coisas',                    carga_horaria: 60, professor: 'Carlos Pereira', curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
      { nome: 'Estatistica Aplicada',                   carga_horaria: 60, professor: 'Maria Costa',    curso: 'Desenvolvimento de Software Multiplataforma', semestre: '4 Semestre' },
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

    const alunoRes = await client.query(
      `INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      ['Gabriel Oliveira', '2026001', 'Desenvolvimento de Software Multiplataforma',
       'gabriel@fatec.sp.gov.br', '(12) 99999-1111',
       '12245-000', 'Rua Voluntarios da Patria, 100', 'Jacarei', 'SP']
    );
    const alunoId = alunoRes.rows[0].id;
    console.log('[seed] Aluno inserido.');

    const notas = [
      { disciplina: 'Programacao para Dispositivos Moveis I', nota1: 9.5,  nota2: 10.0 },
      { disciplina: 'Banco de Dados Relacional',              nota1: 5.0,  nota2: 6.0  },
      { disciplina: 'Programacao Web',                        nota1: 8.5,  nota2: 9.0  },
      { disciplina: 'Internet das Coisas',                    nota1: 4.0,  nota2: 5.5  },
      { disciplina: 'Estatistica Aplicada',                   nota1: 10.0, nota2: 9.0  },
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
    console.log('[seed] Usuarios:');
    console.log('[seed]   aluno     -> gabriel@fatec.sp.gov.br');
    console.log('[seed]   admin     -> admin@fatec.sp.gov.br');
    console.log('[seed]   professor -> andre.olimpio@fatec.sp.gov.br');
    console.log('[seed]   professor -> maria.costa@fatec.sp.gov.br');
    console.log('[seed]   professor -> carlos.pereira@fatec.sp.gov.br');
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