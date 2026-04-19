function Error({ statusCode }) {
  return (
    <div className="min-h-screen bg-[#030508] flex items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-4xl font-black text-solana-cyan tracking-tighter uppercase">
          {statusCode ? `Error ${statusCode}` : 'Tactical Fault'}
        </h1>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest leading-relaxed">
          System integrity check failed. The environment might be out of sync. 
          Please reload the Obsidian Hub.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-solana-cyan/10 border border-solana-cyan/20 text-solana-cyan text-[10px] font-black uppercase tracking-widest hover:bg-solana-cyan/20 transition-all rounded"
        >
          Re-Initialize Connection
        </button>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
