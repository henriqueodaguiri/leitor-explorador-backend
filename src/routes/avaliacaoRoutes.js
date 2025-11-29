const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { criarAvaliacao, listarAvaliacoes,obterEstatisticas} = require('../controllers/avaliacaoController');

// Rotas protegidas por autenticação
router.post('/', verifyToken, criarAvaliacao);
router.get('/', verifyToken, listarAvaliacoes);
router.get('/estatisticas', verifyToken, obterEstatisticas); // 👈 Nova rota

module.exports = router;