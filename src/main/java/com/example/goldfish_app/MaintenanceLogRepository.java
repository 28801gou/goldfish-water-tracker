package com.example.goldfish_app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    // 水槽IDをもとに、古い順（グラフの左から右の順）で記録を取得する
    List<MaintenanceLog> findByTankIdOrderByCreatedAtAsc(Long tankId);
} 
    

