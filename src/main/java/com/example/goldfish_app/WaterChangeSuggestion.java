package com.example.goldfish_app;

public class WaterChangeSuggestion {
private double changeVolume;
    private String message;

    public WaterChangeSuggestion(double changeVolume, String message) {
        this.changeVolume = changeVolume;
        this.message = message;
    }

    // Getter
    public double getChangeVolume() { return changeVolume; }
    public String getMessage() { return message; }
}