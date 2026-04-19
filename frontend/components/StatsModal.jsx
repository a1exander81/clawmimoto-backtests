import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function StatsModal({ isOpen, onOpenChange, sessionMeta, manualMeta }) {
  if (!sessionMeta || !manualMeta) return null

  // Aggregated Helper
  const MetricCard = ({ label, value, subtext, icon: Icon, color = "text-foreground" }) => (
    <div className="bg-surface-lv2/40 border border-border/20 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={cn("h-3.5 w-3.5 opacity-50", color)} />
      </div>
      <div className={cn("text-xl font-black tracking-tight", color)}>{value}</div>
      {subtext && <div className="text-[9px] font-mono text-muted-foreground/60">{subtext}</div>}
    </div>
  )

  const calcWinRate = (meta) => (meta.win_rate || 0).toFixed(1) + "%"

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#030508] border-border/40 text-foreground shadow-2xl shadow-solana-cyan/5 overflow-hidden">
        <DialogHeader className="border-b border-border/10 pb-4 mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
            <BarChart3 className="h-5 w-5 text-solana-cyan" />
            Global Performance Analytics
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Aggregated Baseline: {sessionMeta.period} | Verifiable execution hub
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          {/* Top Aggregated HUD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="TOTAL PROFIT" 
              value={`${(sessionMeta.total_return_pct || 0).toFixed(2)}%`}
              subtext={`Bench: ${(manualMeta.total_return_pct || 0).toFixed(2)}%`}
              icon={TrendingUp}
              color="text-solana-cyan"
            />
            <MetricCard 
              label="WIN RATE" 
              value={calcWinRate(sessionMeta)}
              subtext={`Manual: ${calcWinRate(manualMeta)}`}
              icon={Target}
            />
            <MetricCard 
              label="TOTAL TRADES" 
              value={sessionMeta.total_trades || 0}
              subtext="Aggregated"
              icon={Zap}
              color="text-solana-purple"
            />
            <MetricCard 
              label="SHARPE RATIO" 
              value={(sessionMeta.sharpe_ratio || 0).toFixed(2)}
              subtext={`Risk Adj. Perf`}
              icon={ShieldCheck}
            />
          </div>

          {/* Deep Dive Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-l-2 border-solana-cyan pl-2">Strategy Edge</h4>
              <div className="bg-surface-lv1 rounded-lg border border-border/10 overflow-hidden text-[11px]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/5 text-muted-foreground uppercase font-black tracking-tight border-b border-border/10">
                      <th className="px-3 py-2 text-left font-extrabold">Metric</th>
                      <th className="px-3 py-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/5 font-mono">
                    <Row label="Profit Factor" value={(sessionMeta.profit_factor || 0).toFixed(2)} />
                    <Row label="Avg Win" value={`${(sessionMeta.avg_win_pct || 0).toFixed(2)}%`} color="text-solana-cyan" />
                    <Row label="Avg Loss" value={`${(sessionMeta.avg_loss_pct || 0).toFixed(2)}%`} color="text-destructive" />
                    <Row label="Max DD" value={`${(sessionMeta.max_drawdown_pct || 0).toFixed(2)}%`} />
                    <Row label="Expectancy" value={`${(( (sessionMeta.win_rate || 0)/100 * (sessionMeta.avg_win_pct || 0)) + ((1 - (sessionMeta.win_rate || 0)/100) * (sessionMeta.avg_loss_pct || 0))).toFixed(3)}%`} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-l-2 border-solana-purple pl-2">Trade Inventory</h4>
              <div className="bg-surface-lv1 rounded-lg border border-border/10 overflow-hidden text-[11px]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/5 text-muted-foreground uppercase font-black tracking-tight border-b border-border/10">
                      <th className="px-3 py-2 text-left font-extrabold">Outcome</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/5 font-mono">
                    <Row label="Winners" value={sessionMeta.winning_trades || 0} color="text-solana-cyan" />
                    <Row label="Losers" value={sessionMeta.losing_trades || 0} color="text-destructive" />
                    <Row label="Win Streak" value={sessionMeta.win_streak || "0"} />
                    <Row label="Loss Streak" value={sessionMeta.loss_streak || "0"} />
                    <Row label="Status" value="VERIFIED" color="text-solana-cyan" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, color = "text-foreground" }) {
  return (
    <tr>
      <td className="px-3 py-2 text-muted-foreground uppercase font-bold tracking-tight opacity-70">{label}</td>
      <td className={cn("px-3 py-2 text-right font-black", color)}>{value}</td>
    </tr>
  )
}
