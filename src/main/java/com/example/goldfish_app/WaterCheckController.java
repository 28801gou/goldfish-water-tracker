package com.example.goldfish_app;

import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WaterCheckController {

    private final WaterLogRepository waterLogRepository;
    private final TankRepository tankRepository;
    private final LineNotificationService lineNotificationService; // ① LINE通知サービスを追加

    // コンストラクタインジェクションでLineNotificationServiceも注入
    public WaterCheckController(WaterLogRepository waterLogRepository, TankRepository tankRepository, LineNotificationService lineNotificationService) {
        this.waterLogRepository = waterLogRepository;
        this.tankRepository = tankRepository;
        this.lineNotificationService = lineNotificationService;
    }

    // ① 水槽一覧を取得するAPI (GET /api/tanks)
    @GetMapping("/api/tanks")
    public List<Tank> getTanks() {
        return tankRepository.findAll();
    }

    // 新規登録API
    @PostMapping("/api/tanks")
    public Tank createTank(@RequestBody Tank tank) {
        return tankRepository.save(tank);
    }

    // 水槽情報の設定変更（Update）
    @PutMapping("/api/tanks/{id}")
    public Tank updateTank(@PathVariable Long id, @RequestBody Tank updatedTank) {
        return tankRepository.findById(id).map(tank -> {
            tank.setName(updatedTank.getName());
            tank.setLocation(updatedTank.getLocation());
            return tankRepository.save(tank);
        }).orElseThrow(() -> new RuntimeException("指定された水槽が見つかりません"));
    }

    // 水槽の削除（Delete）
    @DeleteMapping("/api/tanks/{id}")
    public void deleteTank(@PathVariable Long id) {
        tankRepository.deleteById(id);
    }

    // 水質診断＆記録API
    @GetMapping("/check")
    public String checkWater(
        @RequestParam(name = "tankId", required = false) Long tankId,
        @RequestParam(name = "temp", required = false) Double temp,
        @RequestParam(name = "ph", required = false) Double ph) {

        Tank targetTank = null;
        if (tankId != null) {
            Optional<Tank> tankOpt = tankRepository.findById(tankId);
            if (tankOpt.isPresent()) {
                targetTank = tankOpt.get();
            }
        }

        StringBuilder diagnosis = new StringBuilder("<h3>【水質診断結果】</h3>");
        StringBuilder lineAlert = new StringBuilder(); // LINE用の警告メッセージ

        String tankName = (targetTank != null) ? targetTank.getName() : "不明な水槽";

        if (targetTank != null) {
            diagnosis.append("【").append(targetTank.getName()).append("（").append(targetTank.getLocation()).append("）】 ");
        }

        // 水温の判定
        if (temp != null) {
            diagnosis.append("・現在の水温：").append(temp).append("℃ → ");
            if (temp < 15.0) {
                diagnosis.append("<b>【低水温】</b> 消化機能が低下します。給餌量を減らすか水温維持を検討してください。<br>");
                lineAlert.append("⚠️ 水温低下アラート: ").append(temp).append("℃\n消化機能低下に注意してください。\n");
            } else if (temp > 28.0) {
                diagnosis.append("<b>【高水温】</b> 酸欠や菌の繁殖リスクが上がります。エアレーションの強化を推奨します。<br>");
                lineAlert.append("⚠️ 水温上昇アラート: ").append(temp).append("℃\nエアレーションを強化してください。\n");
            } else {
                diagnosis.append("<b>【適正】</b> 金魚にとって快適な水温帯です。<br>");
            }
        }

        // pHの判定
        if (ph != null) {
            diagnosis.append("・現在のpH: ").append(ph).append(" → ");
            if (ph < 6.5) {
                diagnosis.append("<b>【酸性化】</b> ろ過バクテリアの活性低下や汚れ蓄積の兆候です。部分換水を推奨します。<br>");
                lineAlert.append("⚠️ pH酸性化アラート: pH ").append(ph).append("\n部分換水を検討してください。\n");
            } else if (ph > 8.0) {
                diagnosis.append("<b>【アルカリ傾向】</b> アンモニアの毒性が強まりやすい環境です。<br>");
                lineAlert.append("⚠️ pHアルカリ化アラート: pH ").append(ph).append("\nアンモニア毒性に注意してください。\n");
            } else {
                diagnosis.append("<b>【良好】</b> 弱アルカリ〜中性で水質が安定しています。<br>");
            }
        }

        if (temp == null && ph == null) {
            diagnosis.append("水温（temp）またはpH（ph）が指定されていません。<br>例: /check?temp=22.0&ph=7.2");
        }

        String resultText = diagnosis.length() > 0 ? diagnosis.toString() : "未指定";

        // DBに保存
        WaterLog newLog = new WaterLog(targetTank, temp, ph, resultText);
        waterLogRepository.save(newLog);

        // ② 異常値がある場合は LINE 送信を実行
        if (lineAlert.length() > 0) {
            String fullLineMessage = "【" + tankName + " 水質警告】\n" + lineAlert.toString();
            lineNotificationService.sendAlert(fullLineMessage);
        }

        return resultText;
    }

    // 測定履歴の取得
    @GetMapping("/logs")
    public List<WaterLog> getLogs(@RequestParam(name = "tankId", required = false) Long tankId) {
        if (tankId != null) {
            return waterLogRepository.findByTankId(tankId);
        }
        return waterLogRepository.findAll();
    }
}