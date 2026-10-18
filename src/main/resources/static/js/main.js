import { ApiService } from "./services/ApiService.js";
import { TableView } from "./views/TableView.js";
import { ChartView } from "./views/ChartView.js";

const tableView = new TableView("logTableBody");
const chartView = new ChartView("waterChart");

// 画面読み込み完了時の初期化
document.addEventListener("DOMContentLoaded", async () => {
  const tankSelect = document.getElementById("tankSelect");
  const form = document.getElementById("waterForm");

  // ① 水槽プルダウンを生成
  await initTankSelect(tankSelect);

  // ② 初期表示（選択中水槽のログ・グラフを描画）
  await reloadDashboard();

  // ③ プルダウン切り替え時にダッシュボード（表＆グラフ）を即時再描画
  if (tankSelect) {
    tankSelect.addEventListener("change", async () => {
      console.log("水槽切り替え検知 -> tankId:", tankSelect.value);
      await reloadDashboard();
    });
  }

  // ④ フォーム送信時のイベント
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

// 選択中の水槽ログを取得してダッシュボード（表とグラフ）を更新
async function reloadDashboard() {
  const tankSelect = document.getElementById("tankSelect");
  const selectedTankId = tankSelect ? tankSelect.value : null;

  try {
    const logs = await ApiService.getLogs(selectedTankId);
    // 表とグラフの両方を最新ログで再描画
    tableView.render(logs);
    chartView.render(logs);
  } catch (error) {
    console.error("ダッシュボード更新に失敗しました:", error);
  }
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

    // 送信後に最新データで表とグラフを更新
    await reloadDashboard();

    // フォーム入力をクリア
    if (tempInput) tempInput.value = "";
    if (phInput) phInput.value = "";
  } catch (error) {
    console.error("送信エラー:", error);
    alert("登録に失敗しました: " + error.message);
  }
}
