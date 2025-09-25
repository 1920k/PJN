const BACKEND_URL = "https://escal.onrender.com/dados";

const diasSemana = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
const cargosPreDefinidos = ['Principal', 'Credencia', 'Palavra', 'Turibulo 1', 'Turibulo 2', 'Naveta 1', 'Naveta 2'];

const diaSelect = document.getElementById('dia-select');
const horarioInput = document.getElementById('horario-input');
const cargoSelect = document.getElementById('cargo-select');
const nomeInput = document.getElementById('nome-input');
const addBtn = document.getElementById('add-btn');
const whatsappBtn = document.getElementById('whatsapp-btn');
const escalaContainer = document.getElementById('escala-container');

let dados = {};
let editando = null;
let editandoHorario = null;

// Preencher selects
diasSemana.forEach(d => diaSelect.innerHTML += `<option value="${d}">${d}</option>`);
cargosPreDefinidos.forEach(c => cargoSelect.innerHTML += `<option value="${c}">${c}</option>`);

// Funções de backend
async function carregarDados() {
    try {
        const res = await fetch(BACKEND_URL);
        dados = await res.json();
        renderizarEscala();
    } catch {
        dados = {};
        renderizarEscala();
    }
}

async function salvarDados() {
    try {
        await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
    } catch (err) {
        console.error("Erro ao salvar:", err);
    }
}

// Adicionar nome
addBtn.onclick = () => {
    const dia = diaSelect.value;
    const horario = horarioInput.value;
    const cargo = cargoSelect.value;
    const nome = nomeInput.value.trim();
    if (!nome) return;

    if (!dados[dia]) dados[dia] = [];
    let horarioObj = dados[dia].find(h => h.horario === horario);
    if (!horarioObj) {
        horarioObj = { horario, cargos: [{ nome: cargo, pessoas: [nome] }] };
        dados[dia].push(horarioObj);
    } else {
        let cargoObj = horarioObj.cargos.find(c => c.nome === cargo);
        if (!cargoObj) horarioObj.cargos.push({ nome: cargo, pessoas: [nome] });
        else if (!cargoObj.pessoas.includes(nome)) cargoObj.pessoas.push(nome);
    }

    nomeInput.value = '';
    renderizarEscala();
    salvarDados();
};

// Renderizar escala
function renderizarEscala() {
    escalaContainer.innerHTML = '';
    Object.keys(dados).forEach(diaKey => {
        const diaDiv = document.createElement('div');
        diaDiv.className = 'dia';
        diaDiv.innerHTML = `<h2>${diaKey} <button onclick="apagarDia('${diaKey}')">🗑️</button></h2>`;

        dados[diaKey].forEach(h => {
            const horarioDiv = document.createElement('div');
            horarioDiv.className = 'horario';
            horarioDiv.innerHTML = `<h3>${h.horario} <button onclick="apagarHorario('${diaKey}','${h.horario}')">🗑️</button></h3>`;

            h.cargos.forEach(c => {
                const cargoDiv = document.createElement('div');
                cargoDiv.className = 'cargo';
                cargoDiv.innerHTML = `<h4>${c.nome}</h4><ul></ul>`;
                const ul = cargoDiv.querySelector('ul');
                c.pessoas.forEach(n => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${n}</span> <button onclick="apagarNome('${diaKey}','${h.horario}','${c.nome}','${n}')">❌</button>`;
                    ul.appendChild(li);
                });
                horarioDiv.appendChild(cargoDiv);
            });

            diaDiv.appendChild(horarioDiv);
        });

        escalaContainer.appendChild(diaDiv);
    });
}

// Apagar funções
window.apagarNome = (dia, horario, cargo, nome) => {
    const hObj = dados[dia].find(h => h.horario === horario);
    const cObj = hObj.cargos.find(c => c.nome === cargo);
    cObj.pessoas = cObj.pessoas.filter(n => n !== nome);
    renderizarEscala();
    salvarDados();
};

window.apagarHorario = (dia, horario) => {
    dados[dia] = dados[dia].filter(h => h.horario !== horario);
    renderizarEscala();
    salvarDados();
};

window.apagarDia = (dia) => {
    delete dados[dia];
    renderizarEscala();
    salvarDados();
};

// Gerar texto para WhatsApp
function gerarTexto() {
    let texto = "📅 *Escala da Semana*\n\n";
    Object.keys(dados).forEach(dia => {
        texto += `📌 *${dia}*\n`;
        dados[dia].forEach(h => {
            texto += `⏰ ${h.horario}\n`;
            h.cargos.forEach(c => {
                texto += `   • ${c.nome}: ${c.pessoas.join(", ") || "—"}\n`;
            });
        });
        texto += "\n";
    });
    return texto;
}

whatsappBtn.onclick = () => {
    const texto = encodeURIComponent(gerarTexto());
    window.open(`https://wa.me/?text=${texto}`, "_blank");
};

// Inicializar
carregarDados();
