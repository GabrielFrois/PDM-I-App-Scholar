const express = require('express');
const router  = express.Router();

// Middlewares de autenticação e autorização por perfil
const { autenticar }      = require('../middlewares/auth');
const { autorizar }       = require('../middlewares/autorizar');

const authController        = require('../controllers/authController');
const alunosController      = require('../controllers/alunosController');
const professoresController = require('../controllers/professoresController');
const disciplinasController = require('../controllers/disciplinasController');
const boletimController     = require('../controllers/boletimController');
const notasController       = require('../controllers/notasController');
const matriculasController  = require('../controllers/matriculasController');
const cursosController      = require('../controllers/cursosController'); 

// Rota pública: faz login e devolve o token JWT
router.post('/login', authController.login);

// Rotas de alunos
// Cadastrar: só admin pode criar aluno
// Listar: admin, professor e aluno podem consultar
// Atualizar: admin ou o próprio aluno (controle feito no controller)
// Remover: só admin (soft delete)
router.post('/alunos',       autenticar, autorizar('admin'),                       alunosController.cadastrar);
router.get('/alunos',        autenticar, autorizar('admin', 'professor', 'aluno'), alunosController.listar);
router.put('/alunos/:id',    autenticar, autorizar('admin', 'aluno'),              alunosController.atualizar);
router.delete('/alunos/:id', autenticar, autorizar('admin'),                       alunosController.remover);

// Rotas de professores
// Cadastrar/remover: só admin
// Listar: admin e professor
// Atualizar: admin ou o próprio professor (controle feito no controller)
router.post('/professores',       autenticar, autorizar('admin'),              professoresController.cadastrar);
router.get('/professores',        autenticar, autorizar('admin', 'professor'), professoresController.listar);
router.put('/professores/:id',    autenticar, autorizar('admin', 'professor'), professoresController.atualizar);
router.delete('/professores/:id', autenticar, autorizar('admin'),              professoresController.remover);

// Rotas de disciplinas
// Cadastrar/atualizar/remover: só admin
// Listar: admin vê todas; professor vê apenas as suas (filtro no controller)
router.post('/disciplinas',       autenticar, autorizar('admin'),              disciplinasController.cadastrar);
router.get('/disciplinas',        autenticar, autorizar('admin', 'professor'), disciplinasController.listar);
router.put('/disciplinas/:id',    autenticar, autorizar('admin'),              disciplinasController.atualizar);
router.delete('/disciplinas/:id', autenticar, autorizar('admin'),              disciplinasController.remover);

// Rotas de cursos
// Cadastrar / atualizar / remover: somente admin
// Listar: admin e professor (para o dropdown de seleção de curso)
router.post('/cursos',       autenticar, autorizar('admin'),              cursosController.cadastrar);
router.get('/cursos',        autenticar, autorizar('admin', 'professor', 'aluno'), cursosController.listar);
router.put('/cursos/:id',    autenticar, autorizar('admin'),              cursosController.atualizar);
router.delete('/cursos/:id', autenticar, autorizar('admin'),              cursosController.remover);


// Rotas de matrículas (acesso restrito ao admin)
// GET    /matriculas/:alunoId        -> disciplinas do aluno + ids marcados
// POST   /matriculas                 -> matricula em uma ou mais disciplinas
// DELETE /matriculas                 -> remove matrícula de uma disciplina
// POST   /matriculas/sincronizar     -> salva o estado completo dos checkboxes
router.get('/matriculas/:alunoId',    autenticar, autorizar('admin'), matriculasController.listarPorAluno);
router.post('/matriculas',            autenticar, autorizar('admin'), matriculasController.matricular);
router.delete('/matriculas',          autenticar, autorizar('admin'), matriculasController.desmatricular);
router.post('/matriculas/sincronizar',autenticar, autorizar('admin'), matriculasController.sincronizar);

// Rotas de notas
// Listar notas por disciplina: admin e professor (professor só vê as suas)
// Lançar/atualizar nota: admin e professor (professor só lança nas suas disciplinas)
router.get('/notas/disciplina/:disciplinaId', autenticar, autorizar('admin', 'professor'), notasController.listarPorDisciplina);
router.put('/notas',                          autenticar, autorizar('admin', 'professor'), notasController.lancarOuAtualizar);

// Rota do boletim: qualquer perfil pode acessar, mas aluno só vê o próprio (controle no controller)
router.get('/boletim/:matricula', autenticar, autorizar('admin', 'professor', 'aluno'), boletimController.buscarPorMatricula);

module.exports = router;