const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
 
  const { email, senha } = req.body;

  try {
    // Busca usuário no Supabase
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'Credenciais invaalidas' });
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inváaalidas' });
    }

  
    // Gera token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Retorna sem a senha
    const { senha_hash, ...userData } = usuario;
    
    res.json({
      message: 'Login realizado com sucesso',
      token,
      usuario: userData
    });

  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

const logout = (req, res) => {
  // Em JWT stateless, o logout é feito pelo frontend (removendo o token)
  res.json({ message: 'Logout realizado com sucesso' });
};

const registrar = async (req, res) => {
  const { nome, email, nome_escola, senha, confirmar_senha } = req.body;
  try {
    // 1. Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    if (senha !== confirmar_senha) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
     // 2. Verifica se email já existe
    const { data: usuarioExistente, error: erroBusca } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();

    if (usuarioExistente) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // 3. Cria hash da senha
    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 4. Insere no banco
    const { data: novoUsuario, error: erroInsercao } = await supabase
      .from('usuarios')
      .insert([
        { 
          nome, 
          email, 
          nome_escola: nome_escola || null, 
          senha_hash: senhaHash 
        }
      ])
      .select();

    if (erroInsercao) {
      throw erroInsercao;
    }

     // 5. Gera token automaticamente (login após cadastro)
    const token = jwt.sign(
      { id: novoUsuario[0].id, email: novoUsuario[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 6. Retorna resposta (sem a senha)
    const { senha_hash, ...usuarioSemSenha } = novoUsuario[0];
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      usuario: usuarioSemSenha
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
// Atualizar Perfil
const atualizarPerfil = async (req, res) => {
  const { nome, email, nome_escola } = req.body;
  const usuarioId = req.userId;

  try {
    const { data: usuarioAtualizado, error } = await supabase
      .from('usuarios')
      .update({
        nome,
        email,
        nome_escola
      })
      .eq('id', usuarioId)
      .select();

    if (error) throw error;

    res.json({
      message: 'Perfil atualizado com sucesso',
      usuario: usuarioAtualizado[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

// Alterar Senha
const alterarSenha = async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  const usuarioId = req.userId;

  try {
    // Buscar usuário
    const { data: usuario, error: erroBusca } = await supabase
      .from('usuarios')
      .select('senha_hash')
      .eq('id', usuarioId)
      .single();

    if (erroBusca || !usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    // Criptografar nova senha
    const salt = await bcrypt.genSalt(12);
    const novaSenhaHash = await bcrypt.hash(nova_senha, salt);
 

    // Atualizar senha
    const { error: erroUpdate } = await supabase
      .from('usuarios')
      .update({ 
        senha_hash: novaSenhaHash
      })
      .eq('id', usuarioId);

    

    if (erroUpdate) throw erroUpdate;

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};

const deletarConta = async (req, res) => {
  const usuarioId = req.userId;

  try {
    // 1. Primeiro deleta as avaliações do usuário (por causa da foreign key)
    const { error: errorAvaliacoes } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('usuario_id', usuarioId);

    if (errorAvaliacoes) {
      console.error('Erro ao deletar avaliações:', errorAvaliacoes);
      // Continua mesmo com erro, tenta deletar o usuário
    }

    // 2. Depois deleta o usuário
    const { error: errorUsuario } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioId);

    if (errorUsuario) {
      throw errorUsuario;
    }

    res.json({ message: 'Conta excluída com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
};

module.exports = { 
  login, 
  logout, 
  registrar, 
  atualizarPerfil, 
  alterarSenha,
  deletarConta
};