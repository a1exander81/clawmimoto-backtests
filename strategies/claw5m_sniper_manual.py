"""
Claw5MSniperManual — No session filter (trades 24/7)

Same parameters as session version but no market-open restriction.
Used for baseline comparison.
"""

from freqtrade.strategy import IStrategy, IntParameter
import talib.abstract as ta
import pandas as pd
from datetime import datetime


class Claw5MSniperManual(IStrategy):
    """Manual mode — trades anytime, no session constraints."""

    INTERFACE_VERSION = 3
    timeframe = "5m"
    can_short = False
    use_exit_signal = True
    stoploss = -0.30
    trailing_stop = True
    trailing_stop_positive = 0.50
    trailing_stop_positive_offset = 0.0
    trailing_only_offset_is_reached = True

    minimal_roi = {"0": 1.00}
    order_types = {
        "entry": "market",
        "exit": "market",
        "stoploss": "market",
        "stoploss_on_exchange": True,
    }

    # Parameters
    buy_rsi = IntParameter(25, 40, default=30, space="buy")
    sell_rsi = IntParameter(60, 80, default=70, space="sell")
    ema_short = IntParameter(5, 20, default=9, space="buy")
    ema_long = IntParameter(20, 50, default=21, space="buy")

    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        dataframe["ema_short"] = ta.EMA(dataframe, timeperiod=self.ema_short.value)
        dataframe["ema_long"] = ta.EMA(dataframe, timeperiod=self.ema_long.value)
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["volume_ma"] = ta.SMA(dataframe["volume"], timeperiod=20)
        dataframe["volume_ratio"] = dataframe["volume"] / dataframe["volume_ma"]
        dataframe["atr"] = ta.ATR(dataframe, timeperiod=14)
        return dataframe

    def populate_buy_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Buy signals — no session filter."""
        dataframe["buy"] = 0
        buy_cond = (
            (dataframe["ema_short"] > dataframe["ema_long"]) &
            (dataframe["rsi"] < self.buy_rsi.value) &
            (dataframe["volume_ratio"] > 1.5)
        )
        dataframe.loc[buy_cond, "buy"] = 1
        return dataframe

    def populate_sell_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        dataframe["sell"] = 0
        sell_cond = (
            (dataframe["rsi"] > self.sell_rsi.value) |
            (dataframe["ema_short"] < dataframe["ema_long"])
        )
        dataframe.loc[sell_cond, "sell"] = 1
        return dataframe

    def custom_stoploss(self, pair: str, trade: 'Trade', current_time: datetime, current_rate: float, current_profit: float, **kwargs):
        if current_profit >= 0.50:
            return -0.01
        return self.stoploss
