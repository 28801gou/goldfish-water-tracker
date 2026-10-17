/**
 * 画面上のテーブル描画を担当するクラス
 */
export class TableView {
  constructor(tbodyElementId) {
    // 対象となる <tbody> タグをプロパティとして保持
    this.tbody = document.getElementById(tbodyElementId);
  }

  // ログ配列を受け取ってテーブル行を描画する
  render(logs) {
    this.tbody.innerHTML = "";

    if (!logs || logs.length === 0) {
      this.tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; color:#9fb3c8;">まだ測定データがありません</td></tr>';
      return;
    }

    // 新しい順（降順）で表示
    logs
      .slice()
      .reverse()
      .forEach((log) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td>${log.recordedAt}</td>
                <td>${log.temp !== null ? log.temp + " ℃" : "-"}</td>
                <td>${log.ph !== null ? log.ph : "-"}</td>
                <td>${log.status}</td>
            `;
        this.tbody.appendChild(tr);
      });
  }
}
