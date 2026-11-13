const tokenInput = document.getElementById("token");
const connectButton = document.getElementById("conectar");
const content = document.getElementById("conteudo");
const message = document.getElementById("mensagem");
const form = document.getElementById("formTecnologia");
const nameInput = document.getElementById("nome");
const baseInput = document.getElementById("base");
const learningInput = document.getElementById("curvaAprendizado");
const saveButton = document.getElementById("salvar");
const cancelButton = document.getElementById("cancelar");
const searchInput = document.getElementById("pesquisa");
const count = document.getElementById("quantidade");
const tableBody = document.getElementById("listaTecnologias");

let tecnologias = [];
let editingId = null;

function mostrarMensagem(texto, tipo = "") {
    message.textContent = texto;
    message.className = tipo;
}

async function requisicaoApi(url, options = {}) {
    const token = tokenInput.value.trim();
    const resposta = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {})
        }
    });

    const resultado = await resposta.json();
    if (!resposta.ok) {
        throw new Error(resultado.mensagem || "Não foi possível concluir a solicitação.");
    }

    return resultado;
}

function criarCelula(texto) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    return celula;
}

function renderizarTecnologias() {
    const termo = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const filtradas = tecnologias.filter(tecnologia =>
        [tecnologia.nome, tecnologia.base, tecnologia.curvaAprendizado]
            .some(valor => valor.toLocaleLowerCase("pt-BR").includes(termo))
    );

    count.textContent = `${tecnologias.length} ${tecnologias.length === 1 ? "tecnologia" : "tecnologias"}`;
    tableBody.replaceChildren();

    if (filtradas.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.className = "empty-cell";
        cell.colSpan = 4;
        cell.textContent = termo
            ? "Nenhuma tecnologia encontrada."
            : "Nenhuma tecnologia cadastrada ainda.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    filtradas.forEach(tecnologia => {
        const row = document.createElement("tr");
        row.appendChild(criarCelula(tecnologia.nome));

        const baseCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "base-badge";
        badge.textContent = tecnologia.base;
        baseCell.appendChild(badge);
        row.appendChild(baseCell);

        row.appendChild(criarCelula(tecnologia.curvaAprendizado));

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "button button-secondary button-small";
        editButton.dataset.action = "edit";
        editButton.dataset.id = tecnologia._id;
        editButton.textContent = "Editar";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "button button-danger button-small";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = tecnologia._id;
        deleteButton.textContent = "Excluir";

        actions.append(editButton, deleteButton);
        actionsCell.appendChild(actions);
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
    });
}

async function carregarTecnologias() {
    tecnologias = await requisicaoApi("/api/tecnologias");
    renderizarTecnologias();
    content.classList.remove("hidden");
}

function limparEdicao() {
    editingId = null;
    form.reset();
    document.getElementById("form-title").textContent = "Cadastrar tecnologia";
    saveButton.textContent = "Cadastrar";
    cancelButton.classList.add("hidden");
}

connectButton.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
        mostrarMensagem("Informe o token de acesso.", "erro");
        tokenInput.focus();
        return;
    }

    sessionStorage.setItem("apiToken", token);
    mostrarMensagem("Conectando à API...");
    connectButton.disabled = true;

    try {
        await carregarTecnologias();
        mostrarMensagem("Conectado. Catálogo carregado com sucesso.", "sucesso");
    } catch (erro) {
        content.classList.add("hidden");
        mostrarMensagem(erro.message, "erro");
    } finally {
        connectButton.disabled = false;
    }
});

form.addEventListener("submit", async evento => {
    evento.preventDefault();

    const tecnologia = {
        nome: nameInput.value.trim(),
        base: baseInput.value,
        curvaAprendizado: learningInput.value.trim()
    };

    saveButton.disabled = true;
    mostrarMensagem(editingId ? "Atualizando tecnologia..." : "Cadastrando tecnologia...");

    try {
        const url = editingId
            ? `/api/tecnologias/${encodeURIComponent(editingId)}`
            : "/api/tecnologias";
        await requisicaoApi(url, {
            method: editingId ? "PUT" : "POST",
            body: JSON.stringify(tecnologia)
        });

        limparEdicao();
        await carregarTecnologias();
        mostrarMensagem("Tecnologia salva com sucesso.", "sucesso");
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    } finally {
        saveButton.disabled = false;
    }
});

tableBody.addEventListener("click", async evento => {
    const button = evento.target.closest("button[data-action]");
    if (!button) return;

    const tecnologia = tecnologias.find(item => item._id === button.dataset.id);
    if (!tecnologia) return;

    if (button.dataset.action === "edit") {
        editingId = tecnologia._id;
        nameInput.value = tecnologia.nome;
        baseInput.value = tecnologia.base;
        learningInput.value = tecnologia.curvaAprendizado;
        document.getElementById("form-title").textContent = "Editar tecnologia";
        saveButton.textContent = "Salvar alterações";
        cancelButton.classList.remove("hidden");
        nameInput.focus();
        return;
    }

    if (button.dataset.action === "delete") {
        if (!window.confirm(`Excluir a tecnologia "${tecnologia.nome}"?`)) return;

        button.disabled = true;
        try {
            await requisicaoApi(`/api/tecnologias/${encodeURIComponent(tecnologia._id)}`, {
                method: "DELETE"
            });
            await carregarTecnologias();
            mostrarMensagem("Tecnologia excluída com sucesso.", "sucesso");
        } catch (erro) {
            mostrarMensagem(erro.message, "erro");
            button.disabled = false;
        }
    }
});

cancelButton.addEventListener("click", limparEdicao);
searchInput.addEventListener("input", renderizarTecnologias);

const tokenSalvo = sessionStorage.getItem("apiToken");
if (tokenSalvo) {
    tokenInput.value = tokenSalvo;
    connectButton.click();
}
