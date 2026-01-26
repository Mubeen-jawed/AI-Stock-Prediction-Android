import os
import pandas as pd
import numpy as np
import ta
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional, Input
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
import joblib

# Current script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Data is saved by the FastAPI server into backend/ai-models/price-prediction/data
DATA_PATH = os.path.join(SCRIPT_DIR, "../data")
# Models are in backend/ai-models/price-prediction/models
MODEL_PATH = os.path.join(SCRIPT_DIR, "../models")
os.makedirs(MODEL_PATH, exist_ok=True)

lookback = 60
epochs = 50
batch_size = 16

def create_lstm_model(input_shape):
    model = Sequential()
    # Bidirectional LSTM for better context
    model.add(Input(shape=input_shape))
    model.add(Bidirectional(LSTM(units=64, return_sequences=True)))
    model.add(Dropout(0.2))
    model.add(Bidirectional(LSTM(units=32, return_sequences=False)))
    model.add(Dropout(0.2))
    model.add(Dense(units=25))
    model.add(Dense(units=1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def add_technical_indicators(df):
    # Ensure numeric
    df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
    df['Volume'] = pd.to_numeric(df['Volume'], errors='coerce')
    
    # 1. RSI (14)
    df['RSI'] = ta.momentum.rsi(df['Close'], window=14)
    
    # 2. SMA (20)
    df['SMA'] = ta.trend.sma_indicator(df['Close'], window=20)
    
    # 3. MACD
    macd = ta.trend.MACD(df['Close'])
    df['MACD'] = macd.macd()
    df['MACD_SIGNAL'] = macd.macd_signal()
    
    # 4. Bollinger Bands
    bollinger = ta.volatility.BollingerBands(df['Close'], window=20, window_dev=2)
    df['BB_HIGH'] = bollinger.bollinger_hband()
    df['BB_LOW'] = bollinger.bollinger_lband()
    
    # Drop NaNs created by indicators
    df.dropna(inplace=True)
    return df

def train_stock(stock_csv):
    symbol = os.path.basename(stock_csv).split(".")[0]
    print(f"Loading data for {symbol}...")
    try:
        df = pd.read_csv(stock_csv, parse_dates=['Date'])
    except Exception as e:
        print(f"Error reading {stock_csv}: {e}")
        return
    
    if len(df) < lookback + 50:
        print(f"Skipping {symbol} due to insufficient data ({len(df)} rows).")
        return

    # Add technical indicators
    df = add_technical_indicators(df)
    
    # Features: Close, Volume, RSI, SMA, MACD, MACD_SIGNAL, BB_HIGH, BB_LOW
    features = ['Close', 'Volume', 'RSI', 'SMA', 'MACD', 'MACD_SIGNAL', 'BB_HIGH', 'BB_LOW']
    
    # Check if all columns exist
    if not all(col in df.columns for col in features):
        print(f"Missing columns for {symbol}. Skipping.")
        return

    data = df[features].values
    
    # Scale all features
    scaler = MinMaxScaler(feature_range=(0,1))
    scaled_data = scaler.fit_transform(data)
    
    # Create sequences
    X, y = [], []
    for i in range(lookback, len(scaled_data)):
        X.append(scaled_data[i-lookback:i])
        # Predict only 'Close' which is at index 0
        y.append(scaled_data[i, 0]) 
        
    X, y = np.array(X), np.array(y)
    
    if len(X) == 0:
        print(f"Not enough data after lookback for {symbol}")
        return

    # Input shape: (lookback, 8)
    model = create_lstm_model((X.shape[1], X.shape[2]))
    
    # Add early stopping to prevent overfitting
    early_stop = EarlyStopping(monitor='loss', patience=10, restore_best_weights=True)
    
    print(f"Training {symbol} LSTM model with shape {X.shape}...")
    # verbose=1 to see progress if needed, using 0 for clean output
    model.fit(X, y, epochs=epochs, batch_size=batch_size, callbacks=[early_stop], verbose=0)
    
    # Save model and scaler
    model.save(os.path.join(MODEL_PATH, f"{symbol}.keras"))
    joblib.dump(scaler, os.path.join(MODEL_PATH, f"{symbol}_scaler.pkl"))
    print(f"✅ Successfully trained and saved {symbol} model.")

if __name__ == "__main__":
    # Train all KMI30 stocks
    print(f"Searching for data in {DATA_PATH}")
    files = [f for f in os.listdir(DATA_PATH) if f.endswith(".csv")]
    print(f"Found {len(files)} stock files. Starting training...")

    for stock_file in files:
        train_stock(os.path.join(DATA_PATH, stock_file))

    print("All models trained successfully!")
