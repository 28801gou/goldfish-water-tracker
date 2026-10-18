/**
 * Chart.jsを使った水質推移グラフの描画を担当するクラス
 */
export class ChartView {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
  }

  render(logs) {
    if (!this.canvas) {
      console.error("キャンバス要素が見つかりません:", this.canvas);
      return;
    }

    const ctx = this.canvas.getContext("2d");

    // データが0件の水槽に切り替えた場合は、グラフを消して終了
    if (!logs || logs.length === 0) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    // 時系列順（古い順）にソート
    const sortedLogs = logs.slice().sort((a, b) => {
      return (a.recordedAt || "").localeCompare(b.recordedAt || "");
    });

    // ラベル（月/日 時:分）と各データ系列
    const labels = sortedLogs.map((log) => {
      if (!log.recordedAt) return "";
      return log.recordedAt.length >= 16
        ? log.recordedAt.substring(5, 16)
        : log.recordedAt;
    });

    const tempData = sortedLogs.map((log) => log.temp);
    const phData = sortedLogs.map((log) => log.ph);

    // 既にグラフが存在する場合はインスタンスを再生成せず、データを差し替えて更新（描画チラつき防止）
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = tempData;
      this.chart.data.datasets[1].data = phData;
      this.chart.update(); // アニメーションを伴ってグラフを更新
      return;
    }

    // 初回描画時の新規作成
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "水温 (℃)",
            data: tempData,
            borderColor: "#e53e3e",
            backgroundColor: "rgba(229, 62, 62, 0.1)",
            yAxisID: "yTemp",
            tension: 0.3,
            pointRadius: 4,
            fill: false,
          },
          {
            label: "pH",
            data: phData,
            borderColor: "#3182ce",
            backgroundColor: "rgba(49, 130, 206, 0.1)",
            yAxisID: "yPh",
            tension: 0.3,
            pointRadius: 4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yTemp: {
            type: "linear",
            position: "left",
            title: { display: true, text: "水温 (℃)" },
            min: 10,
            max: 32,
          },
          yPh: {
            type: "linear",
            position: "right",
            title: { display: true, text: "pH" },
            min: 5.0,
            max: 9.0,
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }
}
