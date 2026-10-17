/**
 * サーバーとのAPI通信を担当するクラス
 */
// ほかのファイルからこのクラスをimportして使えるように公開する
export class ApiService {
  // ログ全件取得APIを呼び出す
  static async getLogs() {
    const response = await fetch("/logs");
    if (!response.ok) {
      throw new Error("ログデータの取得に失敗しました");
    }
    return await response.json();
  }

  // 水質診断＆登録APIを呼び出す
  static async postCheck(temp, ph) {
    const query = new URLSearchParams({ temp, ph }).toString();
    const response = await fetch(`/check?${query}`);
    if (!response.ok) {
      throw new Error("診断リクエストの送信に失敗しました");
    }
    return await response.text();
  }
}
