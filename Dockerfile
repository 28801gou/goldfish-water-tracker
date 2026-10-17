# ========================================================
# ステージ1: ビルド環境（JDKを使ってjarファイルを生成）
# ========================================================
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /workspace

# キャッシュを効かせるため、ビルド設定ファイルを先にコピー
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Gradleの依存関係を事前ダウンロード
RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon

# アプリのソースコード（Java・静的ファイル）をコピー
COPY src src

# 実行可能JARファイル（bootJar）を作成
RUN ./gradlew bootJar --no-daemon

# ========================================================
# ステージ2: 実行環境（余計なコンパイラ等を省いた軽量JRE）
# ========================================================
FROM eclipse-temurin:25-jre
WORKDIR /app

# ステージ1で作成された成果物（JAR）だけを実行環境へコピー
COPY --from=builder /workspace/build/libs/*.jar app.jar

# コンテナが利用するポート番号
EXPOSE 8080

# コンテナ起動時にアプリを実行
ENTRYPOINT ["java", "-jar", "app.jar"]