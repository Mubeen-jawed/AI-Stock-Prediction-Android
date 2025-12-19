import sys
import yfinance as yf
import os

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, "data")

if not os.path.exists(DATA_PATH):
    os.makedirs(DATA_PATH)

def download(symbol):
    print(f"Downloading data for {symbol}...")
    df = yf.download(symbol, period="5y", interval="1d")
    file_path = os.path.join(DATA_PATH, f"{symbol}.csv")
    df.to_csv(file_path)
    print(f"Saved {symbol} dataset → {file_path}")

if __name__ == "__main__":
    symbol = sys.argv[1]
    download(symbol)
