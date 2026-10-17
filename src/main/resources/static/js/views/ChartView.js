/**
 * Chart.jsを使った水質推移グラフの描画を担当するクラス
 */
export class ChartView {
  constructor(canvasId) {
    this.ctx = document.getElementById(canvasId).getContext("2d");
    this.chart = null; // Chartインスタンス保持用
  }

  render(logs) {
    if (!logs || logs.length === 0) {
      return;
    }

    // 時系列順（古い順）に並べ替えてグラフのX軸にする
    const sortedLogs = logs
      .slice()
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

    // グラフ用データの抽出
    const labels = sortedLogs.map((log) => log.recordedAt.substring(5, 16)); // "MM/dd HH:mm"
    const tempData = sortedLogs.map((log) => log.temp);
    const phData = sortedLogs.map((log) => log.ph);

    // すでにグラフが描画されている場合は一度破棄して再生成（二重描画防止）
    if (this.chart) {
      this.chart.destroy();
    }

    // Chart.js の初期化
    this.chart = new Chart(this.ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "水温 (℃)",
            data: tempData,
            borderColor: "#e53e3e", // 赤系（水温）
            backgroundColor: "rgba(229, 62, 62, 0.1)",
            yAxisID: "yTemp",
            tension: 0.2, // 線の丸み
            fill: false,
          },
          {
            label: "pH",
            data: phData,
            borderColor: "#3182ce", // 青系（pH）
            backgroundColor: "rgba(49, 130, 206, 0.1)",
            yAxisID: "yPh",
            tension: 0.2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          // 左側のY軸（水温用）
          yTemp: {
            type: "linear",
            position: "left",
            title: { display: true, text: "水温 (℃)" },
            min: 10,
            max: 32,
          },
          // 右側のY軸（pH用）
          yPh: {
            type: "linear",
            position: "right",
            title: { display: true, text: "pH" },
            min: 5.0,
            max: 9.0,
            grid: { drawOnChartArea: false }, // 目盛り線が重複するのを防ぐ
          },
        },
      },
    });
  }
}
