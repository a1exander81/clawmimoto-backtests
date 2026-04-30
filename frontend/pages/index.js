import { useState, useEffect } from 'react'
import Head from 'next/head'

const SUPABASE_URL = 'https://aauypnqsmyxzacchbiya.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdXlwbnFzbXl4emFjY2hiaXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Nzg2MDUsImV4cCI6MjA5MjU1NDYwNX0.H8RbnYbUb55jr0RnOVpca2wkYgv_jKs8NuUHjruqWls'

async function fetchTrades(){
  const r=await fetch(SUPABASE_URL+'/rest/v1/trades?is_open=eq.false&order=close_date.desc&limit=500',{
    headers:{apikey:SUPABASE_ANON,Authorization:'Bearer '+SUPABASE_ANON}
  })
  if(!r.ok)return []
  return r.json()
}

const C={bg:'#080B12',card:'rgba(255,255,255,0.03)',border:'rgba(255,255,255,0.07)',text:'#E8EAF0',muted:'#6B7280',teal:'#00D4AA',red:'#FF4D4D',gold:'#F59E0B',blue:'#3B82F6',purple:'#8B5CF6'}
const fmt=(n,d=2)=>n==null?'—':Number(n).toFixed(d)
const fmtDate=s=>s?s.slice(0,16).replace('T',' '):'—'

function StatCard({label,value,sub,color=C.teal,icon}){
  return <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'1.25rem 1.5rem',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,'+color+',transparent)'}}/>
    <div style={{fontSize:'0.7rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>{icon} {label}</div>
    <div style={{fontSize:'1.6rem',fontWeight:800,color,fontFamily:'JetBrains Mono,monospace',lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:'0.72rem',color:C.muted,marginTop:6}}>{sub}</div>}
  </div>
}

function NavBar({active,setActive}){
  const tabs=['Overview','History','Analytics','Strategy']
  const [sc,setSc]=useState(false)
  useEffect(()=>{const h=()=>setSc(window.scrollY>20);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h)},[]) 
  return <nav style={{position:'sticky',top:0,zIndex:100,background:sc?'rgba(8,11,18,0.95)':'rgba(8,11,18,0.7)',backdropFilter:'blur(20px)',borderBottom:'1px solid '+(sc?C.border:'transparent'),transition:'all 0.3s',padding:'0 1.5rem'}}>
    <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',height:56}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginRight:'auto'}}>
        <span style={{fontSize:'1.2rem'}}>🦞</span>
        <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:C.teal,fontSize:'0.9rem'}}>CLAWMIMOTO</span>
        <span style={{fontSize:'0.6rem',background:'rgba(0,212,170,0.15)',color:C.teal,padding:'2px 6px',borderRadius:4,border:'1px solid rgba(0,212,170,0.3)'}}>DRY RUN</span>
      </div>
      <div style={{display:'flex',gap:4}}>
        {tabs.map(t=><button key={t} onClick={()=>setActive(t)} style={{background:active===t?'rgba(0,212,170,0.12)':'transparent',border:'1px solid '+(active===t?'rgba(0,212,170,0.3)':'transparent'),color:active===t?C.teal:C.muted,padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:'0.82rem',fontWeight:active===t?600:400}}>{t}</button>)}
      </div>
    </div>
  </nav>
}

function TradeRow({t}){
  const pct=(t.profit_ratio||0)*100
  const won=pct>0
  const pair=(t.pair||'').split('/')[0]
  const dur=t.open_date&&t.close_date?Math.round((new Date(t.close_date)-new Date(t.open_date))/60000):null
  return <div style={{display:'grid',gridTemplateColumns:'1.8fr 0.8fr 0.8fr 0.6fr 0.7fr 1fr 1.4fr',gap:8,padding:'0.7rem 1rem',borderBottom:'1px solid '+C.border,alignItems:'center'}}
    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
    <div><span style={{fontWeight:700,color:C.text,fontFamily:'JetBrains Mono,monospace'}}>{pair}</span>
      <span style={{marginLeft:6,fontSize:'0.65rem',padding:'2px 5px',borderRadius:4,background:t.direction==='LONG'?'rgba(0,212,170,0.15)':'rgba(255,77,77,0.15)',color:t.direction==='LONG'?C.teal:C.red}}>{t.direction||'LONG'}</span>
    </div>
    <div style={{fontSize:'0.75rem',color:C.muted}}>{t.session||'—'}</div>
    <div style={{fontFamily:'JetBrains Mono,monospace',color:won?C.teal:C.red,fontWeight:700,fontSize:'0.85rem'}}>{won?'+':''}{fmt(pct)}%</div>
    <div style={{fontSize:'0.75rem',color:C.muted}}>{t.leverage||20}x</div>
    <div style={{fontSize:'0.72rem',color:C.muted}}>{dur!=null?dur+'m':'—'}</div>
    <div style={{fontSize:'0.72rem',color:C.muted}}>{(t.exit_reason||'').replace(/_/g,' ')}</div>
    <div style={{fontSize:'0.7rem',color:C.muted,fontFamily:'JetBrains Mono,monospace'}}>{fmtDate(t.close_date)}</div>
  </div>
}

