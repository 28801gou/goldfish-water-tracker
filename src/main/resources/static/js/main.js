import { ApiService } from "./services/ApiService.js";
import { TableView } from "./views/TableView.js";
import { ChartView } from "./views/ChartView.js";

const tableView = new TableView("logTableBody");
const chartView = new ChartView("waterChart");

// ==========================================
// ★ Chart.js 縦線描画用の自作プラグイン
// ==========================================
const verticalLinePlugin = {
  id: "maintenanceLines",
  afterDraw: (chart) => {
    const maintLogs = chart.config.options.maintenanceLogs;
    const timestamps = chart.config.options.logTimestamps;
    if (!maintLogs || !maintLogs.length || !timestamps || !timestamps.length) {
      return;
    }

    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.yTemp || chart.scales.y || chart.chartArea;
    if (!xAxis || !yAxis) return;

    maintLogs.forEach((log) => {
      const logDate = new Date(log.createdAt).getTime();
      if (isNaN(logDate)) return;

      // 水質ログのタイムスタンプ配列からX座標を算出（線形補間）
      let xPos;
      const n = timestamps.length;
      if (n === 1 || logDate <= timestamps[0]) {
        xPos = xAxis.getPixelForValue(0);
      } else if (logDate >= timestamps[n - 1]) {
        xPos = xAxis.getPixelForValue(n - 1);
      } else {
        for (let i = 0; i < n - 1; i++) {
          if (logDate >= timestamps[i] && logDate <= timestamps[i + 1]) {
            const span = timestamps[i + 1] - timestamps[i];
            const ratio = span > 0 ? (logDate - timestamps[i]) / span : 0;
            const px1 = xAxis.getPixelForValue(i);
            const px2 = xAxis.getPixelForValue(i + 1);
            xPos = px1 + (px2 - px1) * ratio;
            break;
          }
        }
      }

      if (xPos === undefined) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPos, yAxis.top);
      ctx.lineTo(xPos, yAxis.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      ctx.fillStyle = "rgba(21, 128, 61, 1)";
      ctx.font = "bold 12px sans-serif";
      const labelText = `${log.actionType}(${log.changeScale})`;
      const textWidth = ctx.measureText(labelText).width;
      const textX =
        xPos + 5 + textWidth > chart.chartArea.right
          ? xPos - textWidth - 5
          : xPos + 5;
      ctx.fillText(labelText, textX, yAxis.top + 15);
      ctx.restore();
    });
  },
};
Chart.register(verticalLinePlugin);

