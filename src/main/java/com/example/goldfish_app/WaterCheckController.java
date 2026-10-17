package com.example.goldfish_app;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class WaterCheckController {
// ① メモリの List ではなく、JPA の Repository を保持する
    private final WaterLogRepository repository;
    // ② コンストラクタ インジェクション（Spring Boot が自動で Repository を渡してくれる）
    public WaterCheckController(WaterLogRepository repository) {
        this.repository = repository;
    }
    // ➀メソッド単位でURLを割り当て
    // ルーティング

    @GetMapping("/check")
    public String checkWater(
        // ➁自動で文字から数値（Double）へ型変換
        // required = falseで値がない場合はnullになる
        @RequestParam(name = "temp" ,required = false)Double temp,
        @RequestParam(name = "ph", required = false)Double ph){

        StringBuilder diagnosis = new StringBuilder("<h3>【水質診断結果】</h3>");
        
        // 水温の判定
        if (temp != null){
            diagnosis.append("・現在の水温：").append(temp).append("℃ → ");
            if (temp < 15.0) {
                diagnosis.append("<b>【低水温】</b> 消化機能が低下します。給餌量を減らすか水温維持を検討してください。<br>");
            } else if (temp > 28.0) {
                diagnosis.append("<b>【高水温】</b> 酸欠や菌の繁殖リスクが上がります。エアレーションの強化を推奨します。<br>");
            } else {
                diagnosis.append("<b>【適正】</b> 金魚にとって快適な水温帯です。<br>");
            }
        }

        // pHの判定（中性〜弱アルカリ性: 6.5〜7.5前後が安定）
        if (ph != null) {
            diagnosis.append("・現在のpH: ").append(ph).append(" → ");
            if (ph < 6.5) {
                diagnosis.append("<b>【酸性化】</b> ろ過バクテリアの活性低下や汚れ蓄積の兆候です。部分換水を推奨します。<br>");
            } else if (ph > 8.0) {
                diagnosis.append("<b>【アルカリ傾向】</b> アンモニアの毒性が強まりやすい環境です。<br>");
            } else {
                diagnosis.append("<b>【良好】</b> 弱アルカリ〜中性で水質が安定しています。<br>");
            }
        }if (temp == null && ph == null) {
            diagnosis.append("水温（temp）またはpH（ph）が指定されていません。<br>例: /check?temp=22.0&ph=7.2");
        }
        String resultText = diagnosis.length() > 0 ? diagnosis.toString() : "未指定";
        // Entity インスタンスを生成
        WaterLog newLog = new WaterLog(temp, ph, resultText);
// ③ DBへ保存！（SQLの INSERT INTO が裏で自動実行される）
        repository.save(newLog);

        return resultText;
    }
    // 蓄積された履歴を一覧で返すルーティング
    @GetMapping("/logs")
    // 測定履歴の取得（PostgreSQLから全件取得してJSONで返却）
    public List<WaterLog> getLogs(){
// ④ DBから全件取得！（SQLの SELECT * FROM が裏で自動実行される）
        return repository.findAll();
    
}}