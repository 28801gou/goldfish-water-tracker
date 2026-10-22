package com.example.goldfish_app;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advice")
public class AdviceController {

    private final WaterChangeCalculatorService calculatorService;

    public AdviceController(WaterChangeCalculatorService calculatorService) {
        this.calculatorService = calculatorService;
    }

    @GetMapping("/water-change")
    public WaterChangeSuggestion getAdvice(
            @RequestParam double currentPh, 
            @RequestParam double volume) {
        return calculatorService.calculate(currentPh, volume);
    }
}