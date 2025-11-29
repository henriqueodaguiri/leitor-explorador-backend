const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { 
  login,
  logout ,
  registrar, 
  atualizarPerfil, 
  alterarSenha,
  deletarConta 
} = require('../controllers/authController');

// Rota de login
router.post('/login', login);

// Rota de logout
router.post('/logout', logout);

// Rota de Registro 
router.post('/registrar', registrar);

// Rota de perfil 
router.put('/perfil', verifyToken, atualizarPerfil);

// Rota de alterar senha 
router.put('/alterar-senha', verifyToken, alterarSenha);

// Nova rota para deletar conta
router.delete('/conta', verifyToken, deletarConta);


module.exports = router;