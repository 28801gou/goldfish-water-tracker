package com.example.goldfish_app;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/vision")
public class VisionApiController {

    @Value("${GEMINI_API_KEY:${gemini.api.key:}}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/analyze")
    public String analyzeWaterVolume(
            @RequestParam("image") MultipartFile file,
            @RequestParam("width") String width,
            @RequestParam("depth") String depth,
            @RequestParam("height") String height,
            @RequestParam(value = "temp", defaultValue = "不明") String temp,
            @RequestParam(value = "ph", defaultValue = "不明") String ph) {

        try {
            // 1. 画像データをBase64エンコード
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

            // 2. 満水量の計算とプロンプトの構築
            double maxVolume = (Double.parseDouble(width) * Double.parseDouble(depth) * Double.parseDouble(height)) / 1000.0;
            String prompt = String.format(
                "あなたはプロのアクアリストです。対象の水槽は幅%scm、奥行%scm、高さ%scm（満水量 約%.1fリットル）です。" +
                "現在の水質は【水温: %s℃, pH: %s】です。" +
                "写真から現在の水量の割合（％）と推定水量（リットル）を判定し、" +
                "その水量と現在の水質データの両方を考慮して、今何リットルの換水（または足し水）を行うべきか、" +
                "具体的な理由とともに150文字程度のHTML形式（<br>や<b>タグ使用可）で端的にアドバイスしてください。",
                width, depth, height, maxVolume, temp, ph
            );

            // 3. Gemini APIエンドポイント
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + apiKey.trim();

            // 4. リクエストボディの構築
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inlineData", Map.of(
                            "mimeType", mimeType,
                            "data", base64Image
                        ))
                    ))
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // 5. API通信の実行
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

            // 6. JSONレスポンスからテキスト部分を抽出して返却
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("candidates").get(0)
                       .path("content")
                       .path("parts").get(0)
                       .path("text").asString("");

        } catch (Exception e) {
            e.printStackTrace();
            return "<span style='color: red;'>AIの分析中にエラーが発生しました。ログを確認してください。</span>";
        }
    }
}