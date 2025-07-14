FROM python:3.11-slim

# 作業ディレクトリの設定
WORKDIR /app

# システムパッケージの更新とタイムゾーン設定
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

# 依存関係ファイルのコピー
COPY requirements.txt .

# 依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションファイルのコピー
COPY . .

# ポート9000を公開
EXPOSE 9000

# アプリケーションの起動
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]