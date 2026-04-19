import { verifyTradeExecution } from "@/lib/execution-verifier"

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'})
  
  try {
    const { trade } = req.body
    if (!trade) return res.status(400).json({error: 'Missing trade data'})

    const verification = await verifyTradeExecution(trade)
    res.status(200).json(verification)
  } catch (error) {
    console.error("Verification API error:", error)
    res.status(500).json({ error: error.message })
  }
}
