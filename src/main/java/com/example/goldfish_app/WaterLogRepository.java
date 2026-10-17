package com.example.goldfish_app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WaterLogRepository extends JpaRepository<WaterLog, Long> {
    // JpaRepository を継承するだけで、findAll() や save() が自動で使えるようにする
}