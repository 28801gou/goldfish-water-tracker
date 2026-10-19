package com.example.goldfish_app;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity 
public class Tank{

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;            //水槽名
    private String location;        //場所（屋外か屋内か）
    private String description;     // 補足メモ（例: "上部フィルター", "青水飼育" など自由記述）

    // ★追記：水槽が削除されたとき、紐づくWaterLogも一緒に削除（CASCADE）する設定
    // ※ "tank" の部分は、WaterLog.java 側で Tank を定義している変数名（private Tank tank;）と一致させます。
    @OneToMany(mappedBy = "tank", cascade = CascadeType.REMOVE)
    private List<WaterLog> waterLogs;

    public Tank() {}

    public Tank(String name, String location, String description) {
        this.name = name;
        this.location = location;
        this.description = description;
    }
// Getter / Setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    // ★追記：waterLogs 用の Getter / Setter
    public List<WaterLog> getWaterLogs() {
        return waterLogs;
    }

    public void setWaterLogs(List<WaterLog> waterLogs) {
        this.waterLogs = waterLogs;
    }
}

