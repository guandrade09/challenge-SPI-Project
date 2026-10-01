import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { isDetectionConfirmed } from "./detectionRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportDir = path.resolve(__dirname);
const require = createRequire(import.meta.url);

// Bibliotecas dos gráficos servidas localmente (em vez de baixadas de um CDN a
// cada PDF gerado). Isso tira da geração do relatório qualquer dependência de
// rede, que era o maior responsável pela demora.
// Resolvidos a partir do ponto de entrada do pacote (e não de "package.json")
// porque o "exports" do chart.js bloqueia o acesso direto a subcaminhos.
const CHART_JS_PATH = path.join(path.dirname(require.resolve("chart.js")), "chart.umd.min.js");
const CHART_DATALABELS_PATH = path.join(
    path.dirname(require.resolve("chartjs-plugin-datalabels")),
    "chartjs-plugin-datalabels.min.js"
);

// Reaproveita uma única instância do navegador entre gerações de PDF: abrir o
// Chromium do zero a cada relatório é o segundo maior custo de tempo. Só a
// aba (page) é criada/fechada a cada requisição.
let browserPromise = null;

async function getBrowser() {
    if (browserPromise) {
        const existing = await browserPromise;
        if (existing.isConnected()) return existing;
        browserPromise = null;
    }

    browserPromise = puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    return browserPromise;
}

async function closeBrowser() {
    if (!browserPromise) return;
    try {
        const browser = await browserPromise;
        await browser.close();
    } catch {
        // navegador já pode ter sido encerrado
    }
    browserPromise = null;
}

process.on("SIGINT", async () => {
    await closeBrowser();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await closeBrowser();
    process.exit(0);
});

const LABEL_DISPLAY_NAMES = {
    capacete: "Capacete",
    colete: "Colete",
    mascara: "Máscara",
    oculos: "Óculos",
};

const CRITICIDADE_ORDER = ["alta", "media", "média", "baixa"];
const CRITICIDADE_COLORS = {
    alta: "#e74c3c",
    media: "#f39c12",
    média: "#f39c12",
    baixa: "#2ecc71",
};

// Catálogo oficial de seções que podem compor o relatório em PDF. A ordem aqui
// é a ordem em que elas aparecem no documento, independentemente da ordem em
// que forem solicitadas. Reutilizado pelo chat (report-tools.js) para expor
// as mesmas opções ao usuário.
export const REPORT_SECTIONS = [
    { id: "resumo", label: "Resumo Executivo" },
    { id: "conformidade", label: "Conformidade Geral (uso confirmado x confiança do modelo)" },
    { id: "equipamentos", label: "Distribuição por Equipamento" },
    { id: "setores", label: "Análise por Setor" },
    { id: "criticidade", label: "Análise por Criticidade" },
    { id: "tendencia", label: "Tendência Temporal de Detecções" },
    { id: "cameras", label: "Desempenho por Câmera" },
    { id: "probabilidade", label: "Projeção Estatística de Ocorrência" },
    { id: "recentes", label: "Registros Recentes (Amostra)" },
];

const DEFAULT_SECTION_IDS = REPORT_SECTIONS.map((section) => section.id);

export function resolveReportSections(sections) {
    if (!Array.isArray(sections) || sections.length === 0) return DEFAULT_SECTION_IDS;

    const valid = sections
        .map((section) => String(section).trim().toLowerCase())
        .filter((section) => DEFAULT_SECTION_IDS.includes(section));

    return valid.length > 0 ? Array.from(new Set(valid)) : DEFAULT_SECTION_IDS;
}

