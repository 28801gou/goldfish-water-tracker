package com.example.goldfish_app;

import java.util.TimeZone;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class GoldfishAppApplication {
	// JVM起動時にタイムゾーンを日本標準時（Asia/Tokyo）に固定
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tokyo"));
    }

	public static void main(String[] args) {
		SpringApplication.run(GoldfishAppApplication.class, args);
	}


    // 起動時に水槽データが空なら、テスト用の初期水槽データを自動投入
    @Bean
    public CommandLineRunner initData(TankRepository tankRepository) {
        return args -> {
            if (tankRepository.count() == 0) {
                tankRepository.save(new Tank("室内60cm水槽", "屋内", "上部＋スポンジフィルター"));
                tankRepository.save(new Tank("屋外トロ舟", "屋外", "青水・エアレーション"));
                System.out.println(">>> 初期水槽データ（屋内・屋外）を登録しました。");
            }
        };
    }

}
