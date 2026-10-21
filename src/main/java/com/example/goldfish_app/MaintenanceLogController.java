package com.example.goldfish_app;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin // ローカルテスト用
public class MaintenanceLogController {

    private final MaintenanceLogRepository repository;

    public MaintenanceLogController(MaintenanceLogRepository repository) {
        this.repository = repository;
    }

    // 記録を保存するAPI
    @PostMapping
    public MaintenanceLog addLog(@RequestBody MaintenanceLog log) {
        return repository.save(log);
    }

    // 特定の水槽の記録一覧を取得するAPI
    @GetMapping("/{tankId}")
    public List<MaintenanceLog> getLogs(@PathVariable Long tankId) {
        return repository.findByTankIdOrderByCreatedAtAsc(tankId);
    }
}