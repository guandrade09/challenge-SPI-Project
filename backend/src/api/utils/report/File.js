import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

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

export async function calculateAccuracy(data) {
    let acertos = 0;
    let erros = 0;

    data.forEach(item => {
        if (item.confidence >= 0.8) {
            acertos++;
        } else {
            erros++;
        }
    });

    return { acertos, erros };
}

export async function GenerateReportPDF(data) {
    let browser;

    try {
        const counts = await OrganizeDataForReport(data);
        const accuracy = await calculateAccuracy(data);

        const logoPath = path.resolve("backend/src/api/utils/report/codexis.png");
        const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

        let html = fs.readFileSync(
            path.resolve("backend/src/api/utils/report/RelatorioPdf.html"),
            "utf-8"
        );

        html = html
            .replace("{{total}}", counts.total)
            .replace("{{capacete}}", counts.capacete)
            .replace("{{colete}}", counts.colete)
            .replace("{{mascara}}", counts.mascara)
            .replace("{{oculos}}", counts.oculos)
            .replace("{{logo}}", `data:image/png;base64,${logoBase64}`);

        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0"
        });

        await page.addStyleTag({
            path: path.resolve("backend/src/api/utils/report/RelatorioPdf.css")
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
                        data: [accuracy.acertos, accuracy.erros],
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
                            formatter: (value) => value
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