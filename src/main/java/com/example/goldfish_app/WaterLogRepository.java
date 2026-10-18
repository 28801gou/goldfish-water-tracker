package com.example.goldfish_app;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WaterLogRepository extends JpaRepository<WaterLog, Long> {
    // JpaRepository を継承するだけで、findAll() や save() が自動で使えるようにする
// tank_id を指定してログを取得（Spring Data JPAがメソッド名からSQLを自動生成）
    List<WaterLog> findByTankId(Long tankId);
}