export default function Dashboard(){
  const [active,setActive]=useState('Overview')
  const [trades,setTrades]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [filter,setFilter]=useState('all')
  const [sort,setSort]=useState('date')
  const [dateFrom,setDateFrom]=useState('')
  const [dateTo,setDateTo]=useState('')
  const [page,setPage]=useState(0)
  const PER=20
  useEffect(()=>{fetchTrades().then(d=>{setTrades(d);setLoading(false)})},[]) 

  const closed=trades.filter(t=>!t.is_open)
  const wins=closed.filter(t=>(t.profit_ratio||0)>0)
  const losses=closed.filter(t=>(t.profit_ratio||0)<=0)
  const wr=closed.length?wins.length/closed.length*100:0
  const tpnl=closed.reduce((s,t)=>s+(t.profit_ratio||0)*100,0)
  const tabs=closed.reduce((s,t)=>s+(t.profit_abs||0),0)
  const aw=wins.length?wins.reduce((s,t)=>s+(t.profit_ratio||0)*100,0)/wins.length:0
  const mxw=closed.length?Math.max(...closed.map(t=>(t.profit_ratio||0)*100)):0
  const mxl=closed.length?Math.min(...closed.map(t=>(t.profit_ratio||0)*100)):0
  const durs=closed.filter(t=>t.open_date&&t.close_date).map(t=>Math.round((new Date(t.close_date)-new Date(t.open_date))/60000))
  const avgDur=durs.length?Math.round(durs.reduce((a,b)=>a+b,0)/durs.length):0

  const eq=closed.slice().reverse().reduce((acc,t)=>{const p=acc.length?acc[acc.length-1].v:10000;acc.push({v:p+(t.profit_abs||0)});return acc},[])

  let filt=[...closed]
  if(filter==='wins')filt=filt.filter(t=>(t.profit_ratio||0)>0)
  if(filter==='losses')filt=filt.filter(t=>(t.profit_ratio||0)<=0)
  if(filter==='fast')filt=filt.filter(t=>t.open_date&&t.close_date&&(new Date(t.close_date)-new Date(t.open_date))/60000<=5)
  if(search){const s=search.toLowerCase();filt=filt.filter(t=>(t.pair||'').toLowerCase().includes(s)||(t.close_date||'').includes(s)||(t.open_date||'').includes(s)||(t.session||'').toLowerCase().includes(s)||(t.exit_reason||'').toLowerCase().includes(s))}
  if(dateFrom)filt=filt.filter(t=>t.close_date&&t.close_date>=dateFrom)
  if(dateTo)filt=filt.filter(t=>t.close_date&&t.close_date<=dateTo+'T23:59:59')
  if(sort==='pnl')filt.sort((a,b)=>(b.profit_ratio||0)-(a.profit_ratio||0))
  else if(sort==='dur')filt.sort((a,b)=>{const da=a.open_date&&a.close_date?new Date(a.close_date)-new Date(a.open_date):0;const db=b.open_date&&b.close_date?new Date(b.close_date)-new Date(b.open_date):0;return da-db})
  else filt.sort((a,b)=>(b.close_date||'').localeCompare(a.close_date||''))
  const paged=filt.slice(page*PER,(page+1)*PER)
  const totalP=Math.ceil(filt.length/PER)

  const byPair={}
  closed.forEach(t=>{const p=(t.pair||'').split('/')[0];if(!byPair[p])byPair[p]={n:0,w:0,pnl:0};byPair[p].n++;if((t.profit_ratio||0)>0)byPair[p].w++;byPair[p].pnl+=(t.profit_ratio||0)*100})
  const bySession={}
  closed.forEach(t=>{const s=t.session||'manual';if(!bySession[s])bySession[s]={n:0,w:0,pnl:0};bySession[s].n++;if((t.profit_ratio||0)>0)bySession[s].w++;bySession[s].pnl+=(t.profit_ratio||0)*100})

  const EqChart=()=>{
    if(eq.length<2)return null
    const vals=eq.map(e=>e.v),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1
    const W=600,H=100
    const pts=eq.map((e,i)=>((i/(eq.length-1))*W)+','+(H-((e.v-min)/range)*(H-8)-4)).join(' ')
    const col=vals[vals.length-1]>=vals[0]?C.teal:C.red
    return <svg viewBox={'0 0 '+W+' '+H} style={{width:'100%',height:100}}>
      <defs><linearGradient id='eg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor={col} stopOpacity='0.25'/><stop offset='100%' stopColor={col} stopOpacity='0'/></linearGradient></defs>
      <polygon points={'0,'+H+' '+pts+' '+W+','+H} fill='url(#eg)'/>
      <polyline points={pts} fill='none' stroke={col} strokeWidth='2'/>
    </svg>
  }

  const inp={background:'rgba(255,255,255,0.04)',border:'1px solid '+C.border,borderRadius:8,color:C.text,padding:'8px 12px',fontSize:'0.82rem',outline:'none',fontFamily:'inherit'}
  const btn=(active)=>({background:active?'rgba(0,212,170,0.12)':'transparent',border:'1px solid '+(active?'rgba(0,212,170,0.3)':C.border),color:active?C.teal:C.muted,borderRadius:8,padding:'5px 12px',cursor:'pointer',fontSize:'0.78rem'})

  return <>
    <Head>
      <title>Clawmimoto — Live Dashboard</title>
      <link rel='preconnect' href='https://fonts.googleapis.com'/>
      <link href='https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Syne:wght@400;600;800&display=swap' rel='stylesheet'/>
      <meta name='viewport' content='width=device-width,initial-scale=1'/>
    </Head>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#080B12;color:#E8EAF0;font-family:'Syne',sans-serif;min-height:100vh}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}input,button,select{font-family:inherit}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi 0.4s ease forwards}`}</style>
    <NavBar active={active} setActive={setActive}/>
    <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem'}}>
      <div style={{marginBottom:'2.5rem'}} className='fi'>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:C.teal,animation:'pulse 2s infinite',boxShadow:'0 0 12px '+C.teal}}/>
          <span style={{fontSize:'0.72rem',color:C.teal,letterSpacing:'0.15em',textTransform:'uppercase'}}>Live · Bybit Perpetuals</span>
        </div>
        <h1 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,lineHeight:1.1}}>Trading Ledger</h1>
        <p style={{color:C.muted,fontSize:'0.88rem',marginTop:6}}>Claw5MHybrid · {closed.length} closed trades</p>
      </div>

      {active==='Overview'&&<div className='fi'>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:20}}>
          <StatCard icon='💰' label='Total P&L' value={(tpnl>=0?'+':'')+fmt(tpnl)+'%'} sub={'$'+fmt(tabs)+' abs'} color={tpnl>=0?C.teal:C.red}/>
          <StatCard icon='🎯' label='Win Rate' value={fmt(wr)+'%'} sub={wins.length+'W / '+losses.length+'L'} color={C.gold}/>
          <StatCard icon='🏆' label='Best Trade' value={'+'+fmt(mxw)+'%'} color={C.teal}/>
          <StatCard icon='📉' label='Worst Trade' value={fmt(mxl)+'%'} color={C.red}/>
          <StatCard icon='⚡' label='Avg Win' value={'+'+fmt(aw)+'%'} color={C.blue}/>
          <StatCard icon='⏱️' label='Avg Duration' value={avgDur+'m'} color={C.purple}/>
        </div>
        <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'1.5rem',marginBottom:20}}>
          <div style={{fontSize:'0.72rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>📈 Equity Curve</div>
          <EqChart/>
        </div>
        <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,overflow:'hidden'}}>
          <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid '+C.border,fontSize:'0.85rem',fontWeight:600}}>Recent Trades</div>
          {closed.slice(0,5).map((t,i)=><TradeRow key={i} t={t}/>)}
          <div style={{padding:'0.75rem',textAlign:'center'}}>
            <button onClick={()=>setActive('History')} style={{background:'transparent',border:'1px solid '+C.border,color:C.muted,padding:'6px 16px',borderRadius:8,cursor:'pointer',fontSize:'0.8rem'}}>View All →</button>
          </div>
        </div>
      </div>}

      {active==='History'&&<div className='fi'>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:10}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder='Search pair, date, session...' style={{...inp,flex:1,minWidth:180}}/>
          <input type='date' value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(0)}} style={inp}/>
          <input type='date' value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(0)}} style={inp}/>
          {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom('');setDateTo('')}} style={{background:'rgba(255,77,77,0.1)',border:'1px solid rgba(255,77,77,0.3)',color:C.red,borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:'0.78rem'}}>✕</button>}
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
          {['all','wins','losses','fast'].map(f=><button key={f} onClick={()=>{setFilter(f);setPage(0)}} style={btn(filter===f)}>{f}</button>)}
          <div style={{marginLeft:'auto',display:'flex',gap:4}}>
            {[['date','📅 Date'],['pnl','💰 P&L'],['dur','⏱️ Dur']].map(([s,l])=><button key={s} onClick={()=>setSort(s)} style={{...btn(sort===s),color:sort===s?C.blue:C.muted,border:'1px solid '+(sort===s?'rgba(59,130,246,0.3)':C.border),background:sort===s?'rgba(59,130,246,0.1)':'transparent'}}>{l}</button>)}
          </div>
        </div>
        <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1.8fr 0.8fr 0.8fr 0.6fr 0.7fr 1fr 1.4fr',gap:8,padding:'0.6rem 1rem',borderBottom:'1px solid '+C.border,fontSize:'0.65rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>
            <span>Pair</span><span>Session</span><span>P&L</span><span>Lev</span><span>Dur</span><span>Exit</span><span>Close Date</span>
          </div>
          {loading?<div style={{padding:'3rem',textAlign:'center',color:C.muted,animation:'pulse 1.5s infinite'}}>Loading...</div>:paged.length===0?<div style={{padding:'3rem',textAlign:'center',color:C.muted}}>No trades found</div>:paged.map((t,i)=><TradeRow key={i} t={t}/>)}
        </div>
        {totalP>1&&<div style={{display:'flex',justifyContent:'center',gap:6,marginTop:12,flexWrap:'wrap'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...btn(false),opacity:page===0?0.4:1}}>← Prev</button>
          {Array.from({length:Math.min(totalP,7)},(_,i)=>{const p=Math.max(0,Math.min(page-3,totalP-7))+i;return <button key={p} onClick={()=>setPage(p)} style={btn(p===page)}>{p+1}</button>})}
          <button onClick={()=>setPage(p=>Math.min(totalP-1,p+1))} disabled={page>=totalP-1} style={{...btn(false),opacity:page>=totalP-1?0.4:1}}>Next →</button>
        </div>}
        <div style={{textAlign:'center',color:C.muted,fontSize:'0.75rem',marginTop:8}}>{filt.length} trades · page {page+1} of {totalP||1}</div>
      </div>}

      {active==='Analytics'&&<div className='fi' style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'1.25rem'}}>
          <div style={{fontSize:'0.72rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>📊 By Pair</div>
          {Object.entries(byPair).sort((a,b)=>b[1].n-a[1].n).slice(0,6).map(([p,s])=><div key={p} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',marginBottom:4}}>
              <span style={{color:C.text,fontWeight:600}}>{p}</span>
              <span style={{color:s.pnl>=0?C.teal:C.red,fontFamily:'JetBrains Mono,monospace',fontSize:'0.78rem'}}>{s.pnl>=0?'+':''}{fmt(s.pnl)}%</span>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <div style={{flex:1,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                <div style={{width:(s.n?s.w/s.n*100:0)+'%',height:'100%',background:C.teal,borderRadius:2}}/>
              </div>
              <span style={{fontSize:'0.68rem',color:C.muted}}>{s.n}t</span>
            </div>
          </div>)}
        </div>
        <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'1.25rem'}}>
          <div style={{fontSize:'0.72rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>🕐 By Session</div>
          {Object.entries(bySession).map(([s,v])=><div key={s} style={{display:'flex',justifyContent:'space-between',padding:'0.6rem 0',borderBottom:'1px solid '+C.border,alignItems:'center'}}>
            <div>
              <div style={{fontSize:'0.82rem',color:C.text,textTransform:'capitalize'}}>{s.replace('_',' ')}</div>
              <div style={{fontSize:'0.68rem',color:C.muted}}>{v.n} trades · {v.n?Math.round(v.w/v.n*100):0}% WR</div>
            </div>
            <span style={{color:v.pnl>=0?C.teal:C.red,fontFamily:'JetBrains Mono,monospace',fontSize:'0.82rem',fontWeight:700}}>{v.pnl>=0?'+':''}{fmt(v.pnl)}%</span>
          </div>)}
        </div>
        <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'1.25rem',gridColumn:'1/-1'}}>
          <div style={{fontSize:'0.72rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>🚪 Exit Reasons</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {Object.entries(closed.reduce((acc,t)=>{const r=t.exit_reason||'unknown';acc[r]=(acc[r]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1]).map(([r,n])=><div key={r} style={{background:'rgba(255,255,255,0.04)',border:'1px solid '+C.border,borderRadius:8,padding:'4px 10px',fontSize:'0.75rem'}}><span style={{color:C.muted}}>{r.replace(/_/g,' ')} </span><span style={{color:C.teal,fontWeight:700}}>{n}</span></div>)}
          </div>
        </div>
      </div>}

      {active==='Strategy'&&<div className='fi'>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
          <StatCard icon='🏆' label='Best Trade' value={'+'+fmt(mxw)+'%'} color={C.teal}/>
          <StatCard icon='📉' label='Worst Trade' value={fmt(mxl)+'%'} color={C.red}/>
          <StatCard icon='📊' label='Total Trades' value={closed.length} color={C.text}/>
          <StatCard icon='🎯' label='Win Rate' value={fmt(wr)+'%'} color={C.gold}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[['Strategy','Claw5MHybrid'],['Exchange','Bybit Perpetuals'],['Timeframe','5M + 1H + 4H'],['Mode','Dry Run'],['Max Open Session','3 trades'],['Max Open Manual','Unlimited'],['Stop Loss','-2%'],['Trailing','0.5% lock @ 1.5%'],['Sessions','Pre-London · London · NY'],['Token','CLUSDT (BNB Chain)']].map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 0.8rem',background:'rgba(255,255,255,0.02)',borderRadius:8,fontSize:'0.8rem',border:'1px solid '+C.border}}><span style={{color:C.muted}}>{k}</span><span style={{color:C.text,fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem'}}>{v}</span></div>)}
        </div>
      </div>}

      <div style={{marginTop:'3rem',paddingTop:'1.5rem',borderTop:'1px solid '+C.border,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <span style={{fontSize:'0.72rem',color:C.muted}}>🦞 Built by RightClaw · Powered by OpenClaw</span>
        <span style={{fontSize:'0.72rem',color:C.muted,fontFamily:'JetBrains Mono,monospace'}}>{new Date().toISOString().slice(0,10)}</span>
      </div>
    </div>
  </>
}