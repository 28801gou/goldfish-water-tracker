import { ApiService } from "./services/ApiService.js";
import { TableView } from "./views/TableView.js";
import { ChartView } from "./views/ChartView.js";

const tableView = new TableView("logTableBody");
const chartView = new ChartView("waterChart");

// 画面読み込み完了時の初期化
document.addEventListener("DOMContentLoaded", async () => {
  const tankSelect = document.getElementById("tankSelect");
  const form = document.getElementById("waterForm");

  // ① グラフ開閉（トグル）イベントの初期化
  initChartToggle();

  // ② 水槽プルダウンを生成
  await initTankSelect(tankSelect);

  // ③ 初期表示（選択中水槽のサマリー・ログ・グラフを描画）
  await reloadDashboard();

  // ④ プルダウン切り替え時にダッシュボードを即時再描画
  if (tankSelect) {
    tankSelect.addEventListener("change", async () => {
      console.log("水槽切り替え検知 -> tankId:", tankSelect.value);
      await reloadDashboard();
    });
  }

  // ⑤ フォーム送信時のイベント
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
});

// 水槽一覧をプルダウンに流し込む
async function initTankSelect(selectElement) {
  if (!selectElement) return;
  try {
    const tanks = await ApiService.getTanks();
    selectElement.innerHTML = "";
    tanks.forEach((tank) => {
      const option = document.createElement("option");
      option.value = tank.id;
      option.textContent = `${tank.name}（${tank.location}）`;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("水槽一覧の取得に失敗しました:", error);
  }
}

// 選択中の水槽ログを取得してダッシュボード（サマリーカード、表、グラフ）を更新
async function reloadDashboard() {
  const tankSelect = document.getElementById("tankSelect");
  const selectedTankId = tankSelect ? tankSelect.value : null;

  try {
    const logs = await ApiService.getLogs(selectedTankId);

    // ★ 1. 最上部の「現在の値」サマリーカードを更新
    updateCurrentStatus(logs);
    // 2. 表とグラフを最新ログで再描画
    tableView.render(logs);
    chartView.render(logs);
  } catch (error) {
    console.error("ダッシュボード更新に失敗しました:", error);
  }
}

// ★ 最上部の「現在の水質状況」カードを更新する処理
function updateCurrentStatus(logs) {
  const currentTempEl = document.getElementById("currentTemp");
  const currentPhEl = document.getElementById("currentPh");
  const badgeTempEl = document.getElementById("badgeTemp");
  const badgePhEl = document.getElementById("badgePh");
  const lastUpdatedTextEl = document.getElementById("lastUpdatedText");

  if (!logs || logs.length === 0) {
    if (currentTempEl) currentTempEl.textContent = "--.-";
    if (currentPhEl) currentPhEl.textContent = "-.--";
    if (badgeTempEl) {
      badgeTempEl.textContent = "データなし";
      badgeTempEl.className = "status-badge";
    }
    if (badgePhEl) {
      badgePhEl.textContent = "データなし";
      badgePhEl.className = "status-badge";
    }
    if (lastUpdatedTextEl)
      lastUpdatedTextEl.textContent = "測定データがありません";
    return;
  }

  // 最新の1件（先頭の要素）
  const latest = logs[logs.length - 1];
  // Java側のフィールド名 (temp, ph, recordedAt) に対応
  const temp = Number(latest.temp);
  const ph = Number(latest.ph);
  const recordedAt = latest.recordedAt || "記録なし";
  if (currentTempEl) currentTempEl.textContent = temp.toFixed(1);
  if (currentPhEl) currentPhEl.textContent = ph.toFixed(2);
  // 2. 最終測定日時の表示 (recordedAt を使用)
  if (lastUpdatedTextEl) {
    lastUpdatedTextEl.textContent = `最終測定: ${recordedAt}`;
  }
  // 水温バッジの判定
  if (badgeTempEl) {
    if (temp >= 18.0 && temp <= 26.0) {
      badgeTempEl.textContent = "適正";
      badgeTempEl.className = "status-badge badge-safe";
    } else if ((temp >= 15.0 && temp < 18.0) || (temp > 26.0 && temp <= 28.0)) {
      badgeTempEl.textContent = "要注意";
      badgeTempEl.className = "status-badge badge-warn";
    } else {
      badgeTempEl.textContent = "危険";
      badgeTempEl.className = "status-badge badge-danger";
    }
  }

  // pHバッジの判定
  if (badgePhEl) {
    if (ph >= 6.8 && ph <= 7.8) {
      badgePhEl.textContent = "良好";
      badgePhEl.className = "status-badge badge-safe";
    } else if ((ph >= 6.0 && ph < 6.8) || (ph > 7.8 && ph <= 8.5)) {
      badgePhEl.textContent = "要注意";
      badgePhEl.className = "status-badge badge-warn";
    } else {
      badgePhEl.textContent = "危険";
      badgePhEl.className = "status-badge badge-danger";
    }
  }
}

// ★ グラフ折りたたみ（トグル）制御の初期化
function initChartToggle() {
  const toggleBtn = document.getElementById("toggleChartBtn");
  const chartSection = document.getElementById("chartSection");

  if (!toggleBtn || !chartSection) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = chartSection.classList.toggle("is-hidden");

    if (isHidden) {
      toggleBtn.textContent = "📈 過去の推移グラフを表示する";
    } else {
      toggleBtn.textContent = "📉 グラフを閉じる";
      // 非表示から表示へ切り替わった際にChart.jsが崩れないようサイズを再計算
      if (chartView && chartView.chart) {
        chartView.chart.resize();
      }
    }
  });
}

// 診断＆記録ボタンが押されたときの処理
async function handleSubmit(event) {
  event.preventDefault();

  const tankSelect = document.getElementById("tankSelect");
  const tempInput = document.getElementById("tempInput");
  const phInput = document.getElementById("phInput");
  const resultBox = document.getElementById("resultMessage");

  const tankId = tankSelect ? tankSelect.value : null;
  const temp = tempInput ? tempInput.value : "";
  const ph = phInput ? phInput.value : "";

  try {
    const responseText = await ApiService.postCheck(tankId, temp, ph);

    if (resultBox) {
      resultBox.style.display = "block";
      resultBox.innerHTML = responseText;
    }

    // 送信後に最新データでサマリー・表・グラフを更新
    await reloadDashboard();

    // フォーム入力をクリア
    if (tempInput) tempInput.value = "";
    if (phInput) phInput.value = "";
  } catch (error) {
    console.error("送信エラー:", error);
    alert("登録に失敗しました: " + error.message);
  }
}
