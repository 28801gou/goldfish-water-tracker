/**
 * サーバーとのAPI通信を担当するクラス
 */
export class ApiService {
  // ログ全件取得APIを呼び出す
  static async getTanks() {
    const response = await fetch("/api/tanks");
    if (!response.ok) {
      throw new Error("水槽一覧の取得に失敗しました");
    }
    return await response.json();
  }
  // ログ取得API（水槽IDが指定されれば絞り込み）
  static async getLogs(tankId) {
    const url = tankId ? `/logs?tankId=${encodeURIComponent(tankId)}` : "/logs";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("ログデータの取得に失敗しました");
    }
    return await response.json();
  }

  // 水質診断＆登録APIを呼び出す
  static async postCheck(tankId, temp, ph) {
    const params = new URLSearchParams();
    if (tankId) params.append("tankId", tankId);
    if (temp) params.append("temp", temp);
    if (ph) params.append("ph", ph);
    const response = await fetch(`/check?${params.toString()}`);
    if (!response.ok) {
      throw new Error("診断リクエストの送信に失敗しました");
    }
    return await response.text();
  }

  // ★ 新しい水槽を登録するAPI (POST)
  static async postTank(name, location) {
    const response = await fetch("/api/tanks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, location: location }),
    });
    if (!response.ok) throw new Error("水槽の登録に失敗しました");
    return await response.json();
  }

  // ★ 水槽情報を更新するAPI (PUT)
  static async putTank(id, name, location) {
    const response = await fetch(`/api/tanks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location }),
    });
    if (!response.ok) throw new Error("水槽の更新に失敗しました");
    return await response.json();
  }

  // ★ 水槽を削除するAPI (DELETE)
  static async deleteTank(id) {
    const response = await fetch(`/api/tanks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("水槽の削除に失敗しました");
  }
  // ApiService.js の中に追加
  static async getWaterChangeAdvice(currentPh, volume) {
    const response = await fetch(
      `/api/advice/water-change?currentPh=${currentPh}&volume=${volume}`,
    );
    if (!response.ok) throw new Error("計算処理に失敗しました");
    return await response.json();
  }
}
