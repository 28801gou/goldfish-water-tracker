package com.example.goldfish_app;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;


@Entity
public class WaterLog{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 自動採番の主キー
    
    private Double temp;        //水温
    private Double ph;          //ph
    private String status;      //診断コメント
    private String recordedAt;  //測定日時
    
    // JPAが内部でインスタンス化するためにデフォルトコンストラクタが必要
    public WaterLog() {}
    
    public WaterLog(Double temp,Double ph, String status){
        this.temp = temp;
        this.ph = ph;
        this.status = status;
        this.recordedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"));
    }
      // Spring BootがJSONに自動変換する際、Getterが必須になります
    public Double getTemp() {
        return temp;
    }

    public Double getPh() {
        return ph;
    }

    public String getStatus() {
        return status;
    }

    public String getRecordedAt() {
        return recordedAt;
    
    }
}