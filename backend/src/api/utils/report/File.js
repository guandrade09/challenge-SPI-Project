import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportDir = path.resolve(__dirname);


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

export async function GenerateReportPDF(data) {
    let browser;

    try {
        const counts = await OrganizeDataForReport(data);
        const accuracy = await calculateAccuracy(data);
        const prob = await GetPredictionData(data);
        const logoPath = path.resolve(reportDir, "codexis.png");
        const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

        let html = fs.readFileSync(
            path.resolve(reportDir, "RelatorioPdf.html"),
            "utf-8"
        );

        html = html
            .replace("{{total}}", counts.total)
            .replace("{{capacete}}", counts.capacete)
            .replace("{{colete}}", counts.colete)
            .replace("{{mascara}}", counts.mascara)
            .replace("{{oculos}}", counts.oculos)
            .replace("{{logo}}", `data:image/png;base64,${logoBase64}`)
            .replace("{{prob_capacete}}", (prob.probabilities.capacete * 100).toFixed(1)+ "%")
            .replace("{{prob_colete}}", (prob.probabilities.colete * 100).toFixed(1) + "%")
            .replace("{{prob_mascara}}", (prob.probabilities.mascara * 100).toFixed(1) + "%")
            .replace("{{prob_oculos}}", (prob.probabilities.oculos * 100).toFixed(1) + "%")
            .replace("{{prediction}}", (prob.prediction))
            .replace("{{probability}}", (prob.probability * 100).toFixed(1) + "%")
            .replace("{{acertos}}", accuracy.acertos)
            .replace("{{erros}}", accuracy.erros);

        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0"
        });

        await page.addStyleTag({
            path: path.resolve(reportDir, "RelatorioPdf.css")
        });

        await page.addScriptTag({
            url: "https://cdn.jsdelivr.net/npm/chart.js"
        });

        await page.addScriptTag({
            url: "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"
        });

        await page.evaluate((counts, accuracy) => {
            window.countsData = counts;
            window.accuracyData = accuracy;
        }, counts, accuracy);

        await page.evaluate(() => {
            const counts = window.countsData;
            const accuracy = window.accuracyData;

            if (!counts || !accuracy) {
                throw new Error("Dados não carregados");
            }

            const total = counts.total || 1;

            Chart.register(ChartDataLabels);

            new Chart(document.getElementById('chartDistribuicao'), {
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
                        backgroundColor: [
                            '#3498db',
                            '#2ecc71',
                            '#f1c40f',
                            '#9b59b6'
                        ]
                    }]
                },
                options: {
                    animation: false,
                    plugins: {
                        legend: {
                            position: 'left'
                        },
                        datalabels: {
                            color: '#fff',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            formatter: (value) => value.toFixed(1) + '%'
                        }
                    }
                }
            });

            new Chart(document.getElementById('chartAccuracy'), {
                type: 'pie',
                data: {
                    labels: ['Acertos', 'Erros'],
                    datasets: [{
                        data: [((accuracy.acertos / accuracy.total) * 100), (accuracy.erros / accuracy.total) * 100],
                        backgroundColor: [
                            '#2ecc71',
                            '#e74c3c'
                        ]
                    }]
                },
                options: {
                    animation: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        datalabels: {
                            color: '#fff',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            formatter: (value) => value.toFixed(1) + '%'
                        }
                    }
                }
            });
        });

        await page.waitForFunction(() => {
            const c1 = document.getElementById('chartDistribuicao');
            const c2 = document.getElementById('chartAccuracy');

            return (
                c1 && c1.toDataURL().length > 1000 &&
                c2 && c2.toDataURL().length > 1000
            );
        });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true
        });

        await browser.close();

        return pdf;

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);

        if (browser) {
            await browser.close();
        }

        throw error;
    }
}