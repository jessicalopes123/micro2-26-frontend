const dns = require("dns");

// Use public resolvers when the local DNS resolver rejects MongoDB SRV records.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

function obterCodigosDeConexao(erro) {
  const servidores = erro.reason && erro.reason.servers;
  if (!servidores) return "";

  const codigos = new Set();
  for (const servidor of servidores.values()) {
    const falha = servidor.error;
    const codigo = falha && (
      (falha.cause && falha.cause.code) ||
      falha.code
    );
    if (codigo) codigos.add(codigo);
  }

  return Array.from(codigos).join(", ");
}

async function connectDatabase() {
  const mongoUrl = process.env.MONGODB_URI;

  if (!mongoUrl) {
    throw new Error("Configure MONGODB_URI no arquivo .env.");
  }

  try {
    await mongoose.connect(mongoUrl);

    console.log("MongoDB conectado com sucesso!");
  } catch (error) {
    const codigos = obterCodigosDeConexao(error);
    const detalhe = codigos
      ? `${error.name}: ${codigos}`
      : error.name;

    console.error(`Erro ao conectar ao MongoDB (${detalhe}).`);
    throw new Error(`Falha na conexão com MongoDB (${detalhe}).`);
  }
}

module.exports = connectDatabase;
