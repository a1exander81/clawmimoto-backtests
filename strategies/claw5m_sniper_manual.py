"""
Claw5MSniper — Manual Mode (no session restrictions)
Identical to Session mode but trades 24/7.
"""

from datetime import time, datetime, timezone
import pandas as pd
import pandas_ta as ta
from freqtrade.strategy import IStrategy, IntParameter, DecimalParameter, BooleanParameter
from freqtrade.persistence import Trade


class Claw5MSniperManual(IStrategy):
    """5-minute sniper — Manual mode (no time filter)."""

    INTERFACE_VERSION = 3
    timeframe = "5m"
    startup_candle_count = 50

    # ── Risk Management ──
    max_open_trades = 3
    stoploss = -0.25
    trailing_stop = True
    trailing_stop_positive = 0.5
    trailing_stop_positive_offset = 0.51
    trailing_only_offset_is_reached = True
    minimal_roi = {"0": 1.0}

    # ── Indicators ──
    rsi_enabled = BooleanParameter(default=True, space="buy")
    rsi_period = IntParameter(10, 30, default=14, space="buy")
    rsi_buy = IntParameter(20, 40, default=30, space="buy")
    rsi_sell = IntParameter(60, 80, default=70, space="sell")

    macd_enabled = BooleanParameter(default=True, space="buy")
    macd_fast = IntParameter(8, 20, default=12, space="buy")
    macd_slow = IntParameter(20, 40, default=26, space="buy")
    macd_signal = IntParameter(5, 15, default=9, space="buy")

    ema_fast = IntParameter(5, 20, default=10, space="buy")
    ema_slow = IntParameter(20, 50, default=30, space="buy")

    # ── StepFun Sentiment ──
    use_sentiment = BooleanParameter(default=False, space="buy")
    sentiment_threshold = DecimalParameter(0.6, 0.9, default=0.75, space="buy")

    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        df = dataframe.copy()

        if self.rsi_enabled.value:
            df["rsi"] = ta.rsi(df["close"], length=self.rsi_period.value)
        if self.macd_enabled.value:
            macd = ta.macd(df["close"], fast=self.macd_fast.value, slow=self.macd_slow.value, signal=self.macd_signal.value)
            df["macd"] = macd["MACD_12_26_9"]
            df["macd_signal"] = macd["MACDs_12_26_9"]
            df["macd_hist"] = macd["MACDh_12_26_9"]
        if self.ema_fast.value and self.ema_slow.value:
            df["ema_fast"] = ta.ema(df["close"], length=self.ema_fast.value)
            df["ema_slow"] = ta.ema(df["close"], length=self.ema_slow.value)

        # No session filter — Manual mode trades 24/7
        return df

    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        df = self.populate_indicators(dataframe, metadata)

        cond_rsi = df["rsi"] < self.rsi_buy.value if self.rsi_enabled.value else pd.Series([True] * len(df))
        cond_macd = (df["macd"] > df["macd_signal"]) if self.macd_enabled.value else pd.Series([True] * len(df))
        cond_ema = (df["ema_fast"] > df["ema_slow"]) if self.ema_fast.value and self.ema_slow.value else pd.Series([True] * len(df))

        # No session filter
        buy_cond = cond_rsi & cond_macd & cond_ema

        dataframe.loc[buy_cond, "enter_long"] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        df = self.populate_indicators(dataframe, metadata)

        cond_rsi = df["rsi"] > self.rsi_sell.value if self.rsi_enabled.value else pd.Series([True] * len(df))
        cond_macd = (df["macd"] < df["macd_signal"]) if self.macd_enabled.value else pd.Series([True] * len(df))
        cond_ema = (df["ema_fast"] < df["ema_slow"]) if self.ema_fast.value and self.ema_slow.value else pd.Series([True] * len(df))

        # No session filter
        sell_cond = cond_rsi | cond_macd | cond_ema

        dataframe.loc[sell_cond, "exit_long"] = 1
        return dataframe
