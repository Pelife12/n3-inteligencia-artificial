// ==========================================
// VARIÁVEIS GLOBAIS E ESTADO
// ==========================================
let dadosGlobais = {};
let macroChartInstance = null;
let currentImageB64 = "";
let timerInterval, tempoRestante = 0;
let globalTimerInterval, tempoGlobalSegundos = 0;
let todosParceiros = [];
let treino_series_completas = 0;
let treino_series_total = 0;

// ==========================================
// UTILITÁRIOS: TOASTS E CORES
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: '<i class="fa-solid fa-circle-check text-success"></i>',
        error:   '<i class="fa-solid fa-circle-exclamation text-danger"></i>',
        info:    '<i class="fa-solid fa-circle-info text-primary"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i>'
    };
    toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('leaving');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3500);
}

function setPrimaryColorAdaptive(hexColor) {
    if (!hexColor) return;
    document.documentElement.style.setProperty('--primary', hexColor);
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
    const textColor = ((r*299 + g*587 + b*114)/1000 >= 128) ? '#0f172a' : '#ffffff';
    document.documentElement.style.setProperty('--text-on-primary', textColor);
}

function getSkeletonHTML(tipo) {
    const card = (content) => `<div class="sk-card">${content}</div>`;
    if (tipo === 'dieta') return [
        card('<div class="skeleton sk-title"></div><div class="skeleton sk-text"></div><div class="skeleton sk-text short"></div>'),
        card('<div class="skeleton sk-title"></div><div class="skeleton sk-text"></div>')
    ].join('');
    if (tipo === 'treino') return [1,2,3,4].map(() => card('<div class="skeleton sk-text" style="height:18px; width:50%; margin-bottom:8px;"></div><div class="skeleton sk-text short"></div>')).join('');
    return `<div class="skeleton sk-text"></div>`;
}

// ==========================================
// CARREGAMENTO DE DADOS
// ==========================================
function configurarHeader() {
    const h = new Date().getHours();
    const s = h >= 5 && h < 12 ? "Bom dia," : h >= 12 && h < 18 ? "Boa tarde," : "Boa noite,";
    document.getElementById('greeting-text').innerText = s;
    document.getElementById('header-date').innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

async function carregarDados() {
    configurarHeader();
    document.getElementById('dieta-content').innerHTML = getSkeletonHTML('dieta');
    document.getElementById('workout-cards-container').innerHTML = `<div class="sk-card"><div class="skeleton sk-text"></div></div>`.repeat(4);
    document.getElementById('evolucao-content').innerHTML = getSkeletonHTML('dieta');

    try {
        const res = await fetch(`/api/public/aluno_data/${ALUNO_TOKEN}`);
        if (!res.ok) throw new Error("Erro de servidor");
        dadosGlobais = JSON.parse(await res.text()) || {};

        document.getElementById('header-name').innerText = dadosGlobais.nome || "Aluno";
        if (dadosGlobais.cor_primaria) setPrimaryColorAdaptive(dadosGlobais.cor_primaria);

        renderizarDieta();
        renderizarListaCompras();
        prepararAbaTreino();
        renderizarEvolucao();

        let pAgua = dadosGlobais.peso_inicial || 70;
        if (dadosGlobais.evolucao?.length) pAgua = dadosGlobais.evolucao[dadosGlobais.evolucao.length - 1].peso || pAgua;
        document.getElementById('water-goal').innerText = Math.round(pAgua * 35);
        updateWaterUI();

    } catch (e) {
        document.getElementById('dieta-content').innerHTML = `<div class="empty-state"><i class="fa-solid fa-wifi-slash"></i><p>Sem conexão. Tente novamente.</p></div>`;
    }
}

function switchTab(id) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tabs > .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    event.currentTarget.classList.add('active');
    if (id === 'compras' && todosParceiros.length === 0) carregarLojasParceiras();
}

