package com.example.goldfish_app;

import org.springframework.stereotype.Service;

@Service
public class WaterChangeCalculatorService {

    // 安全圏と定数の設定
    private static final double MIN_SAFE_PH = 6.5;
    private static final double MAX_SAFE_PH = 7.5;
    private static final double TAP_WATER_PH = 7.5; // 水道水の平均的なpH
    private static final double MAX_CHANGE_RATIO = 0.5; // 一度の最大換水割合（50%）

    public WaterChangeSuggestion calculate(double currentPh, double currentVolumeLiters) {

        // 1. 安全圏内なら換水不要
        if (currentPh >= MIN_SAFE_PH && currentPh <= MAX_SAFE_PH) {
            return new WaterChangeSuggestion(0, "pHは安全圏内です。水質による緊急の換水は不要です。");
        }

        double requiredRatio;
        String warningMsg = "";

        // 2. 酸性とアルカリ性でロジックを分岐
        if (currentPh < MIN_SAFE_PH) {
            // 酸性の場合：pH7.0を目標に計算
            double hCurrent = Math.pow(10, -currentPh);
            double hTarget = Math.pow(10, -7.0);
            double hTap = Math.pow(10, -TAP_WATER_PH);
            requiredRatio = (hCurrent - hTarget) / (hCurrent - hTap);
        } else {
            // アルカリ性の場合：水道水(7.5)の換水で薄める
            requiredRatio = MAX_CHANGE_RATIO;
            warningMsg = "※アルカリ性への異常な傾きを検知しました。アンモニア中毒の危険があるため、速やかに水質改善を行ってください。<br>";
        }

        // 3. セーフティガード（最大50%までに抑える）
        if (requiredRatio > MAX_CHANGE_RATIO) {
            requiredRatio = MAX_CHANGE_RATIO;
            warningMsg += "※ショックを防ぐため、一度の換水量を50%に制限しています。数日に分けて換水してください。";
        }

        // 4. 必要な換水量（リットル）の計算とメッセージ生成
        double changeVolume = currentVolumeLiters * requiredRatio;
        String message = String.format("約%.1fリットル（全体の%.0f%%）の換水を推奨します。", 
                                       changeVolume, requiredRatio * 100);
        
        if (!warningMsg.isEmpty()) {
            message += String.format("<br><span style='color:red; font-weight:bold;'>%s</span>", warningMsg);
        }

        return new WaterChangeSuggestion(changeVolume, message);
    }
}