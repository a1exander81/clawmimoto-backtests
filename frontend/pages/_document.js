import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head />
      <body className="antialiased selection:bg-solana-cyan/30">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
