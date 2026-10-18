#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// ピン配置
const int ONE_WIRE_BUS = 4; // DS18B20 データピン
const int PH_PIN = 34;      // pHセンサー アナログ入力ピン

// OneWireおよびDallasTemperatureの初期化
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

// pH校正用定数（標準校正液で微調整）
const float PH_CALIBRATION_SLOPE = -5.70; // 傾き
const float PH_CALIBRATION_INTERCEPT = 18.72; // 切片

void setup() {
  Serial.begin(115200);
  delay(1000);

  // センサー初期化
  tempSensors.begin();
  analogReadResolution(12); // ESP32のADCを12bit(0-4095)に設定

  Serial.println("\nESP32 水質自動記録モジュール 起動");
  Serial.print("Wi-Fi接続中");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWi-Fi 接続成功！");
  Serial.print("ESP32のIPアドレス: ");
  Serial.println(WiFi.localIP());
}

float readTemperature() {
  tempSensors.requestTemperatures();
  float tempC = tempSensors.getTempCByIndex(0);
  
  // センサー未接続や断線時は -127.0 が返る
  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("警告: 水温センサーが読み取れません");
    return 25.0; // フォールバック値
  }
  return tempC;
}

float readPH() {
  // アナログ値を安定させるため10回平均を取得
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PH_PIN);
    delay(10);
  }
  float avgRaw = sum / 10.0;
  
  // 電圧変換 (0 - 3.3V)
  float voltage = (avgRaw / 4095.0) * 3.3;

  // 電圧からpHへの一次変換
  float phVal = (voltage * PH_CALIBRATION_SLOPE) + PH_CALIBRATION_INTERCEPT;
  
  // 異常値クリップ
  if (phVal < 0.0) phVal = 0.0;
  if (phVal > 14.0) phVal = 14.0;
  
  return phVal;
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // 実機センサーから値を取得
    float currentTemp = readTemperature();
    float currentPH = readPH();

    // 送信URLの組み立て
    String url = "http://" + String(SERVER_HOST) + ":" + String(SERVER_PORT) +
                 "/check?tankId=1&temp=" + String(currentTemp, 1) + 
                 "&ph=" + String(currentPH, 2);

    Serial.println("送信リクエスト: " + url);

    http.begin(url);
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      Serial.println("サーバーからの応答:");
      String response = http.getString();
      Serial.println(response);
    } else {
      Serial.print("送信失敗 エラーコード: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fiが切断されています。再接続を試みます...");
    WiFi.reconnect();
  }

  // 1分ごとに計測送信（実運用では5分〜15分推奨）
  Serial.println("次回送信まで5分待機...\n");
  delay(300000);
}