// ==========================================
// MÓDULO: DIETA E LISTA DE COMPRAS
// ==========================================
function renderizarDieta() {
    const divDieta = document.getElementById('dieta-content');
    const dieta = dadosGlobais.dieta;
    if (!dieta?.refeicoes?.length) {
        divDieta.innerHTML = `<div class="empty-state"><i class="fa-solid fa-bowl-food"></i><p>Plano alimentar ainda não prescrito.</p></div>`;
        document.getElementById('macros-card').style.display = 'none';
        return;
    }

    let html = "";
    let totP = 0, totC = 0, totG = 0, totKcal = 0;
    const temMacrosGlobais = dieta.macros?.kcal > 0;

    if (temMacrosGlobais) {
        totP = parseFloat(dieta.macros.p) || 0; totC = parseFloat(dieta.macros.c) || 0;
        totG = parseFloat(dieta.macros.g) || 0; totKcal = parseFloat(dieta.macros.kcal) || 0;
    }

    dieta.refeicoes.forEach(ref => {
        html += `<div class="card-padrao"><div class="card-header"><span><i class="fa-solid fa-utensils text-primary" style="margin-right:6px;"></i>${ref.titulo || "Refeição"}</span><span class="meal-time-badge">⏰ ${ref.horario || "--:--"}</span></div>`;
        (ref.alimentos || []).forEach(ali => {
            const qtd = ali.quantidade || ali.gramas || "--", unit = ali.unidade || "g";
            const nomeSeguro = (ali.nome || "Alimento").replace(/'/g, "\\'").replace(/"/g, "&quot;");

            const calInfo = ali.calorias ? `<span class="food-cal">🔥 ${parseFloat(ali.calorias).toFixed(0)} kcal</span>` : '';
            let macrosBadges = '';
            if (ali.proteina) macrosBadges += `<span class="food-macro-badge p">P ${parseFloat(ali.proteina).toFixed(0)}g</span>`;
            if (ali.carboidrato) macrosBadges += `<span class="food-macro-badge c">C ${parseFloat(ali.carboidrato).toFixed(0)}g</span>`;
            if (ali.gordura) macrosBadges += `<span class="food-macro-badge g">G ${parseFloat(ali.gordura).toFixed(0)}g</span>`;
            const macrosRow = macrosBadges ? `<div class="food-macro-row">${macrosBadges}</div>` : '';

            html += `<div class="food-item">
                        <div style="min-width:0; flex:1;"><span class="food-name">${ali.nome || "Alimento"}</span>${calInfo}${macrosRow}</div>
                        <div class="food-actions"><span class="food-qty">${qtd} ${unit}</span><button class="btn-swap" onclick="sugerirSubst('${nomeSeguro}', '${qtd} ${unit}')"><i class="fa-solid fa-rotate" style="font-size:0.8rem;"></i></button></div>
                     </div>`;
            if (!temMacrosGlobais) {
                totP += parseFloat(ali.proteina) || 0; totC += parseFloat(ali.carboidrato) || 0;
                totG += parseFloat(ali.gordura) || 0; totKcal += parseFloat(ali.calorias) || 0;
            }
        });
        html += `</div>`;
    });

    if (dieta.suplementos) html += `<div class="card-padrao"><div class="card-header"><span>💊 Suplementação</span></div><div style="padding:16px 18px; font-size:0.9rem; line-height:1.7; color:#475569; white-space:pre-wrap;">${dieta.suplementos}</div></div>`;
    divDieta.innerHTML = html;

    document.getElementById('macros-card').style.display = 'block';
    document.getElementById('macro-p-val').innerText = totP.toFixed(0) + 'g';
    document.getElementById('macro-c-val').innerText = totC.toFixed(0) + 'g';
    document.getElementById('macro-g-val').innerText = totG.toFixed(0) + 'g';
    document.getElementById('macro-kcal-val').innerText = totKcal.toFixed(0);

    const ctx = document.getElementById('macroChart').getContext('2d');
    if (macroChartInstance) macroChartInstance.destroy();
    macroChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: ['Proteína', 'Carbo', 'Gordura'], datasets: [{ data: [totP, totC, totG], backgroundColor: ['#ef4444','#0ea5e9','#f59e0b'], borderWidth: 0 }] }, options: { cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
}