function displayLabel(label) {
    if (!label) return "Não identificado";
    const key = String(label).trim().toLowerCase();
    return LABEL_DISPLAY_NAMES[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}

function displaySetor(setor) {
    return setor && String(setor).trim() ? String(setor).trim() : "Não informado";
}

function displayCamera(cameraId) {
    return cameraId !== null && cameraId !== undefined && cameraId !== ""
        ? `Câmera ${cameraId}`
        : "Não informada";
}

function displayCriticidade(criticidade) {
    return criticidade && String(criticidade).trim() ? String(criticidade).trim() : "Não classificada";
}

function formatPercent(value, total) {
    if (!total) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
}

function formatDateTimeBR(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export async function OrganizeDataForReport(data) {
    const counts = {
        capacete: 0,
        colete: 0,
        mascara: 0,
        oculos: 0,
        total: 0
    };

    data.forEach(element => {
        if (counts[element.label] !== undefined) {
            counts[element.label]++;
            counts.total++;
        }
    });

    return counts;
}

export async function GetPredictionData(data) {
    const counts = await OrganizeDataForReport(data);
    const total = counts.total || 0;

    const probabilities = {
        capacete: total ? counts.capacete / total : 0,
        colete: total ? counts.colete / total : 0,
        mascara: total ? counts.mascara / total : 0,
        oculos: total ? counts.oculos / total : 0
    };

    const prediction = Object.entries(probabilities).reduce(
        (best, [label, value]) => {
            if (value > best.value) {
                return { label, value };
            }
            return best;
        },
        { label: null, value: -1 }
    );

    return {
        probabilities,
        prediction: prediction.label,
        probability: prediction.value
    };
}

export async function calculateAccuracy(data) {
    let acertos = 0;
    let erros = 0;
    let total = 0;

    data.forEach(item => {
        if (item.confidence >= 0.8) {
            acertos++;
        } else {
            erros++;
        }
        total++;
    });

    return { acertos, erros, total };
}

// Conformidade real de uso do EPI (equipamento presente + confiança suficiente),
// diferente de calculateAccuracy() que mede apenas a certeza do modelo de IA.
function buildComplianceSummary(data) {
    let confirmadas = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    data.forEach((item) => {
        if (isDetectionConfirmed(item)) confirmadas++;
        const confidence = parseFloat(item.confidence);
        if (!isNaN(confidence)) {
            confidenceSum += confidence;
            confidenceCount++;
        }
    });

    const total = data.length;
    return {
        total,
        confirmadas,
        naoConfirmadas: total - confirmadas,
        taxaConformidade: total ? Number(((confirmadas / total) * 100).toFixed(1)) : 0,
        confiancaMedia: confidenceCount ? Number(((confidenceSum / confidenceCount) * 100).toFixed(1)) : 0,
    };
}

function groupBy(data, keyFn, displayFn) {
    const grouped = new Map();

    data.forEach((item) => {
        const rawKey = keyFn(item);
        if (!grouped.has(rawKey)) {
            grouped.set(rawKey, { key: rawKey, label: displayFn(rawKey), total: 0, confirmadas: 0 });
        }
        const bucket = grouped.get(rawKey);
        bucket.total++;
        if (isDetectionConfirmed(item)) bucket.confirmadas++;
    });

    return Array.from(grouped.values())
        .map((bucket) => ({
            ...bucket,
            naoConfirmadas: bucket.total - bucket.confirmadas,
            taxaConformidade: bucket.total ? Number(((bucket.confirmadas / bucket.total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.total - a.total);
}

function buildDailyTrend(data) {
    const grouped = new Map();

    data.forEach((item) => {
        const day = item.timestamp ? String(item.timestamp).slice(0, 10) : "Sem data";
        if (!grouped.has(day)) grouped.set(day, { day, total: 0, confirmadas: 0 });
        const bucket = grouped.get(day);
        bucket.total++;
        if (isDetectionConfirmed(item)) bucket.confirmadas++;
    });

    return Array.from(grouped.values()).sort((a, b) => a.day.localeCompare(b.day));
}

function buildRecentRecords(data, limit = 12) {
    return [...data]
        .filter((item) => item.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        .map((item) => ({
            timestamp: formatDateTimeBR(item.timestamp),
            label: displayLabel(item.label),
            setor: displaySetor(item.setor),
            camera: displayCamera(item.camera_id),
            confidence: item.confidence != null && !isNaN(parseFloat(item.confidence))
                ? `${(parseFloat(item.confidence) * 100).toFixed(0)}%`
                : "—",
            confirmed: isDetectionConfirmed(item),
            criticidade: displayCriticidade(item.criticidade),
        }));
}

function sortCriticidade(list) {
    return [...list].sort((a, b) => {
        const ia = CRITICIDADE_ORDER.indexOf(a.key?.toLowerCase?.());
        const ib = CRITICIDADE_ORDER.indexOf(b.key?.toLowerCase?.());
        if (ia === -1 && ib === -1) return b.total - a.total;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });
}

function criticidadeColor(key) {
    const normalized = String(key || "").toLowerCase();
    return CRITICIDADE_COLORS[normalized] || "#95a5a6";
}

function buildPeriodoLabel(timestamp_start, timestamp_end) {
    if (timestamp_start && timestamp_end) {
        return `${formatDateTimeBR(timestamp_start)} até ${formatDateTimeBR(timestamp_end)}`;
    }
    return "Histórico completo do sistema";
}

function renderStatCard(title, value, subtitle = "") {
    return `
      <div class="stat-card">
        <div class="stat-title">${escapeHtml(title)}</div>
        <div class="stat-value">${escapeHtml(value)}</div>
        ${subtitle ? `<div class="stat-subtitle">${escapeHtml(subtitle)}</div>` : ""}
      </div>
    `;
}

function renderBreakdownRows(items) {
    if (items.length === 0) {
        return `<tr><td colspan="5" class="empty-row">Nenhum dado disponível para este período</td></tr>`;
    }

    return items.map((item) => `
      <tr>
        <td>${escapeHtml(item.label)}</td>
        <td>${item.total}</td>
        <td>${item.confirmadas}</td>
        <td>${item.naoConfirmadas}</td>
        <td><span class="badge ${item.taxaConformidade >= 70 ? "badge-good" : item.taxaConformidade >= 40 ? "badge-warn" : "badge-bad"}">${item.taxaConformidade}%</span></td>
      </tr>
    `).join("");
}

function renderRecentRows(records) {
    if (records.length === 0) {
        return `<tr><td colspan="6" class="empty-row">Nenhum registro recente disponível</td></tr>`;
    }

    return records.map((record) => `
      <tr>
        <td>${escapeHtml(record.timestamp)}</td>
        <td>${escapeHtml(record.label)}</td>
        <td>${escapeHtml(record.setor)}</td>
        <td>${escapeHtml(record.camera)}</td>
        <td>${escapeHtml(record.confidence)}</td>
        <td><span class="badge ${record.confirmed ? "badge-good" : "badge-bad"}">${record.confirmed ? "Confirmado" : "Não confirmado"}</span></td>
      </tr>
    `).join("");
}

function renderCriticidadeCards(items, total) {
    if (items.length === 0) {
        return `<div class="empty-row">Nenhum dado de criticidade disponível</div>`;
    }

    return items.map((item) => `
      <div class="crit-card" style="border-left-color:${criticidadeColor(item.key)}">
        <div class="crit-name">${escapeHtml(item.label)}</div>
        <div class="crit-value">${item.total}</div>
        <div class="crit-subtitle">${formatPercent(item.total, total)} das ocorrências</div>
      </div>
    `).join("");
}

// Cada seção do relatório sabe montar o próprio bloco de HTML a partir do
// contexto já calculado. GenerateReportPDF decide quais entram no documento
// final de acordo com os `sections` pedidos (ou todas, no relatório completo).
const SECTION_RENDERERS = {
    resumo: (ctx) => `
      <div class="section">
        <div class="section-title">Resumo Executivo</div>
        <div class="grid stat-grid">
          ${renderStatCard("Total de Detecções", ctx.counts.total)}
          ${renderStatCard("Taxa de Conformidade", `${ctx.compliance.taxaConformidade}%`, `${ctx.compliance.confirmadas} confirmadas / ${ctx.compliance.naoConfirmadas} não confirmadas`)}
          ${renderStatCard("Confiança Média do Modelo", `${ctx.compliance.confiancaMedia}%`)}
          ${renderStatCard("Alertas de Alta Criticidade", ctx.alertasAltaCriticidade)}
          ${renderStatCard("Setores Monitorados", ctx.setoresMonitorados)}
          ${renderStatCard("Câmeras Ativas", ctx.camerasAtivas)}
        </div>
      </div>
    `,

    conformidade: () => `
      <div class="section">
        <div class="section-title">Conformidade Geral</div>
        <div class="grid">
          <div class="card">
            <div class="chart-subtitle">Uso confirmado do EPI</div>
            <div class="chart-wrapper"><canvas id="chartConformidade"></canvas></div>
          </div>
          <div class="card">
            <div class="chart-subtitle">Confiança do modelo de IA</div>
            <div class="chart-wrapper"><canvas id="chartAccuracy"></canvas></div>
          </div>
        </div>
      </div>
    `,

    equipamentos: (ctx) => `
      <div class="section">
        <div class="section-title">Distribuição por Equipamento</div>
        <div class="grid">
          <div class="card card-chart">
            <div class="chart-wrapper"><canvas id="chartDistribuicao"></canvas></div>
          </div>
          <div class="card card-table">
            <table class="data-table">
              <thead>
                <tr><th>Equipamento</th><th>Total</th><th>Confirmadas</th><th>Não conf.</th><th>Conformidade</th></tr>
              </thead>
              <tbody>${renderBreakdownRows(ctx.labelBreakdown)}</tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    setores: (ctx) => {
        const chart = ctx.setorBreakdown.length > 0
            ? `<canvas id="chartSetor"></canvas>`
            : `<div class="empty-row">Sem dados de setor disponíveis.</div>`;

        return `
          <div class="section page-break">
            <div class="section-title">Análise por Setor</div>
            <div class="grid">
              <div class="card card-chart">
                <div class="chart-wrapper">${chart}</div>
              </div>
              <div class="card card-table">
                <table class="data-table">
                  <thead>
                    <tr><th>Setor</th><th>Total</th><th>Confirmadas</th><th>Não conf.</th><th>Conformidade</th></tr>
                  </thead>
                  <tbody>${renderBreakdownRows(ctx.setorBreakdown)}</tbody>
                </table>
              </div>
            </div>
          </div>
        `;
    },

    criticidade: (ctx) => {
        const chart = ctx.criticidadeBreakdown.length > 0
            ? `<canvas id="chartCriticidade"></canvas>`
            : `<div class="empty-row">Sem dados de criticidade disponíveis.</div>`;

        return `
          <div class="section">
            <div class="section-title">Análise por Criticidade</div>
            <div class="grid">
              <div class="card card-chart">
                <div class="chart-wrapper chart-wrapper-sm">${chart}</div>
              </div>
              <div class="card card-crit">
                <div class="crit-cards">${renderCriticidadeCards(ctx.criticidadeBreakdown, ctx.totalDetections)}</div>
              </div>
            </div>
          </div>
        `;
    },

    tendencia: (ctx) => {
        const section = ctx.dailyTrend.length > 1
            ? `<div class="chart-wrapper"><canvas id="chartTendencia"></canvas></div>`
            : `<div class="empty-row">Tendência diária disponível a partir de 2 dias distintos de dados.</div>`;

        return `
          <div class="section">
            <div class="section-title">Tendência Temporal de Detecções</div>
            <div class="grid"><div class="card">${section}</div></div>
          </div>
        `;
    },

    cameras: (ctx) => `
      <div class="section page-break">
        <div class="section-title">Desempenho por Câmera</div>
        <div class="grid">
          <div class="card card-table-full">
            <table class="data-table">
              <thead>
                <tr><th>Câmera</th><th>Total</th><th>Confirmadas</th><th>Não conf.</th><th>Conformidade</th></tr>
              </thead>
              <tbody>${renderBreakdownRows(ctx.cameraBreakdown)}</tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    probabilidade: (ctx) => `
      <div class="section">
        <div class="section-title">Projeção Estatística de Ocorrência</div>
        <div class="grid">
          <div class="card">Capacete: ${(ctx.prob.probabilities.capacete * 100).toFixed(1)}%</div>
          <div class="card">Colete: ${(ctx.prob.probabilities.colete * 100).toFixed(1)}%</div>
          <div class="card">Máscara: ${(ctx.prob.probabilities.mascara * 100).toFixed(1)}%</div>
          <div class="card">Óculos: ${(ctx.prob.probabilities.oculos * 100).toFixed(1)}%</div>
        </div>
        <div class="grid">
          <div class="card">Equipamento com maior probabilidade de ocorrência: <strong>${escapeHtml(displayLabel(ctx.prob.prediction))}</strong></div>
          <div class="card">Probabilidade estimada: <strong>${(ctx.prob.probability * 100).toFixed(1)}%</strong></div>
        </div>
      </div>
    `,

    recentes: (ctx) => `
      <div class="section">
        <div class="section-title">Registros Recentes (Amostra)</div>
        <div class="grid">
          <div class="card card-table-full">
            <table class="data-table">
              <thead>
                <tr><th>Data/Hora</th><th>Equipamento</th><th>Setor</th><th>Câmera</th><th>Confiança</th><th>Status</th></tr>
              </thead>
              <tbody>${renderRecentRows(ctx.recentRecords)}</tbody>
            </table>
          </div>
        </div>
      </div>
    `,
};

export async function GenerateReportPDF(data, meta = {}) {
    let page;

    try {
        const { label = null, timestamp_start = null, timestamp_end = null, sections = null } = meta;
        const includeSections = resolveReportSections(sections);

        const counts = await OrganizeDataForReport(data);
        const accuracy = await calculateAccuracy(data);
        const prob = await GetPredictionData(data);
        const compliance = buildComplianceSummary(data);

        const labelBreakdown = groupBy(data, (item) => (item.label || "outro"), displayLabel);
        const setorBreakdown = groupBy(data, (item) => displaySetor(item.setor), (key) => key);
        const cameraBreakdown = groupBy(data, (item) => displayCamera(item.camera_id), (key) => key);
        const criticidadeBreakdown = sortCriticidade(
            groupBy(data, (item) => displayCriticidade(item.criticidade), (key) => key)
        );
        const dailyTrend = buildDailyTrend(data);
        const recentRecords = buildRecentRecords(data, 12);

        const setoresMonitorados = new Set(data.map((item) => displaySetor(item.setor))).size;
        const camerasAtivas = new Set(
            data.filter((item) => item.camera_id !== null && item.camera_id !== undefined).map((item) => item.camera_id)
        ).size;
        const alertasAltaCriticidade = data.filter((item) =>
            String(item.criticidade || "").toLowerCase().startsWith("alta")
        ).length;

        const ctx = {
            counts, accuracy, prob, compliance,
            labelBreakdown, setorBreakdown, cameraBreakdown, criticidadeBreakdown,
            dailyTrend, recentRecords,
            setoresMonitorados, camerasAtivas, alertasAltaCriticidade,
            totalDetections: counts.total || data.length,
        };

        const contentHtml = DEFAULT_SECTION_IDS
            .filter((id) => includeSections.includes(id))
            .map((id) => SECTION_RENDERERS[id](ctx))
            .join("\n");

        const semDadosBanner = data.length === 0
            ? `<div class="warning-banner">Nenhuma detecção foi registrada para o período e/ou filtro selecionado. Os indicadores abaixo refletem uma base vazia.</div>`
            : "";

        const logoPath = path.resolve(reportDir, "codexis.png");
        const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

        let html = fs.readFileSync(
            path.resolve(reportDir, "RelatorioPdf.html"),
            "utf-8"
        );

        const filtroLabel = label ? displayLabel(label) : "Todos os equipamentos";

        html = html
            .replace(/{{logo}}/g, `data:image/png;base64,${logoBase64}`)
            .replace(/{{gerado_em}}/g, formatDateTimeBR(new Date()))
            .replace(/{{periodo}}/g, buildPeriodoLabel(timestamp_start, timestamp_end))
            .replace(/{{filtro}}/g, filtroLabel)
            .replace(/{{banner_sem_dados}}/g, semDadosBanner)
            .replace(/{{content}}/g, contentHtml);

        const browser = await getBrowser();
        page = await browser.newPage();

        // O HTML não tem mais recursos externos (logo é base64, CSS é injetado à
        // parte), então basta esperar o DOM ficar pronto em vez de "networkidle0"
        // (que sempre embute uma espera fixa de 500ms sem tráfego de rede).
        await page.setContent(html, {
            waitUntil: "domcontentloaded"
        });

        await page.addStyleTag({
            path: path.resolve(reportDir, "RelatorioPdf.css")
        });

        await page.addScriptTag({
            path: CHART_JS_PATH
        });

        await page.addScriptTag({
            path: CHART_DATALABELS_PATH
        });

        await page.evaluate((chartData) => {
            window.reportChartData = chartData;
        }, { counts, accuracy, compliance, labelBreakdown, setorBreakdown, criticidadeBreakdown, dailyTrend, includeSections });

        await page.evaluate(() => {
            const {
                counts, accuracy, compliance, labelBreakdown, setorBreakdown, criticidadeBreakdown, dailyTrend, includeSections
            } = window.reportChartData || {};

            if (!counts || !accuracy || !compliance) {
                throw new Error("Dados não carregados");
            }

            Chart.register(ChartDataLabels);
            Chart.defaults.font.family = "Arial, sans-serif";

            const total = counts.total || 1;
            const criticidadeColors = { alta: "#e74c3c", media: "#f39c12", "média": "#f39c12", baixa: "#2ecc71" };
            const pctLabels = {
                color: "#fff",
                font: { weight: "bold", size: 13 },
                formatter: (value) => (Math.abs(value) < 0.05 ? "" : value.toFixed(1) + "%"),
            };

            // Só cria o gráfico se a seção correspondente estiver incluída no PDF
            // (ou seja, se o canvas realmente existir no documento).
            window.__chartIds = [];
            function tryCreateChart(id, config) {
                const el = document.getElementById(id);
                if (!el) return;
                new Chart(el, config);
                window.__chartIds.push(id);
            }

            if (includeSections.includes('equipamentos')) {
                tryCreateChart('chartDistribuicao', {
                    type: 'pie',
                    data: {
                        labels: ['Capacete', 'Colete', 'Máscara', 'Óculos'],
                        datasets: [{
                            data: [
                                (counts.capacete / total) * 100,
                                (counts.colete / total) * 100,
                                (counts.mascara / total) * 100,
                                (counts.oculos / total) * 100
                            ],
                            backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#9b59b6']
                        }]
                    },
                    options: {
                        animation: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            datalabels: pctLabels
                        }
                    }
                });
            }

            if (includeSections.includes('conformidade')) {
                tryCreateChart('chartAccuracy', {
                    type: 'pie',
                    data: {
                        labels: ['Confiança ≥ 80%', 'Confiança < 80%'],
                        datasets: [{
                            data: [
                                (accuracy.acertos / (accuracy.total || 1)) * 100,
                                (accuracy.erros / (accuracy.total || 1)) * 100
                            ],
                            backgroundColor: ['#2ecc71', '#e74c3c']
                        }]
                    },
                    options: {
                        animation: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            datalabels: pctLabels
                        }
                    }
                });

                tryCreateChart('chartConformidade', {
                    type: 'doughnut',
                    data: {
                        labels: ['Uso confirmado', 'Não confirmado'],
                        datasets: [{
                            data: [
                                (compliance.confirmadas / (compliance.total || 1)) * 100,
                                (compliance.naoConfirmadas / (compliance.total || 1)) * 100
                            ],
                            backgroundColor: ['#27ae60', '#c0392b']
                        }]
                    },
                    options: {
                        animation: false,
                        cutout: '55%',
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            datalabels: pctLabels
                        }
                    }
                });
            }

            if (includeSections.includes('setores') && setorBreakdown && setorBreakdown.length > 0) {
                tryCreateChart('chartSetor', {
                    type: 'bar',
                    data: {
                        labels: setorBreakdown.map((item) => item.label),
                        datasets: [
                            { label: 'Confirmadas', data: setorBreakdown.map((item) => item.confirmadas), backgroundColor: '#27ae60' },
                            { label: 'Não confirmadas', data: setorBreakdown.map((item) => item.naoConfirmadas), backgroundColor: '#c0392b' }
                        ]
                    },
                    options: {
                        indexAxis: 'y',
                        animation: false,
                        scales: { x: { stacked: true }, y: { stacked: true } },
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            datalabels: { display: false }
                        }
                    }
                });
            }

            if (includeSections.includes('criticidade') && criticidadeBreakdown && criticidadeBreakdown.length > 0) {
                tryCreateChart('chartCriticidade', {
                    type: 'doughnut',
                    data: {
                        labels: criticidadeBreakdown.map((item) => item.label),
                        datasets: [{
                            data: criticidadeBreakdown.map((item) => item.total),
                            backgroundColor: criticidadeBreakdown.map((item) => criticidadeColors[String(item.key).toLowerCase()] || '#95a5a6')
                        }]
                    },
                    options: {
                        animation: false,
                        cutout: '50%',
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            datalabels: {
                                color: '#fff',
                                font: { weight: 'bold', size: 12 },
                                formatter: (value) => value
                            }
                        }
                    }
                });
            }

            if (includeSections.includes('tendencia') && dailyTrend && dailyTrend.length > 1) {
                tryCreateChart('chartTendencia', {
                    type: 'line',
                    data: {
                        labels: dailyTrend.map((item) => item.day.split('-').reverse().join('/')),
                        datasets: [
                            { label: 'Total de detecções', data: dailyTrend.map((item) => item.total), borderColor: '#3c6382', backgroundColor: 'rgba(60,99,130,0.15)', tension: 0.3, fill: true },
                            { label: 'Uso confirmado', data: dailyTrend.map((item) => item.confirmadas), borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.1)', tension: 0.3, fill: true }
                        ]
                    },
                    options: {
                        animation: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            datalabels: { display: false }
                        },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        });

        await page.waitForFunction(() => {
            const ids = window.__chartIds || [];
            return ids.every((id) => {
                const el = document.getElementById(id);
                return el && el.toDataURL().length > 1000;
            });
        });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20px", bottom: "50px", left: "0px", right: "0px" },
            displayHeaderFooter: true,
            headerTemplate: "<div></div>",
            footerTemplate: `
              <div style="width:100%; font-size:8.5px; color:#7f8c8d; padding:0 28px; display:flex; justify-content:space-between; font-family:Arial, sans-serif;">
                <span>Relatório gerado automaticamente pelo Sistema Sentinel SPI &middot; Confidencial</span>
                <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
              </div>
            `,
        });

        await page.close();

        return pdf;

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);

        if (page) {
            await page.close().catch(() => {});
        }

        throw error;
    }
}