// ==========================================
// 画面読み込み完了時の初期化処理
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const tankSelect = document.getElementById("tankSelect");
  const form = document.getElementById("waterForm");
  const maintBtn = document.getElementById("btn-submit-maint"); // ★追加：メンテナンスボタン

  initChartToggle();
  await initTankSelect(tankSelect);
  await reloadDashboard();
  // ★ AI換水アシスタントのボタン処理
  const btnCalcAdvice = document.getElementById("btn-calc-advice");
  if (btnCalcAdvice) {
    btnCalcAdvice.addEventListener("click", async () => {
      // 画面上部に表示されている「現在のpH」のテキストを取得
      const currentPhText = document.getElementById("currentPh").textContent;
      const volumeText = document.getElementById("advice-volume").value;
      const resultBox = document.getElementById("advice-result");

      // pHがまだ測定されていない場合のガード
      if (currentPhText === "-.--" || isNaN(parseFloat(currentPhText))) {
        alert("現在のpHデータがありません。先に水質を測定してください。");
        return;
      }

      const currentPh = parseFloat(currentPhText);
      const volume = parseFloat(volumeText);

      try {
        // APIを呼び出して計算結果を取得
        const suggestion = await ApiService.getWaterChangeAdvice(
          currentPh,
          volume,
        );

        // 結果を画面に表示
        resultBox.style.display = "block";
        resultBox.innerHTML = `<strong>✨ 提案:</strong><br>${suggestion.message}`;
      } catch (error) {
        console.error("エラー:", error);
        alert("計算中にエラーが発生しました。");
      }
    });
  }
  // ★ AI水量チェックの画像送信処理
  const btnAnalyzeImage = document.getElementById("btn-analyze-image");
  if (btnAnalyzeImage) {
    btnAnalyzeImage.addEventListener("click", async () => {
      const fileInput = document.getElementById("tank-image");
      const resultBox = document.getElementById("vision-result");

      // 1. 一番最初に、写真が選択されているかチェックする
      if (!fileInput.files.length) {
        alert("水槽の写真を選択してください");
        return;
      }

      // 2. 寸法と水質データを取得
      const w = document.getElementById("tank-w").value;
      const d = document.getElementById("tank-d").value;
      const h = document.getElementById("tank-h").value;

      const currentTemp = document.getElementById("currentTemp")
        ? document.getElementById("currentTemp").textContent
        : "不明";
      const currentPh = document.getElementById("currentPh")
        ? document.getElementById("currentPh").textContent
        : "不明";

      // 3. 送信用データの組み立て（1回だけ宣言する）
      const formData = new FormData();
      formData.append("image", fileInput.files[0]);
      formData.append("width", w);
      formData.append("depth", d);
      formData.append("height", h);
      formData.append("temp", currentTemp);
      formData.append("ph", currentPh);

      // 4. 分析中メッセージの表示
      resultBox.style.display = "block";
      resultBox.innerHTML = "AIが画像を分析しています... ⏳";

      // 5. API通信
      try {
        const response = await fetch("/api/vision/analyze", {
          method: "POST",
          body: formData,
        });
        resultBox.innerHTML = await response.text();
      } catch (error) {
        console.error("画像分析エラー:", error);
        resultBox.innerHTML =
          '<span style="color: red;">分析に失敗しました。</span>';
      }
    });
  }
  // プルダウン切り替え時のイベント
  if (tankSelect) {
    tankSelect.addEventListener("change", async () => {
      console.log("水槽切り替え検知 -> tankId:", tankSelect.value);
      // ★ メンテナンス用フォームの水槽IDも連動して切り替える
      const maintTankId = document.getElementById("maint-tank-id");
      if (maintTankId) maintTankId.value = tankSelect.value;

      await reloadDashboard();
    });
  }

  // フォーム送信時のイベント
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  // ★追加：メンテナンス記録ボタンが押された時の処理
  if (maintBtn) {
    maintBtn.addEventListener("click", async () => {
      const maintTankEl = document.getElementById("maint-tank-id");
      const maintTankId = Number(
        (tankSelect && tankSelect.value) || (maintTankEl && maintTankEl.value),
      );
      const actionType = document.getElementById("maint-action").value;
      const changeScale = document.getElementById("maint-scale").value;
      const memo = document.getElementById("maint-memo").value;

      try {
        const res = await fetch("/api/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tankId: maintTankId,
            actionType,
            changeScale,
            memo,
          }),
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        alert("メンテナンス記録を保存しました！");
        document.getElementById("maint-memo").value = "";
        await reloadDashboard(); // グラフに縦線を反映させるため再読み込み
      } catch (error) {
        console.error("メンテナンス記録の保存に失敗:", error);
        alert("メンテナンス記録の保存に失敗しました: " + error.message);
      }
    });
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

    // 初期表示時に、メンテナンスフォームのhidden値も一番上の水槽に合わせる
    const maintTankId = document.getElementById("maint-tank-id");
    if (maintTankId && tanks.length > 0) maintTankId.value = tanks[0].id;
  } catch (error) {
    console.error("水槽一覧の取得に失敗しました:", error);
  }
}

// 選択中の水槽ログを取得してダッシュボードを更新
async function reloadDashboard() {
  const tankSelect = document.getElementById("tankSelect");
  const selectedTankId = tankSelect ? tankSelect.value : null;

  if (!selectedTankId) return;

  try {
    // 1. 水質のデータを取得
    const waterData = await ApiService.getLogs(selectedTankId);

    // 2. メンテナンスのデータを取得
    const maintResponse = await fetch(`/api/maintenance/${selectedTankId}`);
    const maintData = maintResponse.ok ? await maintResponse.json() : [];

    // 3. 画面の各部品にデータを渡して更新
    updateCurrentStatus(waterData);
    tableView.render(waterData);
    chartView.render(waterData, maintData); // maintDataを追加して渡す
  } catch (error) {
    console.error("ダッシュボード更新に失敗しました:", error);
  }
}

// 最上部の「現在の水質状況」カードを更新
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

  const latest = logs[logs.length - 1];
  const temp = Number(latest.temp);
  const ph = Number(latest.ph);
  const recordedAt = latest.recordedAt || "記録なし";

  if (currentTempEl) currentTempEl.textContent = temp.toFixed(1);
  if (currentPhEl) currentPhEl.textContent = ph.toFixed(2);
  if (lastUpdatedTextEl)
    lastUpdatedTextEl.textContent = `最終測定: ${recordedAt}`;

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

// グラフ折りたたみ制御
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
      if (chartView && chartView.chart) {
        chartView.chart.resize();
      }
    }
  });
}

// 診断＆記録ボタン処理
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
    await reloadDashboard();
    if (tempInput) tempInput.value = "";
    if (phInput) phInput.value = "";
  } catch (error) {
    console.error("送信エラー:", error);
    alert("登録に失敗しました: " + error.message);
  }
}
