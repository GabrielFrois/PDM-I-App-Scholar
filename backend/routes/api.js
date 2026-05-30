const express = require('express');
const router  = express.Router();

const { autenticar }      = require('../middlewares/auth');
const { autorizar }       = require('../middlewares/autorizar');

const authController        = require('../controllers/authController');
const alunosController      = require('../controllers/alunosController');
const professoresController = require('../controllers/professoresController');
const disciplinasController = require('../controllers/disciplinasController');
const boletimController     = require('../controllers/boletimController');
const notasController       = require('../controllers/notasController');

// Autenticação
router.post('/login', authController.login);

// Alunos
router.post('/alunos',       autenticar, autorizar('admin'),                       alunosController.cadastrar);
router.get('/alunos',        autenticar, autorizar('admin', 'professor', 'aluno'), alunosController.listar);
router.put('/alunos/:id',    autenticar, autorizar('admin', 'aluno'),              alunosController.atualizar);
router.delete('/alunos/:id', autenticar, autorizar('admin'),                       alunosController.remover);

// Professores
router.post('/professores',       autenticar, autorizar('admin'),              professoresController.cadastrar);
router.get('/professores',        autenticar, autorizar('admin', 'professor'), professoresController.listar);
router.put('/professores/:id',    autenticar, autorizar('admin', 'professor'), professoresController.atualizar);
router.delete('/professores/:id', autenticar, autorizar('admin'),              professoresController.remover);

// Disciplinas
router.post('/disciplinas',       autenticar, autorizar('admin'), disciplinasController.cadastrar);
router.get('/disciplinas',        autenticar, autorizar('admin', 'professor'), disciplinasController.listar);
router.put('/disciplinas/:id',    autenticar, autorizar('admin'), disciplinasController.atualizar);
router.delete('/disciplinas/:id', autenticar, autorizar('admin'), disciplinasController.remover);

// Notas
router.get('/notas/disciplina/:disciplinaId', autenticar, autorizar('admin', 'professor'), notasController.listarPorDisciplina);
router.put('/notas',                          autenticar, autorizar('admin', 'professor'), notasController.lancarOuAtualizar);

// Boletim
router.get('/boletim/:matricula', autenticar, autorizar('admin', 'professor', 'aluno'), boletimController.buscarPorMatricula);

module.exports = router;