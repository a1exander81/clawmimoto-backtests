const OKX_BASE_URL = "https://www.okx.com/api/v5/market"

export async function getOKXTicker(symbol = "") {
  try {
    // Symbol format: BTC-USDT
    const url = `${OKX_BASE_URL}/tickers?instType=SPOT${symbol ? `&instId=${symbol}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`OKX Status: ${response.status}`)
    const data = await response.json()
    
    if (data && data.data) {
      return data.data.map(t => ({
        symbol: t.instId,
        price: t.last
      }))
    }
    return null
  } catch (error) {
    console.error("OKX Ticker Error:", error)
    return null
  }
}

export async function getOKXCandles(symbol, startTime, endTime, bar = '1m') {
  try {
    // OKX uses 'after' (timestamp) for pagination, but for specific range:
    const url = `${OKX_BASE_URL}/candles?instId=${symbol}&bar=${bar}&after=${endTime}&limit=1`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`OKX Candles Status: ${response.status}`)
    const data = await response.json()
    
    if (data && data.data && data.data[0]) {
      const [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm] = data.data[0]
      return { 
        open, high, low, close, 
        volume: vol, 
        openTime: parseInt(ts) 
      }
    }
    return null
  } catch (error) {
    console.error("OKX Candles Error:", error)
    return null
  }
}
