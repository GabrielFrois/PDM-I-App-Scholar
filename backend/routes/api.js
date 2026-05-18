const express = require('express');
const router = express.Router();

const { autenticar }  = require('../middlewares/auth');
const { autorizar }   = require('../middlewares/autorizar');

const authController        = require('../controllers/authController');
const alunosController      = require('../controllers/alunosController');
const professoresController = require('../controllers/professoresController');
const disciplinasController = require('../controllers/disciplinasController');
const boletimController     = require('../controllers/boletimController');
const notasController       = require('../controllers/notasController');

// ─── Autenticação (aberta) ───────────────────────────────────────────
router.post('/login', authController.login);

// ─── Alunos ──────────────────────────────────────────────────────────
// Cadastrar: somente admin
router.post('/alunos',     autenticar, autorizar('admin'),                    alunosController.cadastrar);
// Listar: admin e professor
router.get('/alunos',      autenticar, autorizar('admin', 'professor'),        alunosController.listar);
// Atualizar: admin (qualquer) ou aluno (próprio — verificado no controller)
router.put('/alunos/:id',  autenticar, autorizar('admin', 'aluno'),            alunosController.atualizar);

// ─── Professores ─────────────────────────────────────────────────────
// Cadastrar: somente admin
router.post('/professores',     autenticar, autorizar('admin'),                         professoresController.cadastrar);
// Listar: admin e professor
router.get('/professores',      autenticar, autorizar('admin', 'professor'),             professoresController.listar);
// Atualizar: admin (qualquer) ou professor (próprio — verificado no controller)
router.put('/professores/:id',  autenticar, autorizar('admin', 'professor'),             professoresController.atualizar);

// ─── Disciplinas ─────────────────────────────────────────────────────
// Cadastrar: somente admin
router.post('/disciplinas',  autenticar, autorizar('admin'),                    disciplinasController.cadastrar);
// Listar: admin e professor
router.get('/disciplinas',   autenticar, autorizar('admin', 'professor'),        disciplinasController.listar);

// ─── Notas ───────────────────────────────────────────────────────────
// Listar notas por disciplina: admin e professor (ownership verificado no controller)
router.get('/notas/disciplina/:disciplinaId', autenticar, autorizar('admin', 'professor'), notasController.listarPorDisciplina);
// Lançar/atualizar notas: admin e professor (ownership verificado no controller)
router.put('/notas',  autenticar, autorizar('admin', 'professor'),  notasController.lancarOuAtualizar);

// ─── Boletim ─────────────────────────────────────────────────────────
// Aluno: acessa somente o próprio boletim (verificado no controller)
// Admin e professor: acesso livre
router.get('/boletim/:matricula', autenticar, autorizar('admin', 'professor', 'aluno'), boletimController.buscarPorMatricula);

module.exports = router;