/**
 * サーバーとのAPI通信を担当するクラス
 */
// ほかのファイルからこのクラスをimportして使えるように公開する
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
}
