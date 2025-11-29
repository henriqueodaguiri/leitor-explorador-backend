const supabase = require('../config/supabase');

const calcularMedia = (valores) => {
  const soma = valores.reduce((a, b) => a + b, 0);
  return parseFloat((soma / valores.length).toFixed(2));
};

const classificarNivel = (media) => {
  if (media >= 4) return 'Alta';
  if (media >= 3) return 'Média';
  return 'Baixa';
};

const criarAvaliacao = async (req, res) => {
  const { planejamento, monitoramento, avaliacao } = req.body;
  const usuarioId = req.userId;

  try {
    // Validação
    if (!planejamento || !monitoramento || !avaliacao || 
        planejamento.length !== 5 || monitoramento.length !== 5 || avaliacao.length !== 5) {
      return res.status(400).json({ error: 'Envie 5 respostas para cada dimensão' });
    }

    // Processe as médias primeiro
const resultados = {
  planejamento_media: calcularMedia(planejamento),
  planejamento_nivel: classificarNivel(calcularMedia(planejamento)),
  monitoramento_media: calcularMedia(monitoramento),
  monitoramento_nivel: classificarNivel(calcularMedia(monitoramento)),
  avaliacao_media: calcularMedia(avaliacao),
  avaliacao_nivel: classificarNivel(calcularMedia(avaliacao))
};

    // Insere no Supabase
    const { data, error } = await supabase
      .from('avaliacoes')
      .insert({
        usuario_id: usuarioId,
        ...resultados
      })
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Avaliação registrada com sucesso',
      avaliacao: data[0],
      resultados
    });

  } catch (err) {
    console.error('Erro ao criar avaliação:', err);
    res.status(500).json({ error: 'Erro ao salvar avaliação' });
  }
};

const listarAvaliacoes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('usuario_id', req.userId)
      ;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
};

// avaliacaoController.js - Função atualizada
const obterEstatisticas = async (req, res) => {
  try {
    const usuarioId = req.userId;

    // Buscar todas as avaliações do usuário
    const { data: avaliacoes, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    // Calcular estatísticas
    const totalAvaliacoes = avaliacoes.length;
    
    let mediaMaisAlta = 0;
    let avaliacaoMaisAlta = null;

    if (totalAvaliacoes > 0) {
      // Encontrar a avaliação com a média mais alta
      avaliacoes.forEach(avaliacao => {
        const mediaAtual = (
          avaliacao.planejamento_media + 
          avaliacao.monitoramento_media + 
          avaliacao.avaliacao_media
        ) / 3;
        
        if (mediaAtual > mediaMaisAlta) {
          mediaMaisAlta = mediaAtual;
          avaliacaoMaisAlta = {
            ...avaliacao,
            media_calculada: parseFloat(mediaAtual.toFixed(2))
          };
        }
      });
    }

    res.json({
      totalAvaliacoes,
      mediaMaisAlta: parseFloat(mediaMaisAlta.toFixed(2)),
      avaliacaoMaisAlta, // Opcional: enviar os dados completos da melhor avaliação
      temAvaliacoes: totalAvaliacoes > 0
    });

  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};


module.exports = { criarAvaliacao, listarAvaliacoes, obterEstatisticas};