function renderizarListaCompras() {
    const divCompras = document.getElementById('compras-content');
    if (!dadosGlobais.dieta?.refeicoes) return divCompras.innerHTML = `<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>A lista será gerada automaticamente.</p></div>`;

    const lista = {};
    dadosGlobais.dieta.refeicoes.forEach(ref => {
        (ref.alimentos || []).forEach(ali => {
            const nome = ali.nome, qtd = parseFloat(ali.quantidade || ali.gramas) || 0, unidade = ali.unidade || "g";
            if (nome && qtd > 0) {
                const chave = `${nome}_${unidade}`;
                if (!lista[chave]) lista[chave] = { nome, qtdDiaria: 0, unidade };
                lista[chave].qtdDiaria += qtd;
            }
        });
    });

    const calc = Object.values(lista).map(item => {
        let q = item.qtdDiaria * 7, u = item.unidade;
        if (u === 'g' && q >= 1000) { q = (q / 1000).toFixed(2); u = 'kg'; }
        else if (u === 'ml' && q >= 1000) { q = (q / 1000).toFixed(2); u = 'L'; }
        else { q = parseFloat(q).toFixed(u === 'g' ? 0 : 1); }
        return { nome: item.nome, total: `${q} ${u}` };
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    if (calc.length > 0) {
        document.getElementById('compras-actions').style.display = 'block';
        let html = `<div class="card-padrao"><div class="card-header"><span><i class="fa-solid fa-cart-shopping text-primary" style="margin-right:6px;"></i>Para 7 Dias</span><span class="text-muted font-0-85">${calc.length} itens</span></div>`;
        calc.forEach(c => html += `<div class="food-item"><span class="food-name">${c.nome}</span><span class="food-qty" style="background:#f1f5f9; color:#475569;">${c.total}</span></div>`);
        divCompras.innerHTML = html + `</div>`;
        window.listaComprasAtual = calc.map(c => `- ${c.nome}: ${c.total}`).join('\n');
    } else { divCompras.innerHTML = `<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>Nenhum alimento na dieta.</p></div>`; }
}

function compartilharListaCompras() {
    const texto = `🛒 *Minha Lista de Compras (Pumpo)*\n\n${window.listaComprasAtual}`;
    if (navigator.share) navigator.share({ title: 'Lista', text: texto }).catch(() => {});
    else navigator.clipboard.writeText(texto).then(() => showToast('Lista copiada!', 'success'));
}

function alternarAbaCompras(aba) {
    ['lista','loja'].forEach(a => document.getElementById(`btn-compras-${a}`).classList.toggle('active', a === aba));
    document.getElementById('compras-content').style.display = aba === 'lista' ? 'block' : 'none';
    document.getElementById('compras-actions').style.display = aba === 'lista' && window.listaComprasAtual ? 'block' : 'none';
    document.getElementById('loja-content').style.display = aba === 'loja' ? 'block' : 'none';
}

async function carregarLojasParceiras() {
    try {
        const res = await fetch('/api/public/parceiros');
        if (res.ok) {
            todosParceiros = await res.json();
            const categorias = [...new Set(todosParceiros.map(p => p.categoria))];
            let html = `<div class="filtro-chip active" onclick="filtrarLoja('Todos', this)">Todas</div>`;
            categorias.forEach(cat => { if (cat) html += `<div class="filtro-chip" onclick="filtrarLoja('${cat}', this)">${cat}</div>`; });
            document.getElementById('loja-filtros').innerHTML = html;
            filtrarLoja('Todos');
        }
    } catch(e) {}
}
function filtrarLoja(categoria, btnElement) {
    if (btnElement) { document.querySelectorAll('.filtro-chip').forEach(b => b.classList.remove('active')); btnElement.classList.add('active'); }
    const filtrados = categoria === 'Todos' ? todosParceiros : todosParceiros.filter(p => p.categoria === categoria);
    const grid = document.getElementById('loja-grid');
    if (!filtrados.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-box-open"></i><p>Sem produtos nesta categoria.</p></div>'; return; }
    grid.innerHTML = filtrados.map(p => `
        <div class="produto-card">
            <img src="${p.imagem || 'https://placehold.co/150'}" class="produto-img" onerror="this.src='https://placehold.co/150'">
            <span class="produto-loja">${p.loja}</span><div class="produto-titulo">${p.titulo}</div><div class="produto-preco">${p.preco || '-'}</div>
            <a href="${p.link}" target="_blank" class="btn btn-success btn-block" style="padding:10px; font-size:0.88rem;">Comprar</a>
        </div>
    `).join('');
}

// ==========================================
// MÓDULO: TREINO (COM CAPTURA DE DADOS DE DESEMPENHO)
// ==========================================
function prepararAbaTreino() {
    const container = document.getElementById('workout-cards-container');
    if (!dadosGlobais.treino?.ficha?.length) return container.innerHTML = '<p class="text-muted font-0-85 px-5" style="grid-column:1/-1;">Nenhuma ficha de treino registrada.</p>';
    let html = '';
    dadosGlobais.treino.ficha.forEach((t, idx) => {
        html += `<div class="workout-card" onclick="selecionarTreino('${idx}', this)"><h4>${t.titulo || 'Treino'}</h4><p>${t.foco || ((t.exercicios || []).length + ' exercícios')}</p></div>`;
    });
    html += `<div class="workout-card rest" onclick="selecionarTreino('descanso', this)"><h4>😴 Descanso</h4><p>Recuperação</p></div>`;
    container.innerHTML = html;
}

function selecionarTreino(val, elemento) {
    document.querySelectorAll('.workout-card').forEach(c => c.classList.remove('active'));
    elemento.classList.add('active');
    clearInterval(globalTimerInterval); fecharCronometro();
    document.getElementById('box-progresso-treino').style.display = 'none';
    document.getElementById('treino-content').innerHTML = '';
    document.getElementById('btn-finalizar-treino-box').style.display = 'none';
    document.getElementById('workout-cards-container').dataset.selected = val;
    document.getElementById('bloco-iniciar-treino').style.display = val !== "descanso" ? 'block' : 'none';
    document.getElementById('btn-descanso-box').style.display = val === "descanso" ? 'block' : 'none';
}

function iniciarTreinoOficial() {
    const val = document.getElementById('workout-cards-container').dataset.selected;
    document.getElementById('bloco-iniciar-treino').style.display = 'none';
    tempoGlobalSegundos = 0;
    document.getElementById('global-timer-display').innerText = "00:00";
    globalTimerInterval = setInterval(() => { tempoGlobalSegundos++; document.getElementById('global-timer-display').innerText = formatarTempo(tempoGlobalSegundos); }, 1000);

    const treino = dadosGlobais.treino.ficha[val];
    document.getElementById('treino-ativo-titulo').innerText = treino.titulo || "Treino";
    document.getElementById('treino-ativo-foco').innerText = treino.foco || "";

    let html = '';
    (treino.exercicios || []).forEach((ex, exIdx) => {
        const s = Math.min(parseInt((ex.series || "1").toString().match(/\d+/) || 1), 20);
        const nomeSeguro = (ex.nome || "Exercício").replace(/'/g, "\\'").replace(/"/g, "&quot;");
        let tags = `<span class="exercise-tag reps">🎯 ${ex.reps || '-'}</span>`;
        if (ex.rest && ex.rest !== '0') tags += `<span class="exercise-tag rest">⏳ ${ex.rest}</span>`;
        if (ex.tecnica) tags += `<span class="exercise-tag special">${ex.tecnica}</span>`;

        let rows = '';
        for (let i = 1; i <= s; i++) {
            rows += `<div class="set-row" id="set-${exIdx}-${i}">
                        <span class="set-num">${i}</span>
                        <input type="number" placeholder="kg" class="set-input carga-input" inputmode="decimal">
                        <input type="number" placeholder="reps" class="set-input reps-input" inputmode="numeric">
                        <button class="btn btn-check-set" onclick="toggleSet(this, '${ex.rest || '0'}')"><i class="fa-solid fa-check"></i></button>
                     </div>`;
        }
        html += `<div class="exercise-card">
                    <div class="flex-between" style="margin-bottom:12px;">
                        <div style="flex:1; min-width:0;"><div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;"><span class="exercise-number">${exIdx + 1}</span><h4 class="m-0 ex-nome" style="font-size:0.98rem; font-weight:800; color:var(--dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ex.nome || "Exercício"}</h4></div><div>${tags}</div></div>
                        <button class="btn-swap" style="width:38px; height:38px; background:#f0f9ff; border-color:#bae6fd; margin-left:10px;" onclick="verExecucao('${nomeSeguro}')" title="Ver execução"><i class="fa-solid fa-play text-primary" style="font-size:0.75rem;"></i></button>
                    </div>
                    <div style="display:flex; gap:6px; padding-bottom:8px; border-bottom:1px solid #f3f6f9; margin-bottom:4px;">
                        <span class="set-num"></span><span style="flex:1; font-size:0.7rem; font-weight:800; color:#94a3b8; text-align:center; text-transform:uppercase;">Carga</span><span style="flex:1; font-size:0.7rem; font-weight:800; color:#94a3b8; text-align:center; text-transform:uppercase;">Reps</span><span style="width:40px;"></span>
                    </div>
                    ${rows}
                 </div>`;
    });

    document.getElementById('treino-content').innerHTML = html;
    document.getElementById('box-progresso-treino').style.display = 'block';
    document.getElementById('btn-finalizar-treino-box').style.display = 'block';
    updateTreinoProgress();
}

function toggleSet(btn, rest) {
    const isCompleted = btn.classList.contains('completed');
    btn.classList.toggle('completed'); btn.parentElement.classList.toggle('completed');
    updateTreinoProgress(); if (!isCompleted) iniciarCronometro(rest);
}
function updateTreinoProgress() {
    const total = document.querySelectorAll('.btn-check-set').length, done = document.querySelectorAll('.btn-check-set.completed').length;
    const p = total === 0 ? 0 : Math.round((done / total) * 100);
    document.getElementById('treino-perc-bar').style.width = p + '%'; document.getElementById('treino-perc-text').innerText = p + '%';
}

function iniciarCronometro(restText) {
    const segs = parseInt((restText || '').replace(/[^0-9]/g, '')) || 0;
    if (segs <= 0) return;
    clearInterval(timerInterval); tempoRestante = segs;
    const ft = document.getElementById('floating-timer'); ft.classList.remove('finished');
    document.getElementById('timer-display').innerText = formatarTempo(tempoRestante); ft.style.display = 'flex';
    timerInterval = setInterval(() => {
        tempoRestante--; document.getElementById('timer-display').innerText = formatarTempo(tempoRestante);
        if (tempoRestante <= 0) {
            clearInterval(timerInterval); ft.classList.add('finished');
            if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                [0, 0.15, 0.3].forEach(delay => {
                    const osc = ctx.createOscillator(), gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 880;
                    gain.gain.setValueAtTime(0.3, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
                    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.2);
                });
            } catch(e) {}
            setTimeout(fecharCronometro, 4500);
        }
    }, 1000);
}
function fecharCronometro() { clearInterval(timerInterval); document.getElementById('floating-timer').style.display = 'none'; }
function formatarTempo(s) { return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`; }

async function finalizarTreino() {
    const doneBtns = document.querySelectorAll('.btn-check-set.completed');
    const total = document.querySelectorAll('.btn-check-set').length;
    if (doneBtns.length === 0) return showToast("Conclua ao menos uma série antes de finalizar.", "error");

    clearInterval(globalTimerInterval);
    const val = document.getElementById('workout-cards-container').dataset.selected;
    const tr = dadosGlobais.treino.ficha[val].titulo;
    const mins = Math.ceil(tempoGlobalSegundos / 60);
    const st = doneBtns.length === total ? `Completo (${mins}m)` : `Parcial (${doneBtns.length}/${total}) em ${mins}m`;

    let volumeTotalKg = 0;
    let detalhesExercicio = [];

    document.querySelectorAll('.exercise-card').forEach(card => {
        const exNome = card.querySelector('.ex-nome').innerText;
        let seriesConcluidas = [];

        card.querySelectorAll('.set-row.completed').forEach(row => {
            const carga = parseFloat(row.querySelector('.carga-input').value) || 0;
            const reps = parseInt(row.querySelector('.reps-input').value) || 0;
            volumeTotalKg += (carga * reps);
            seriesConcluidas.push({ carga, reps });
        });

        if (seriesConcluidas.length > 0) {
            detalhesExercicio.push({ exercicio: exNome, series: seriesConcluidas });
        }
    });

    const payloadTreino = {
        token: ALUNO_TOKEN,
        treino_nome: tr,
        status: st,
        duracao_minutos: mins,
        volume_total_kg: volumeTotalKg,
        detalhes: detalhesExercicio
    };

    document.getElementById('cel-treino-nome').innerText = tr;
    document.getElementById('cel-series').innerText = `${doneBtns.length}/${total}`;
    document.getElementById('cel-tempo').innerText = mins + 'm';
    document.getElementById('cel-status').innerText = doneBtns.length === total ? '🎯 Completo' : '⚡ Parcial';

    try {
        await fetch('/api/public/treino/concluir', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadTreino)
        });
        document.getElementById('celebration-overlay').classList.remove('hidden');
        document.getElementById('workout-cards-container').dataset.selected = "";
        prepararAbaTreino();
        document.getElementById('treino-content').innerHTML = '';
        document.getElementById('btn-finalizar-treino-box').style.display = 'none';
        document.getElementById('box-progresso-treino').style.display = 'none';
        carregarDados();
    } catch(e) {
        showToast("Erro ao salvar treino.", "error");
    }
}
function fecharCelebracao() { document.getElementById('celebration-overlay').classList.add('hidden'); }
async function finalizarDescanso() {
    try {
        await fetch('/api/public/treino/concluir', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: ALUNO_TOKEN, treino_nome: "Descanso", status: "Descansou", duracao_minutos: 0, volume_total_kg: 0, detalhes: [] })
        });
        showToast("Descanso registrado! Recuperação é fundamental. 💤", "success");
        prepararAbaTreino(); document.getElementById('btn-descanso-box').style.display = 'none';
        carregarDados();
    } catch(e) { showToast("Erro ao registrar descanso.", "error"); }
}

// ==========================================
// MÓDULO: EVOLUÇÃO (MÉTRICAS DE FORÇA + MEDIDAS)
// ==========================================
function renderizarEvolucao() {
    const divEvo = document.getElementById('evolucao-content');
    const evos = dadosGlobais.evolucao || [];
    const historicoTreinos = dadosGlobais.historico_treinos || [];

    let htmlFinal = '';

    if (historicoTreinos.length > 0) {
        const treinosForca = historicoTreinos.filter(t => t.volume_total_kg > 0);
        let listaTreinosHtml = '';
        const ultimosTreinos = [...historicoTreinos].reverse().slice(0, 4);

        ultimosTreinos.forEach(t => {
            const isDescanso = t.treino_nome === 'Descanso';
            const dataF = t.data ? t.data.substring(0, 10).split('-').reverse().join('/') : 'Recente';
            const icon = isDescanso ? '💤' : '🎯';
            const infoRight = isDescanso ? '<span style="color:#94a3b8; font-size:0.8rem; font-weight:700;">Descanso</span>' :
                `<span style="display:block; color:var(--primary); font-weight:800; font-size:0.95rem; line-height:1;">${t.volume_total_kg} <small style="font-size:0.6rem;">KG</small></span>
                 <span style="font-size:0.6rem; color:#94a3b8; text-transform:uppercase; font-weight:700;">Volume</span>`;

            listaTreinosHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f1f5f9;">
                <div>
                    <strong style="color:var(--dark); font-size:0.9rem; display:block; margin-bottom:2px;">${icon} ${t.treino_nome || t.treino || 'Treino'}</strong>
                    <span style="color:#94a3b8; font-size:0.75rem;"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${t.duracao_minutos || '--'} min &nbsp;•&nbsp; ${dataF}</span>
                </div>
                <div style="text-align:right;">${infoRight}</div>
            </div>`;
        });

        const totalCarga = historicoTreinos.reduce((acc, curr) => acc + (curr.volume_total_kg || 0), 0);

        htmlFinal += `
        <div class="card-padrao">
            <div class="card-header" style="background:#f0f9ff; color:#0369a1; border-color:#bae6fd;">
                <span><i class="fa-solid fa-fire text-primary" style="margin-right:6px;"></i>Desempenho de Treino</span>
            </div>
            <div class="evo-grid">
                <div class="evo-box" style="text-align:center;">
                    <span style="margin-bottom:8px;">Treinos Concluídos</span>
                    <strong class="text-primary" style="font-size:2rem;">${historicoTreinos.length}</strong>
                </div>
                <div class="evo-box" style="text-align:center;">
                    <span style="margin-bottom:8px;">Carga Total Movida</span>
                    <strong style="color:var(--dark); font-size:1.5rem;">${totalCarga.toLocaleString('pt-BR')} <small style="font-size:0.8rem; color:#64748b;">kg</small></strong>
                </div>
            </div>
            <div style="padding:0 16px 16px;">
                <h4 style="font-size:0.75rem; color:#94a3b8; margin:10px 0 5px 0; text-transform:uppercase; letter-spacing:0.5px;">Últimas Atividades</h4>
                ${listaTreinosHtml}
            </div>
        </div>`;

        if (treinosForca.length > 1) {
            htmlFinal += `
            <div class="card-padrao">
                <div class="card-header"><span><i class="fa-solid fa-chart-line text-primary" style="margin-right:6px;"></i>Evolução de Carga (Volume)</span></div>
                <div style="padding:16px;"><canvas id="chartVolume" style="max-height:180px;"></canvas></div>
            </div>`;
        }
    } else {
        htmlFinal += `<div class="card-padrao"><div style="padding:30px 20px; text-align:center; color:#94a3b8;"><i class="fa-solid fa-dumbbell fa-2x" style="margin-bottom:10px; opacity:0.5;"></i><p style="margin:0; font-size:0.9rem;">Nenhum treino registrado ainda. Comece hoje!</p></div></div>`;
    }

    if (evos.length === 0) {
        htmlFinal += `<div class="empty-state"><i class="fa-solid fa-scale-balanced"></i><p>Ainda não há avaliações registradas.</p></div>`;
    } else {
        const primeira = evos[0], ultima = evos[evos.length - 1];
        const p_primeira = primeira.peso || 0, p_ultima = ultima.peso || 0;
        const diff = p_ultima - p_primeira;

        let badgeDiff = '';
        if (diff < 0) badgeDiff = `<span class="text-success" style="font-size:1.1rem; font-weight:800;"><i class="fa-solid fa-arrow-down"></i> ${Math.abs(diff).toFixed(1)}kg</span>`;
        else if (diff > 0) badgeDiff = `<span class="text-danger" style="font-size:1.1rem; font-weight:800;"><i class="fa-solid fa-arrow-up"></i> ${diff.toFixed(1)}kg</span>`;
        else badgeDiff = `<span class="text-muted" style="font-size:1.1rem; font-weight:800;"><i class="fa-solid fa-minus"></i> Manteve</span>`;

        let fotosHtml = '';
        if (ultima.foto_frente || ultima.foto_perfil || ultima.foto_costas) {
            fotosHtml = `<div style="display:flex; gap:10px; overflow-x:auto; padding:16px; background:white; border:1px solid #e8eef4; border-radius:var(--radius-card); margin-bottom:16px; scrollbar-width:none;">`;
            ['foto_frente','foto_perfil','foto_costas'].forEach(k => { if (ultima[k]) fotosHtml += `<img src="${ultima[k]}" style="width:115px; height:155px; object-fit:cover; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); flex-shrink:0;">`; });
            fotosHtml += `</div>`;
        }

        let tabelaHtml = '';
        for (let i = evos.length - 1; i >= 0; i--) {
            const dataF = (evos[i].data || '').split('-').reverse().join('/');
            tabelaHtml += `<tr><td>${dataF}</td><td><strong>${evos[i].peso || 0} kg</strong></td><td>${evos[i].bf || '--'}%</td></tr>`;
        }

        htmlFinal += `
        ${fotosHtml}
        <div class="card-padrao">
            <div class="card-header" style="background:#fffbeb; color:#d97706; border-color:#fef3c7;"><span><i class="fa-solid fa-star"></i> Medidas Atuais</span></div>
            <div class="evo-grid">
                <div class="evo-box"><span>Peso Atual</span><strong class="text-primary">${p_ultima} kg</strong></div>
                <div class="evo-box"><span>Gordura (BF)</span><strong>${ultima.bf || '--'}%</strong></div>
                <div class="evo-box flex-between" style="grid-column:1/-1; flex-direction:row;"><span>Variação Total</span><strong>${badgeDiff}</strong></div>
            </div>
        </div>
        <div class="card-padrao">
            <div class="card-header"><span><i class="fa-solid fa-weight-scale text-primary" style="margin-right:6px;"></i>Evolução de Peso</span></div>
            <div style="padding:16px;"><canvas id="chartEvo" style="max-height:200px;"></canvas></div>
        </div>
        <div class="card-padrao">
            <div class="card-header"><span><i class="fa-solid fa-clock-rotate-left text-muted" style="margin-right:6px;"></i>Histórico Corporal</span></div>
            <table class="history-table"><thead><tr><th>Data</th><th>Peso</th><th>BF%</th></tr></thead><tbody>${tabelaHtml}</tbody></table>
        </div>`;
    }

    divEvo.innerHTML = htmlFinal;

    setTimeout(() => {
        if (evos.length > 0 && document.getElementById('chartEvo')) {
            new Chart(document.getElementById('chartEvo').getContext('2d'), {
                type: 'line',
                data: { labels: evos.map(e => (e.data || '').split('-').reverse().join('/')), datasets: [{ label: 'Peso (kg)', data: evos.map(e => e.peso || 0), borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.08)', borderWidth: 2.5, fill: true, tension: 0.4, pointBackgroundColor: '#0ea5e9', pointRadius: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
            });
        }
        const treinosForca = historicoTreinos.filter(t => t.volume_total_kg > 0);
        if (treinosForca.length > 1 && document.getElementById('chartVolume')) {
            const dadosGrafico = treinosForca.slice(-10);
            new Chart(document.getElementById('chartVolume').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: dadosGrafico.map(t => t.data ? t.data.substring(5,10).split('-').reverse().join('/') : ''),
                    datasets: [{ label: 'Volume (kg)', data: dadosGrafico.map(t => t.volume_total_kg), backgroundColor: '#10b981', borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
            });
        }
    }, 100);
}

// ==========================================
// HIDRATAÇÃO E DEMAIS FUNÇÕES
// ==========================================
function addWater(amount) {
    const key = new Date().toISOString().split('T')[0];
    let cur = parseInt(localStorage.getItem('pumpo_water_' + key)) || 0;
    cur = Math.max(0, cur + amount);
    localStorage.setItem('pumpo_water_' + key, cur);
    updateWaterUI();
}

function updateWaterUI() {
    const key = new Date().toISOString().split('T')[0];
    const cur = parseInt(localStorage.getItem('pumpo_water_' + key)) || 0;
    const goal = parseInt(document.getElementById('water-goal').innerText) || 2000;
    document.getElementById('water-current').innerText = cur.toLocaleString('pt-BR');
    document.getElementById('water-bar').style.width = Math.min(100, (cur / goal) * 100) + '%';
    const dropsEl = document.getElementById('water-drops');
    if (dropsEl) {
        const filled = Math.min(8, Math.floor(cur / 250));
        dropsEl.innerHTML = Array.from({ length: 8 }, (_, i) => `<span class="water-drop${i < filled ? ' filled' : ''}">💧</span>`).join('');
    }
}

function abrirCheckin() {
    document.getElementById('modal-checkin').style.display = 'flex';
    document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('active'));
    ['checkin-mood','checkin-sono','checkin-peso','checkin-cintura','checkin-feedback'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}
function selectMood(el, moodText) {
    document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('active'));
    el.classList.add('active'); document.getElementById('checkin-mood').value = moodText;
}
async function enviarCheckin() {
    const peso = document.getElementById('checkin-peso').value, cintura = document.getElementById('checkin-cintura').value, feedback = document.getElementById('checkin-feedback').value, mood = document.getElementById('checkin-mood').value, sono = document.getElementById('checkin-sono').value, btn = document.getElementById('btn-enviar-checkin');
    if (!peso && !feedback && !mood && !sono) return showToast("Preencha ao menos um campo.", "error");
    let feedbackFinal = "";
    if (mood) feedbackFinal += `⚡ Humor: ${mood}\n`; if (sono) feedbackFinal += `😴 Sono: ${sono}\n`; if (cintura) feedbackFinal += `📏 Cintura: ${cintura} cm\n`; if (feedbackFinal && feedback) feedbackFinal += `\n📝 Relato:\n`;
    feedbackFinal += feedback;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A enviar...'; btn.disabled = true;
    try {
        const res = await fetch('/api/public/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ALUNO_TOKEN, peso, feedback: feedbackFinal }) });
        if (res.ok) { showToast("Avaliação enviada!", "success"); document.getElementById('modal-checkin').style.display = 'none'; } else { showToast("Erro ao enviar.", "error"); }
    } catch(e) { showToast("Erro de conexão.", "error"); }
    btn.innerHTML = "Enviar Avaliação"; btn.disabled = false;
}

function sugerirSubst(alimentoEscapado, qtdEscapada) {
    document.getElementById('modal-subst').style.display = 'flex'; document.getElementById('subst-content').innerHTML = getSkeletonHTML('geral'); document.getElementById('btn-copiar-subst').classList.add('hidden');
    fetch('/api/public/ia/substituir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alimento: `${qtdEscapada} de ${alimentoEscapado}` }) })
    .then(r => r.json())
    .then(data => {
        if (data.resposta) { document.getElementById('subst-content').innerHTML = data.resposta.replace(/\n/g, '<br>'); document.getElementById('btn-copiar-subst').classList.remove('hidden'); }
        else { document.getElementById('subst-content').innerHTML = `<strong class="text-danger">${data.erro}</strong>`; }
    }).catch(() => { document.getElementById('subst-content').innerHTML = '<span class="text-danger">Sem internet.</span>'; });
}
function copiarSugestao() { navigator.clipboard.writeText(document.getElementById('subst-content').innerText).then(() => showToast('Sugestão copiada!', 'success')); }

function verExecucao(nomeExercicio) {
    document.getElementById('modal-exercicio').style.display = 'flex'; document.getElementById('exec-titulo').innerText = nomeExercicio;
    document.getElementById('exec-content').innerHTML = `<div class="skeleton sk-img" style="width:100%; height:260px; border-radius:12px;"></div>`;
    fetch('/api/public/ia/buscar_gif', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exercicio: nomeExercicio }) })
    .then(r => r.json()).then(data => {
        if (data.gif) document.getElementById('exec-content').innerHTML = `<img src="${data.gif}" style="width:100%; height:260px; object-fit:cover; object-position:center; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); background:#f8fafc;">`;
        else document.getElementById('exec-content').innerHTML = '<p class="text-muted text-center" style="padding:20px;">Nenhum GIF encontrado para este exercício.</p>';
    }).catch(() => document.getElementById('exec-content').innerHTML = '<strong class="text-danger text-center" style="display:block; padding:20px;">Falha na conexão.</strong>');
}

