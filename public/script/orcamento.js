const selectCaixa = document.getElementById("selectCaixa");
const precosDiv = document.getElementById("precos");
const precoPardaSpan = document.getElementById("precoParda");
const precoBrancaSpan = document.getElementById("precoBranca");
const btnGerar = document.getElementById("btnGerar");
const qtdInput = document.getElementById("quantidade");
const resultadoDiv = document.getElementById("resultado");
const modeloSelecionado = document.getElementById("modeloSelecionado");
const qtdSelecionada = document.getElementById("qtdSelecionada");
const totalPardaSpan = document.getElementById("totalParda");
const totalBrancaSpan = document.getElementById("totalBranca");
const btnCopiar = document.getElementById("btnCopiar");

let precoParda = 0;
let precoBranca = 0;
let modelo = "";

selectCaixa.addEventListener("change", () => {
    const option = selectCaixa.options[selectCaixa.selectedIndex];
    if (option.value) {
        precoParda = parseFloat(option.getAttribute("data-parda"));
        precoBranca = parseFloat(option.getAttribute("data-branca"));
        modelo = option.textContent;

        precoPardaSpan.textContent = precoParda.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        precoBrancaSpan.textContent = precoBranca.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        precosDiv.style.display = "block";
    } else {
        precosDiv.style.display = "none";
        resultadoDiv.style.display = "none";
    }
});

btnGerar.addEventListener("click", () => {
    const option = selectCaixa.options[selectCaixa.selectedIndex];

    // 🔴 Verifica se uma caixa foi selecionada
    if (!option || !option.value) {
        alert("Selecione um modelo de caixa antes de gerar o orçamento!");
        resultadoDiv.style.display = "none"; // esconde qualquer resultado anterior
        return;
    }

    const qtd = parseInt(qtdInput.value);

    if (!qtd || qtd <= 0 || isNaN(qtd)) {
        alert("Informe uma quantidade válida!");
        resultadoDiv.style.display = "none";
        return;
    }

    const totalParda = qtd * precoParda;
    const totalBranca = qtd * precoBranca;

    modeloSelecionado.textContent = modelo;
    qtdSelecionada.textContent = qtd;
    totalPardaSpan.textContent = totalParda.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    totalBrancaSpan.textContent = totalBranca.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    resultadoDiv.style.display = "block";
});


// Copiar orçamento
btnCopiar.addEventListener("click", () => {
    const texto =
        `📦 Orçamento\n` +
        `Modelo: ${modelo}\n` +
        `Quantidade: ${qtdSelecionada.textContent}\n` +
        `Total Parda: R$ ${totalPardaSpan.textContent}\n` +
        `Total Branca: R$ ${totalBrancaSpan.textContent}`;

    navigator.clipboard.writeText(texto).then(() => {
        alert("Orçamento copiado para a área de transferência!");
    });
});

const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchInput");
const tbody = document.querySelector("#caixasTable tbody");

searchBtn.addEventListener("click", function () {
    const searchValue = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#caixasTable tbody tr");
    let found = false;

    rows.forEach(row => {
        const codigo = row.cells[0]?.textContent.toLowerCase() || "";
        const modelo = row.cells[1]?.textContent.toLowerCase() || "";
        const fornecedor = row.cells[4]?.textContent.toLowerCase() || "";

        if (codigo.includes(searchValue) || modelo.includes(searchValue) || fornecedor.includes(searchValue)) {
            row.style.display = "";
            found = true;
        } else {
            row.style.display = "none";
        }
    });

    // Se nada foi encontrado
    let noResultRow = document.getElementById("noResultRow");
    if (!found) {
        if (!noResultRow) {
            const tr = document.createElement("tr");
            tr.id = "noResultRow";
            tr.innerHTML = `<td colspan="6" class="text-center">Nenhum resultado encontrado</td>`;
            tbody.appendChild(tr);
        }
    } else {
        if (noResultRow) noResultRow.remove();
    }
});

clearBtn.addEventListener("click", function () {
    const rows = document.querySelectorAll("#caixasTable tbody tr");
    searchInput.value = ""; // limpa campo
    rows.forEach(row => row.style.display = ""); // mostra todas as linhas
    const noResultRow = document.getElementById("noResultRow");
    if (noResultRow) noResultRow.remove();
});