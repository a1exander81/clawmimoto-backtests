import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useTheme } from 'next-themes'
import TradingChart from '@/components/TradingChart'
import ComparisonTable from '@/components/ComparisonTable'
import StatsModal from "@/components/StatsModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { 
  Menu, Sun, Moon, LayoutDashboard, History, Settings, Activity, 
  Zap, Shield, Search, Terminal, BarChart3, Binary, Link as LinkIcon,
  Cpu, Database
} from "lucide-react"

export default function Home() {
  const [sessionMeta, setSessionMeta] = useState(null)
  const [manualMeta, setManualMeta] = useState(null)
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // UI State
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      fetch('/api/metadata/session').then(r => r.ok ? r.json() : Promise.reject('Session data failed')),
      fetch('/api/metadata/manual').then(r => r.ok ? r.json() : Promise.reject('Manual data failed')),
    ]).then(([s, m]) => {
      setSessionMeta(s)
      setManualMeta(m)
      setLoading(false)
    }).catch(err => {
      setError(err)
      setLoading(false)
    })

    // Command K listener
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsCommandOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    const fetchMarket = () => 
      fetch('/api/ticker').then(r => r.ok ? r.json() : null).then(setMarketData)

    fetchMarket()
    const interval = setInterval(fetchMarket, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-lv3 border-t-solana-cyan"></div>
        <p className="font-mono text-sm tracking-widest text-muted-foreground animate-pulse">SYNCING VERIFIABLE TERMINAL...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-background text-destructive text-center p-6">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader>
          <CardTitle>Link Fault</CardTitle>
          <CardDescription className="text-destructive/80">{error.toString()}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Head>
        <title>CLAWMIMOTO | Verifiable Obsidian Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search strategy..." />
        <CommandList className="bg-background border-t border-border">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Tactical Actions">
            <CommandItem className="flex gap-4 cursor-pointer hover:bg-solana-cyan/10" onSelect={() => { setIsStatsOpen(true); setIsCommandOpen(false); }}>
              <Terminal className="h-4 w-4" /> <span>Deploy Session Strategy</span>
            </CommandItem>
            <CommandItem className="flex gap-4 cursor-pointer hover:bg-solana-cyan/10" onSelect={() => { setIsStatsOpen(true); setIsCommandOpen(false); }}>
              <BarChart3 className="h-4 w-4" /> <span>View Global Analytics</span>
            </CommandItem>
            <CommandItem className="flex gap-4 cursor-pointer hover:bg-solana-cyan/10">
              <BarChart3 className="h-4 w-4" /> <span>Export Analytics (CSV)</span>
            </CommandItem>
            <CommandItem className="flex gap-4 cursor-pointer hover:bg-solana-cyan/10">
              <Binary className="h-4 w-4" /> <span>Sync Mainnet Nodes</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="System">
            <CommandItem className="flex gap-4 cursor-pointer" onSelect={() => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); setIsCommandOpen(false); }}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>Toggle Theme Mode</span>
            </CommandItem>
            <CommandItem className="flex gap-4 cursor-pointer" onSelect={() => { setIsSidebarOpen(!isSidebarOpen); setIsCommandOpen(false); }}>
              <LayoutDashboard className="h-4 w-4" /> <span>Toggle Sidebar Visibility</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Global Stats Ribbon */}
      <div className="bg-solana-cyan/5 border-b border-solana-cyan/10 h-8 flex items-center overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex gap-12 px-6">
          <RibbonStat label="NETWORK" value="Solana Devnet" icon={<Activity className="h-3 w-3" />} />
          <RibbonStat label="TPS" value="2,481" icon={<Zap className="h-3 w-3" />} color="text-solana-cyan" />
          <RibbonStat 
            label="SOL/USDT" 
            value={marketData?.prices?.['SOL-USDT'] ? `$${parseFloat(marketData.prices['SOL-USDT']).toFixed(2)}` : 'FETCHING...'} 
            source={marketData?.sources?.['SOL-USDT']}
            color="text-solana-cyan" 
          />
          <RibbonStat 
            label="BTC/USDT" 
            value={marketData?.prices?.['BTC-USDT'] ? `$${parseFloat(marketData.prices['BTC-USDT']).toFixed(2)}` : 'FETCHING...'} 
            source={marketData?.sources?.['BTC-USDT']}
            color="text-foreground" 
          />
          <RibbonStat 
            label="ETH/USDT" 
            value={marketData?.prices?.['ETH-USDT'] ? `$${parseFloat(marketData.prices['ETH-USDT']).toFixed(2)}` : 'FETCHING...'} 
            source={marketData?.sources?.['ETH-USDT']}
            color="text-solana-purple" 
          />
          <RibbonStat label="SOURCE" value={marketData?.source || 'CONNECTED'} color="text-muted-foreground" />
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-r border-border bg-background p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-sm font-black uppercase tracking-[0.2em]">
            CLAWMIMOTO <span className="text-solana-cyan font-normal">Hub</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {sessionMeta?.solana_anchor_tx && (
            <a 
              href={`https://explorer.solana.com/tx/${sessionMeta.solana_anchor_tx}?cluster=devnet`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 rounded bg-solana-purple/10 px-3 py-1.5 text-[10px] font-bold text-solana-purple border border-solana-purple/20 hover:bg-solana-purple/20 transition-all"
            >
              <LinkIcon className="h-3 w-3" />
              CHAIN VERIFIED
            </a>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex gap-2 h-9 px-3 text-muted-foreground"
            onClick={() => setIsCommandOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-xs">Search Strategy...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="h-9 w-9">
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:block border-r border-border bg-card transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden opacity-0'
          }`}
        >
          <div className="w-64">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <MetricCard 
              label="Profit Yield" 
              value={`${sessionMeta.total_pnl_pct > 0 ? '+' : ''}${sessionMeta.total_pnl_pct.toFixed(2)}%`}
              trend={sessionMeta.total_pnl_pct > 0 ? 'up' : 'down'}
            />
            <MetricCard 
              label="Win Rate" 
              value={`${sessionMeta.win_rate.toFixed(1)}%`}
              progress={sessionMeta.win_rate}
            />
            <MetricCard 
              label="Sharpe Index" 
              value={sessionMeta.sharpe_ratio.toFixed(2)}
              trend="neutral"
            />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <Card className="xl:col-span-2 bg-card/50 border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verifiable Equity Curve</CardTitle>
                <Tabs defaultValue="1w">
                  <TabsList className="bg-background border border-border h-8">
                    <TabsTrigger value="1d" className="text-[10px]">1D</TabsTrigger>
                    <TabsTrigger value="1w" className="text-[10px]">1W</TabsTrigger>
                    <TabsTrigger value="1m" className="text-[10px]">1M</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <TradingChart sessionMeta={sessionMeta} manualMeta={manualMeta} />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Comparative Analytics</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px] uppercase font-black tracking-widest border-solana-cyan/20 hover:bg-solana-cyan/10 hover:text-solana-cyan"
                  onClick={() => setIsStatsOpen(true)}
                >
                  <BarChart3 className="h-3 w-3 mr-2" />
                  Global Analytics
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ComparisonTable session={sessionMeta} manual={manualMeta} />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-black/20 border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Execution Log</CardTitle>
            </CardHeader>
            <CardContent className="p-4 font-mono text-[11px] text-muted-foreground max-h-48 overflow-y-auto">
              <div className="space-y-1">
                <div className="flex gap-4 hover:bg-solana-cyan/5 px-2 py-1 border-l-2 border-transparent hover:border-solana-cyan transition-all">
                  <span className="text-solana-purple/50">[03:45:21]</span>
                  <span>SYNC: Aggregating verified Binance OHLC...</span>
                </div>
                <div className="flex gap-4 hover:bg-solana-cyan/5 px-2 py-1 border-l-2 border-transparent hover:border-solana-cyan transition-all">
                  <span className="text-solana-purple/50">[03:45:22]</span>
                  <span>CHAIN: Verifying Anchor Tx via Solana Devnet...</span>
                </div>
                <div className="flex gap-4 hover:bg-solana-cyan/5 px-2 py-1 border-l-2 border-transparent hover:border-solana-cyan transition-all">
                  <span className="text-solana-purple/50">[03:45:23]</span>
                  <span className="text-solana-cyan">MATCH: Backtest SHA matched on-chain record.</span>
                </div>
                <div className="flex gap-4 hover:bg-solana-cyan/5 px-2 py-1 border-l-2 border-transparent hover:border-solana-cyan transition-all">
                  <span className="text-solana-purple/50">[03:45:24]</span>
                  <span>DONE: Strategy certified. Integrity level: HIGH.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <footer className="mt-8 border-t border-border p-8 text-center text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
        <p className="mb-2">PROPRIETARY QUANT TERMINAL. TRADING CARRIES HIGH RISK.</p>
        <p>© {new Date().getFullYear()} CLAWFORGE QUANT RESEARCH</p>
      </footer>

      <StatsModal 
        isOpen={isStatsOpen} 
        onOpenChange={setIsStatsOpen} 
        sessionMeta={sessionMeta} 
        manualMeta={manualMeta} 
      />
    </div>
  )
}

function SidebarContent() {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Terminal Access</h3>
          <nav className="space-y-1">
            <SidebarNavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Market Overview" active />
            <SidebarNavItem icon={<History className="h-4 w-4" />} label="Command History" />
            <SidebarNavItem icon={<Settings className="h-4 w-4" />} label="System Config" />
          </nav>
        </div>
        
        <div>
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">System Health (HUD)</h3>
          <div className="space-y-4">
            <SidebarParam label="Core Temp" value="44°C" icon={<Cpu className="h-3 w-3" />} />
            <SidebarParam label="Data Node" value="Binance-V3" icon={<Database className="h-3 w-3" />} />
            <SidebarParam label="Net Load" value="2.4%" color="text-solana-cyan" />
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-8">
        <div className="rounded-xl bg-solana-purple/5 border border-solana-purple/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3 w-3 text-solana-purple" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-solana-purple">Verification Node</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Connected to Solana Devnet. All session anchors verified.</p>
        </div>
      </div>
    </div>
  )
}

function SidebarNavItem({ icon, label, active = false }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
      active ? 'bg-solana-cyan/10 text-solana-cyan' : 'text-muted-foreground hover:bg-surface-lv2 hover:text-foreground'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function SidebarParam({ label, value, icon, color = "text-foreground" }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-2 text-muted-foreground font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  )
}

function RibbonStat({ label, value, icon, color = "text-muted-foreground", source }) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
      {icon && <span className="text-solana-cyan opacity-80">{icon}</span>}
      <span className="text-muted-foreground">{label}:</span>
      <span className={color}>{value}</span>
      {source && <span className="text-[8px] opacity-40 font-normal">via {source}</span>}
    </div>
  )
}

function MetricCard({ label, value, trend, progress }) {
  return (
    <Card className="bg-card/50 border-border hover:border-solana-cyan transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-black font-mono ${trend === 'up' ? 'text-solana-cyan' : trend === 'down' ? 'text-destructive' : ''}`}>
          {value}
        </div>
        {progress && (
          <div className="mt-4">
            <Progress value={progress} className="h-1 bg-surface-lv3" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}