function resetarPrato() {
    ['prato-preview','prato-resultado','btn-analisar-prato','btn-salvar-diario'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('prato-upload-container').style.display = 'block'; document.getElementById('prato-upload-container').innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><p>Tirar foto do prato</p><input type="file" id="prato-foto" accept="image/*" capture="environment">';
    currentImageB64 = ""; document.getElementById('prato-foto').addEventListener('change', handleFotoChange);
}

function handleFotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Esconde o input para o utilizador não clicar 2x, mas NÃO destrói o HTML
    e.target.style.display = 'none';

    const container = document.getElementById('prato-upload-container');
    // Adiciona o ícone a carregar sem apagar o conteúdo anterior (crucial para o iOS)
    container.innerHTML += '<div id="spinner-foto" style="margin-top:10px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:#0ea5e9;"></i><p style="margin-top:6px; font-weight:bold; color:#0ea5e9;">A processar a foto...</p></div>';

    try {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let w = img.width, h = img.height;

                // Redimensionamento inteligente
                if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
                else { if (h > MAX) { w = w * MAX / h; h = MAX; } }

                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);

                // Compressão a 60% (Qualidade perfeita para IA, peso minúsculo)
                currentImageB64 = canvas.toDataURL('image/jpeg', 0.6);

                document.getElementById('prato-preview').src = currentImageB64;
                document.getElementById('prato-preview').classList.remove('hidden');
                container.style.display = 'none';
                document.getElementById('btn-analisar-prato').classList.remove('hidden');

                // Limpa o spinner extra criado
                const spinner = document.getElementById('spinner-foto');
                if(spinner) spinner.remove();
            };
            img.src = ev.target.result;
        };

        reader.onerror = function() {
            showToast("Falha ao ler a foto. Tente novamente.", "error");
            resetarPrato();
        };

        // Lê a imagem
        reader.readAsDataURL(file);

    } catch (err) {
        showToast("Erro de memória. Tire a foto novamente.", "error");
        resetarPrato();
    }
}

function analisarPrato() {
    if (!currentImageB64) return showToast('Tire uma foto primeiro.', 'error');
    const btn = document.getElementById('btn-analisar-prato'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A analisar...'; btn.disabled = true;
    fetch('/api/public/ia/analisar_prato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ALUNO_TOKEN, imagem: currentImageB64 }) })
    .then(r => r.json()).then(data => {
        if (data.resposta) { document.getElementById('prato-resultado').innerHTML = data.resposta.replace(/\n/g, '<br>'); document.getElementById('prato-resultado').classList.remove('hidden'); document.getElementById('btn-salvar-diario').classList.remove('hidden'); btn.classList.add('hidden'); }
        else { showToast(data.erro || 'Erro.', 'error'); btn.innerHTML = '<i class="fa-solid fa-brain"></i> Analisar Macros'; btn.disabled = false; }
    }).catch(() => { showToast('Falha na IA.', 'error'); btn.innerHTML = '<i class="fa-solid fa-brain"></i> Analisar Macros'; btn.disabled = false; });
}
function salvarNoDiario() {
    const analise = document.getElementById('prato-resultado').innerText, btn = document.getElementById('btn-salvar-diario'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A guardar...';
    fetch('/api/public/diario/salvar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ALUNO_TOKEN, descricao: "Refeição (Foto)", analise_ia: analise, foto: currentImageB64 }) })
    .then(r => { if (r.ok) { showToast('Guardado no diário! ✅', 'success'); document.getElementById('modal-prato').style.display = 'none'; resetarPrato(); } }).catch(() => { showToast('Erro.', 'error'); btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Refeição'; });
}

function enviarParaIA() {
    const input = document.getElementById('ai-prompt'), prompt = input.value.trim(), btn = document.getElementById('btn-enviar-ia'), chatArea = document.getElementById('chat-area');
    if (!prompt) return;
    chatArea.innerHTML += `<div class="chat-bubble-user"><div>${prompt}</div></div>`; input.value = ''; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true; chatArea.scrollTop = chatArea.scrollHeight;
    const typingId = 'typing-' + Date.now(); chatArea.innerHTML += `<div class="chat-bubble-ai" id="${typingId}"><div class="chat-ai-avatar"><i class="fa-solid fa-leaf"></i></div><div class="chat-typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`; chatArea.scrollTop = chatArea.scrollHeight;
    fetch('/api/public/ia/consultar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ALUNO_TOKEN, prompt }) })
    .then(r => r.json()).then(data => {
        document.getElementById(typingId)?.remove();
        const resposta = data.erro ? `<strong class="text-danger">${data.erro}</strong>` : data.resposta.replace(/\n/g, '<br>');
        chatArea.innerHTML += `<div class="chat-bubble-ai"><div class="chat-ai-avatar"><i class="fa-solid fa-leaf"></i></div><div>${resposta}</div></div>`;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; btn.disabled = false; chatArea.scrollTop = chatArea.scrollHeight;
    }).catch(() => { document.getElementById(typingId)?.remove(); chatArea.innerHTML += `<div class="text-danger text-center font-0-85 mt-10">Erro na rede.</div>`; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; btn.disabled = false; chatArea.scrollTop = chatArea.scrollHeight; });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('ai-prompt')?.addEventListener('keypress', e => { if (e.key === 'Enter') enviarParaIA(); });
    document.getElementById('prato-foto')?.addEventListener('change', handleFotoChange);
    carregarDados();
});