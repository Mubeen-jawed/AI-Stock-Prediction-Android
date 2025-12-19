import sys
import os
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, "data")
MODEL_PATH = os.path.join(BASE_PATH, "models")

if not os.path.exists(MODEL_PATH):
    os.makedirs(MODEL_PATH)

def train(symbol):
    file_path = os.path.join(DATA_PATH, f"{symbol}.csv")

    df = pd.read_csv(file_path)

    df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
    df.dropna(subset=["Close"], inplace=True)

    prices = df["Close"].values.reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(prices)

    X, y = [], []
    window = 60

    for i in range(len(scaled) - window):
        X.append(scaled[i:i+window])
        y.append(scaled[i+window])

    X, y = np.array(X), np.array(y)

    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(window, 1)),
        LSTM(32),
        Dense(1)
    ])

    model.compile(optimizer="adam", loss="mse")
    model.fit(X, y, epochs=10, batch_size=32)

    model.save(os.path.join(MODEL_PATH, f"{symbol}.keras"))
    print(f"{symbol} model trained and saved.")

if __name__ == "__main__":
    symbol = sys.argv[1]
    train(symbol)
