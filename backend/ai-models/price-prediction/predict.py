def predict_multi(symbol, days=7):
    import numpy as np
    import pandas as pd
    import os, joblib
    import ta
    from tensorflow.keras.models import load_model
    from datetime import timedelta

    BASE_PATH = os.path.dirname(os.path.abspath(__file__))
    DATA_PATH = os.path.join(BASE_PATH, "data")
    MODEL_PATH = os.path.join(BASE_PATH, "models")

    model_file = os.path.join(MODEL_PATH, f"{symbol}.keras")
    scaler_file = os.path.join(MODEL_PATH, f"{symbol}_scaler.pkl")
    data_file = os.path.join(DATA_PATH, f"{symbol}.csv")

    if not all(map(os.path.exists, [model_file, scaler_file, data_file])):
        raise FileNotFoundError(f"Model, scaler, or data file missing for {symbol}")

    # Load
    model = load_model(model_file)
    scaler = joblib.load(scaler_file)

    # Detect model feature count
    num_features = model.input_shape[-1]

    # Load latest data
    df = pd.read_csv(data_file, parse_dates=['Date'])
    if "Volume" not in df.columns:
        df["Volume"] = 0

    def calculate_indicators(input_df, feature_count):
        temp_df = input_df.copy()
        temp_df['Close'] = pd.to_numeric(temp_df['Close'], errors='coerce')
        
        # Basic 3 features
        temp_df['RSI'] = ta.momentum.rsi(temp_df['Close'], window=14)
        temp_df['SMA'] = ta.trend.sma_indicator(temp_df['Close'], window=20)
        
        if feature_count == 8:
            temp_df['Volume'] = pd.to_numeric(temp_df['Volume'], errors='coerce')
            macd = ta.trend.MACD(temp_df['Close'])
            temp_df['MACD'] = macd.macd()
            temp_df['MACD_SIGNAL'] = macd.macd_signal()
            bollinger = ta.volatility.BollingerBands(temp_df['Close'], window=20, window_dev=2)
            temp_df['BB_HIGH'] = bollinger.bollinger_hband()
            temp_df['BB_LOW'] = bollinger.bollinger_lband()
            flist = ['Close', 'Volume', 'RSI', 'SMA', 'MACD', 'MACD_SIGNAL', 'BB_HIGH', 'BB_LOW']
        else:
            flist = ['Close', 'RSI', 'SMA']
        
        temp_df.dropna(inplace=True)
        return temp_df, flist

    lookback = 60
    predictions = []
    working_df = df.copy() 
    last_date = df['Date'].iloc[-1]
    last_date = pd.to_datetime(last_date)

    for i in range(days):
        try:
            current_features_df, feature_list = calculate_indicators(working_df, num_features)
        except Exception:
            break 
        
        data_values = current_features_df[feature_list].values
        if len(data_values) < lookback:
            break

        scaled_data = scaler.transform(data_values)
        X_input = scaled_data[-lookback:].reshape(1, lookback, num_features)
        
        pred_scaled_close = model.predict(X_input, verbose=0)[0][0]
        
        placeholder = np.zeros((1, num_features))
        placeholder[0, 0] = pred_scaled_close
        pred_price = scaler.inverse_transform(placeholder)[0][0]
        
        last_date += timedelta(days=1)
        while last_date.weekday() >= 5:
             last_date += timedelta(days=1)

        predictions.append({
            "date": last_date.strftime("%Y-%m-%d"),
            "price": float(pred_price)
        })

        last_row = working_df.iloc[-1]
        new_row = {
            "Date": last_date,
            "Close": pred_price,
            "Volume": last_row["Volume"], 
            "Open": pred_price, "High": pred_price, "Low": pred_price, "Symbol": last_row.get("Symbol", symbol)
        }
        working_df = pd.concat([working_df, pd.DataFrame([new_row])], ignore_index=True)

    return predictions

if __name__ == "__main__":
    import sys, json
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No symbol provided"}))
        sys.exit(1)
    
    symbol = sys.argv[1]
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    try:
        preds = predict_multi(symbol, days)
        print(json.dumps(preds))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
