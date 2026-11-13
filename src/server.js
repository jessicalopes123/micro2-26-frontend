const path = require("path");
const envPath = path.resolve(__dirname, "..", ".env");
require("dotenv").config({ path: envPath });

const crypto = require("crypto");
const express = require("express");
const connectDatabase = require("./config/database");
const Tecnologia = require("./models/tecnologia");

const app = express();
const PORT = process.env.PORT || 3003;
const BASES_VALIDAS = ["PHP", "C#", "JS"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

function validarToken(req, res, next) {
    const tokenConfigurado = process.env.API_TOKEN;

    if (!tokenConfigurado) {
        return res.status(500).json({
            mensagem: "A API_TOKEN não está configurada no servidor."
        });
    }

    const autorizacao = req.get("authorization") || "";
    const correspondencia = autorizacao.match(/^Bearer\s+(.+)$/i);

    if (!correspondencia) {
        return res.status(401).json({ mensagem: "Token não informado." });
    }

    const tokenRecebido = Buffer.from(correspondencia[1]);
    const tokenEsperado = Buffer.from(tokenConfigurado);
    const tokenValido =
        tokenRecebido.length === tokenEsperado.length &&
        crypto.timingSafeEqual(tokenRecebido, tokenEsperado);

    if (!tokenValido) {
        return res.status(401).json({ mensagem: "Token inválido." });
    }

    next();
}

function obterDadosTecnologia(body) {
    const dados = body || {};
    const { nome, base, curvaAprendizado } = dados;

    if (
        typeof nome !== "string" ||
        typeof base !== "string" ||
        typeof curvaAprendizado !== "string"
    ) {
        return { erro: "Informe nome, base e curva de aprendizado." };
    }

    const tecnologia = {
        nome: nome.trim(),
        base: base.trim().toUpperCase(),
        curvaAprendizado: curvaAprendizado.trim()
    };

    if (
        !tecnologia.nome ||
        !tecnologia.base ||
        !tecnologia.curvaAprendizado
    ) {
        return { erro: "Todos os campos são obrigatórios." };
    }

    if (
        tecnologia.nome.length > 80 ||
        tecnologia.curvaAprendizado.length > 100
    ) {
        return { erro: "Nome ou curva de aprendizado excede o limite de caracteres." };
    }

    if (!BASES_VALIDAS.includes(tecnologia.base)) {
        return { erro: "A base deve ser PHP, C# ou JS." };
    }

    return { tecnologia };
}

function responderErro(res, erro, acao) {
    if (erro.name === "ValidationError" || erro.name === "CastError") {
        return res.status(400).json({ mensagem: "Dados inválidos." });
    }

    console.error(`Erro ao ${acao}:`, erro.message);
    return res.status(500).json({ mensagem: `Erro ao ${acao}.` });
}

app.use("/api/tecnologias", validarToken);

app.get("/api/tecnologias", async (req, res) => {
    try {
        const tecnologias = await Tecnologia.find().sort({ nome: 1 });
        return res.status(200).json(tecnologias);
    } catch (erro) {
        return responderErro(res, erro, "buscar tecnologias");
    }
});

app.post("/api/tecnologias", async (req, res) => {
    const resultado = obterDadosTecnologia(req.body);

    if (resultado.erro) {
        return res.status(400).json({ mensagem: resultado.erro });
    }

    try {
        const tecnologia = await Tecnologia.create(resultado.tecnologia);
        return res.status(201).json(tecnologia);
    } catch (erro) {
        return responderErro(res, erro, "cadastrar tecnologia");
    }
});

app.put("/api/tecnologias/:id", async (req, res) => {
    const resultado = obterDadosTecnologia(req.body);

    if (resultado.erro) {
        return res.status(400).json({ mensagem: resultado.erro });
    }

    try {
        const tecnologia = await Tecnologia.findByIdAndUpdate(
            req.params.id,
            resultado.tecnologia,
            { new: true, runValidators: true }
        );

        if (!tecnologia) {
            return res.status(404).json({ mensagem: "Tecnologia não encontrada." });
        }

        return res.status(200).json(tecnologia);
    } catch (erro) {
        return responderErro(res, erro, "atualizar tecnologia");
    }
});

app.delete("/api/tecnologias/:id", async (req, res) => {
    try {
        const tecnologia = await Tecnologia.findByIdAndDelete(req.params.id);

        if (!tecnologia) {
            return res.status(404).json({ mensagem: "Tecnologia não encontrada." });
        }

        return res.status(200).json({
            mensagem: "Tecnologia excluída com sucesso."
        });
    } catch (erro) {
        return responderErro(res, erro, "excluir tecnologia");
    }
});

async function startServer() {
    if (!process.env.API_TOKEN || !process.env.API_TOKEN.trim()) {
        throw new Error(`Configure API_TOKEN no arquivo ${envPath}.`);
    }

    if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
        throw new Error(`Configure MONGODB_URI no arquivo ${envPath}.`);
    }

    await connectDatabase();

    return app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch(erro => {
        console.error("Erro ao iniciar o servidor:", erro.message);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer };
