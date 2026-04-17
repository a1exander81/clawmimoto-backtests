from freqtrade.strategy import IStrategy, IntParameter
import talib.abstract as ta
import pandas as pd

class Claw5MSniper(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = "5m"
    stoploss = -0.30
    trailing_stop = True
    trailing_stop_positive = 0.50
    minimal_roi = {"0": 1.00}
    order_types = {"entry":"market","exit":"market","stoploss":"market"}
    SESSION_ENABLED = True
    buy_rsi = IntParameter(25,40,default=30,space="buy")
    sell_rsi = IntParameter(60,80,default=70,space="sell")
    ema_short = IntParameter(5,20,default=9,space="buy")
    ema_long = IntParameter(20,50,default=21,space="buy")

    def populate_indicators(self, dataframe, metadata):
        dataframe["ema_short"] = ta.EMA(dataframe, timeperiod=self.ema_short.value)
        dataframe["ema_long"] = ta.EMA(dataframe, timeperiod=self.ema_long.value)
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["volume_ma"] = ta.SMA(dataframe["volume"], timeperiod=20)
        dataframe["volume_ratio"] = dataframe["volume"] / dataframe["volume_ma"]
        return dataframe

    def populate_buy_trend(self, dataframe, metadata):
        dataframe["buy"] = 0
        if self.SESSION_ENABLED:
            sgt_hour = (dataframe["date"].dt.hour + 8) % 24
            sgt_minute = dataframe["date"].dt.minute
            ny_open = ((sgt_hour==21)&(sgt_minute>=30))|(sgt_hour==22)
tokyo_open = ((sgt_hour==8)&(sgt_minute<=15))|((sgt_hour==11)&(sgt_minute>=30)&(sgt_minute<=45))
            london_open = (sgt_hour==16)&(sgt_minute<=15)
            session_cond = ny_open | tokyo_open | london_open
        else:
            session_cond = True
        buy_cond = (
            (dataframe["ema_short"] > dataframe["ema_long"]) &
            (dataframe["rsi"] < self.buy_rsi.value) &
            (dataframe["volume_ratio"] > 1.5) &
            session_cond
        )
        dataframe.loc[buy_cond, "buy"] = 1
        return dataframe

    def populate_sell_trend(self, dataframe, metadata):
        dataframe["sell"] = 0
        sell_cond = (dataframe["rsi"] > self.sell_rsi.value) | (dataframe["ema_short"] < dataframe["ema_long"])
        dataframe.loc[sell_cond, "sell"] = 1
        return dataframe
