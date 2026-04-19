const BINGX_BASE_URL = "https://open-api.bingx.com/openApi/spot/v1/ticker/price"

export async function getTickerPrice(symbol = "") {
  try {
    const url = symbol ? `${BINGX_BASE_URL}?symbol=${symbol}` : BINGX_BASE_URL
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`BingX API error: ${response.statusText}`)
    }
    const data = await response.json()
    return data.data // BingX returns { code: 0, msg: '', data: [...] }
  } catch (error) {
    console.error("Failed to fetch BingX ticker:", error)
    return null
  }
}
