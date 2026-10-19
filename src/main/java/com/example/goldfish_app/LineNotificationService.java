package com.example.goldfish_app;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class LineNotificationService {

    @Value("${line.bot.channel-token}")
    private String channelAccessToken;

    @Value("${line.bot.user-id}")
    private String userId;

    public void sendAlert(String messageText) {
        if (channelAccessToken == null || channelAccessToken.equals("dummy") || channelAccessToken.isEmpty()) {
            System.out.println("【LINE通知スキップ】トークンが未設定です。メッセージ: " + messageText);
            return;
        }

        try {
            // ★ ここを追加！ 改行(\n)やダブルクォーテーション(")をJSONの仕様に合わせて変換(エスケープ)する
            String escapedMessage = messageText.replace("\"", "\\\"").replace("\n", "\\n");

            String jsonBody = "{\n" +
                    "    \"to\": \"" + userId + "\",\n" +
                    "    \"messages\": [\n" +
                    "        {\n" +
                    "            \"type\": \"text\",\n" +
                    "            \"text\": \"" + escapedMessage + "\"\n" + // ★ 変換した文字を使う
                    "        }\n" +
                    "    ]\n" +
                    "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.line.me/v2/bot/message/push"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + channelAccessToken)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                System.out.println("LINE通知を送信しました。");
            } else {
                System.err.println("LINE通知失敗: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("LINE通知エラー: " + e.getMessage());
        }
    }
}