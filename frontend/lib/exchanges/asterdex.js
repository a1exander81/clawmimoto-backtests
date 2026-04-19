const ASTERDEX_BASE_URL = "https://fapi.asterdex.com/fapi/v1"

export async function getAsterDEXTicker(symbol = "") {
  try {
    const s = symbol.replace(/-/g, '')
    const url = `${ASTERDEX_BASE_URL}/ticker/price${s ? `?symbol=${s}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`AsterDEX Status: ${response.status}`)
    const data = await response.json()
    
    if (Array.isArray(data)) {
      return data.map(t => ({
        symbol: t.symbol.replace('USDT', '-USDT'),
        price: t.price
      }))
    }
    return [{
      symbol: data.symbol.replace('USDT', '-USDT'),
      price: data.price
    }]
  } catch (error) {
    console.error("AsterDEX Ticker Error:", error)
    return null
  }
}

export async function getAsterDEXKlines(symbol, startTime, endTime, interval = '1m') {
  try {
    const s = symbol.replace(/-/g, '')
    // AsterDEX FAPI structure is identical to Binance
    const url = `${ASTERDEX_BASE_URL}/klines?symbol=${s}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`AsterDEX Klines Status: ${response.status}`)
    const data = await response.json()
    
    if (data && data[0]) {
      const [openTime, open, high, low, close, volume] = data[0]
      return { open, high, low, close, volume, openTime }
    }
    return null
  } catch (error) {
    console.error("AsterDEX Klines Error:", error)
    return null
  }
}
