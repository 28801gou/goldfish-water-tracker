// 他のファイルからクラスをインポート（Javaの import と同じ！）
import { ApiService } from "./services/ApiService.js";
import { TableView } from "./views/TableView.js";
import { ChartView } from "./views/ChartView.js";

// テーブル描画クラスのインスタンスを生成
const tableView = new TableView("logTableBody");
const chartView = new ChartView("waterChart");
// データを取得して画面（表・グラフ）を再描画する

async function reloadDashboard() {
  try {
    const logs = await ApiService.getLogs();
    tableView.render(logs);
    chartView.render(logs); // ★グラフも同時に更新
  } catch (error) {
    console.error("ダッシュボード更新エラー:", error);
  }
}
// 画面読み込み完了時の処理
document.addEventListener("DOMContentLoaded", async () => {
  await reloadDashboard();

  // フォームの送信イベントを監視
  const form = document.getElementById("waterForm");
  form.addEventListener("submit", handleSubmit);
});

// 送信ボタンが押されたときの処理
async function handleSubmit(event) {
  event.preventDefault(); // 画面全体のリロード（GET送信）を防止

  const tempInput = document.getElementById("tempInput");
  const phInput = document.getElementById("phInput");
  const resultBox = document.getElementById("resultMessage");

  try {
    // 通信クラスを使ってSpring Bootへ送信
    await ApiService.postCheck(tempInput.value, phInput.value);

    // 成功メッセージ表示
    resultBox.style.display = "block";
    resultBox.innerHTML = `<strong>記録完了:</strong> 水温 ${tempInput.value}℃ / pH ${phInput.value} を保存しました。`;

    // 送信直後に表とグラフを最新化
    await reloadDashboard();

    // 入力フォームをクリア
    tempInput.value = "";
    phInput.value = "";
  } catch (error) {
    alert("エラーが発生しました: " + error.message);
  }
}
