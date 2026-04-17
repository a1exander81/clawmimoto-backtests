"""
Claw5MSniper — Session mode (market open scalper)

Trades only during NY, Tokyo, and London opens (3 trades/day max).
5-minute timeframe. Isolated margin, 1-2% risk, 50-100% RRR.
"""

from freqtrade.strategy import IStrategy, IntParameter, DecimalParameter
import talib.abstract as ta
import pandas as pd


class Claw5MSniper(IStrategy):
    """
    Freqtrade strategy for 5M scalping with session filters.
    Compatible with Freqtrade backtesting & hyperopt.
    """

    # Strategy interface
    INTERFACE_VERSION = 3

    # Timeframe
    timeframe = "5m"
    can_short = False
    use_exit_signal = True
    stoploss = -0.30  # -30% max loss (hard stop)
    trailing_stop = True
    trailing_stop_positive = 0.50  # Start trailing when +50% achieved
    trailing_stop_positive_offset = 0.0
    trailing_only_offset_is_reached = True

    # Minimal ROI table
    minimal_roi = {
        "0": 1.00,      # 100% target (will trail)
    }

    # Order types
    order_types = {
        "entry": "market",
        "exit": "market",
        "stoploss": "market",
        "stoploss_on_exchange": True,
    }

    # Session filters — trade only during market opens
    # SGT times: NY 21:30, Tokyo 08:00 & 11:30, London 16:00
    # These are checked in populate_buy_trend()
    SESSION_ENABLED = True

    # Indicator parameters (optimized for 5M scalping)
    buy_rsi = IntParameter(25, 40, default=30, space="buy")
    sell_rsi = IntParameter(60, 80, default=70, space="sell")
    ema_short = IntParameter(5, 20, default=9, space="buy")
    ema_long = IntParameter(20, 50, default=21, space="buy")

    # Protection
    use_stop_protection = True
    stoploss_protection = DecimalParameter(-0.05, -0.01, default=-0.03, space="protection")

    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Add technical indicators."""
        # EMAs
        dataframe["ema_short"] = ta.EMA(dataframe, timeperiod=self.ema_short.value)
        dataframe["ema_long"] = ta.EMA(dataframe, timeperiod=self.ema_long.value)

        # RSI
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)

        # Volume spike detection
        dataframe["volume_ma"] = ta.SMA(dataframe["volume"], timeperiod=20)
        dataframe["volume_ratio"] = dataframe["volume"] / dataframe["volume_ma"]

        # ATR for dynamic SL
        dataframe["atr"] = ta.ATR(dataframe, timeperiod=14)

        return dataframe

    def populate_buy_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Generate buy signals — session-filtered."""
        dataframe["buy"] = 0

        # Session filter (if enabled)
        if self.SESSION_ENABLED:
            # Convert timestamp to SGT (UTC+8)
            sgt_hour = (dataframe["date"].dt.hour + 8) % 24
            sgt_minute = dataframe["date"].dt.minute

            # NY open: 21:30 SGT (09:30 EST = 21:30 SGT)
            ny_open = ((sgt_hour == 21) & (sgt_minute >= 30)) | (sgt_hour == 22)
            # Tokyo open: 08:00–08:15 and 11:30–11:45
            tokyo_open = ((sgt_hour == 8) & (sgt_minute <= 15)) | ((sgt_hour == 11) & (sgt_minute >= 30) & (sgt_minute <= 45))
            # London open: 16:00–16:15
            london_open = (sgt_hour == 16) & (sgt_minute <= 15)

            session_cond = ny_open | tokyo_open | london_open
        else:
            session_cond = True

        # Trading logic
        buy_cond = (
            (dataframe["ema_short"] > dataframe["ema_long"]) &
            (dataframe["rsi"] < self.buy_rsi.value) &
            (dataframe["volume_ratio"] > 1.5) &  # Volume spike
            session_cond
        )

        dataframe.loc[buy_cond, "buy"] = 1
        return dataframe

    def populate_sell_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Generate sell signals."""
        dataframe["sell"] = 0

        sell_cond = (
            (dataframe["rsi"] > self.sell_rsi.value) |
            (dataframe["ema_short"] < dataframe["ema_long"])
        )

        dataframe.loc[sell_cond, "sell"] = 1
        return dataframe

    # Custom exit for trailing
    def custom_stoploss(self, pair: str, trade: 'Trade', current_time: datetime, current_rate: float, current_profit: float, **kwargs):
        """Dynamic stoploss: move to breakeven at +50%."""
        if current_profit >= 0.50:
            return -0.01  # 1% below entry (effectively breakeven + fees)
        return self.stoploss
