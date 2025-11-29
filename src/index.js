require('dotenv').config({ silent: true });
const supabase = require('./config/supabase');
const express = require('express');
const cors = require('cors');
const app = express();

// Configuração
app.use(cors());
app.use(express.json());

// Rotas
const authRoutes = require('./routes/authRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
