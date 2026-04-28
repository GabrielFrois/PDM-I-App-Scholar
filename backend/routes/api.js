const express = require('express');
const router = express.Router();

const { autenticar } = require('../middlewares/auth');

const authController        = require('../controllers/authController');
const alunosController      = require('../controllers/alunosController');
const professoresController = require('../controllers/professoresController');
const disciplinasController = require('../controllers/disciplinasController');
const boletimController     = require('../controllers/boletimController');

// Autenticação
router.post('/login', authController.login);

// Alunos
router.post('/alunos',  autenticar, alunosController.cadastrar);
router.get('/alunos',   autenticar, alunosController.listar);

// Professores
router.post('/professores', autenticar, professoresController.cadastrar);
router.get('/professores',  autenticar, professoresController.listar);

// Disciplinas
router.post('/disciplinas', autenticar, disciplinasController.cadastrar);
router.get('/disciplinas',  autenticar, disciplinasController.listar);

// Boletim
router.get('/boletim/:matricula', autenticar, boletimController.buscarPorMatricula);

module.exports = router;