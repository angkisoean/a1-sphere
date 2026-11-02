/**
 * A1 Sphere — Pay-to-Read Alpha Market · Built on Unicity
 *
 * Wallet integration:
 *   • Real: autoConnect() → popup to sphere.unicity.network → ConnectClient
 *   • Demo: localStorage-backed mock wallet for localhost / public preview
 */

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import {
  Zap, Crown, Eye, Lock, Unlock, Upload, FileText, Flame,
  Wallet, Plus, BarChart3, BookOpen, DollarSign, ThumbsDown,
  Sparkles, TrendingUp, X, Tag, Check, AlertCircle, ChevronRight,
  Activity, Shield,
} from 'lucide-react'

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

type Category  = 'DeFi' | 'NFT' | 'Airdrop' | 'Trading' | 'Macro' | 'Meme'
type Tab       = 'feed' | 'publish' | 'dashboard'

interface AlphaPost {
  id: string; title: string; author: string; category: Category
  price: number; teaser: string; fullContent: string
  unlocks: number; alphaVotes: number; rugVotes: number
  totalEarned: number; createdAt: number; pdfName?: string
}

/** Mirrors the SDK's Asset shape returned by sphere_getBalance */
interface SphereAsset {
  readonly coinId: string
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly totalAmount: string
  readonly confirmedAmount: string
}

interface SphereClient {
  query: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  intent: (action: string, params: Record<string, unknown>) => Promise<unknown>
  disconnect: () => Promise<void>
}

interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'demo'
  nametag: string
  address: string
  balance: number
  sessionId: string
  client: SphereClient | null
  uctCoinId: string
}

interface DemoStore {
  nametag: string
  balance: number
  unlockedIds: string[]
}

/* ════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════ */

const CATS: Category[] = ['DeFi','NFT','Airdrop','Trading','Macro','Meme']
const CAT_CLS: Record<Category, string> = {
  DeFi:'cat-defi',NFT:'cat-nft',Airdrop:'cat-airdrop',
  Trading:'cat-trading',Macro:'cat-macro',Meme:'cat-meme',
}
const WALLET_URL    = 'https://sphere.unicity.network'
const NET_TESTNET2  = { id: 4, name: 'testnet2' } as const
const DEMO_KEY      = 'a1sphere_demo'
const SESSION_KEY   = 'a1sphere_sid'
const DECIMALS      = 18n
const BASE_UNIT     = 10n ** DECIMALS

/** UCT coinId on testnet2 — NETWORKS.testnet2.nativeCoinIds[0] */
const UCT_COIN_ID   = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0'

const DEMO_PROFILES: { nametag: string; balance: number }[] = [
  { nametag: '@satoshi_unicity', balance: 1250 },
  { nametag: '@alpha_whale',     balance: 3400 },
  { nametag: '@defi_explorer',   balance: 780  },
]

const FAKE_READERS = [
  '@whale99','@degen_ser','@moon_chaser','@alpha_sniper','@rekt_fren','@diamond_paws',
]

/* ── Seed alpha posts ───────────────────────────────── */
const SEED: AlphaPost[] = [
  {
    id:'a1', title:'Cara Farm Airdrop Monad Testnet — Full Guide',
    author:'@alpha_hunter', category:'Airdrop', price:15,
    teaser:'Monad adalah L1 baru dengan funding $225M dari Paradigm. Testnet resmi sudah live — ini kesempatan emas farming airdrop. Langkah pertama kamu perlu setup wallet dan menambahkan network custom…',
    fullContent:`## Overview\nMonad L1 — $225M funding, EVM-compatible, 10.000 TPS.\n\n## Step 1: Setup Wallet\nTambahkan Monad Testnet ke MetaMask:\n• RPC: https://testnet-rpc.monad.xyz\n• Chain ID: 10143\n\n## Step 2: Claim Faucet\nfaucet.monad.xyz → claim 0.5 MON/hari.\n\n## Step 3: Interaksi Wajib (30 hari+)\n1. MonadSwap — 10 swap/bulan\n2. MonadBridge — bridge dari Sepolia 1x/minggu\n3. MonadLend — supply & borrow\n4. MonadNFT — mint 1 NFT/minggu\n\n## Tips Pro\n• 3–5 wallet berbeda, JANGAN sybil tools\n• Konsistensi harian > volume besar\n• Screenshot semua aktivitas\n\n## Estimasi Reward\n$500–$5.000 / wallet. Timeline Q1 2027. Confidence 85%.`,
    unlocks:142, alphaVotes:89, rugVotes:12, totalEarned:2130, createdAt:Date.now()-172800000,
  },
  {
    id:'a2', title:'Whale On-Chain Accumulation BTC — Q4 Analysis',
    author:'@onchain_wizard', category:'Trading', price:25,
    teaser:'Data on-chain menunjukkan accumulation masif oleh whale besar di range $58K–$62K dalam 14 hari terakhir. Pattern ini identik dengan setup pre-rally Q1 2024…',
    fullContent:`## Whale Addresses\n1. 0x3f5CE… — 2.400 BTC dalam 7 hari\n2. 0x8aC12… — 1.800 BTC keluar exchange\n3. 0xD4e9F… — 5.200 BTC sejak September\n\n## Indikator\n• Exchange Reserve: turun 12% MoM\n• MVRV Z-Score: 1.2 — undervalued\n• Realized vs Market Cap: gap menyempit\n\n## Price Targets\n$78K → $95K → $120K (jika Fed pivot)\n\n## Action Plan\n• DCA $58K–$65K\n• Stop-loss: $52K\n• TP: 25% di $78K, 25% di $90K, hold sisanya`,
    unlocks:98, alphaVotes:72, rugVotes:8, totalEarned:2450, createdAt:Date.now()-86400000,
  },
  {
    id:'a3', title:'DeFi Yield 200% APY — Strategi Degen Solana',
    author:'@defi_maxi', category:'DeFi', price:10,
    teaser:'Strategy baru di Solana memberikan yield 200%+ APY: recursive lending Kamino + concentrated LP Orca Whirlpools. Banyak yang belum tahu kombinasi ini…',
    fullContent:`## Strategy: Kamino × Orca Multiply\n\n### Step 1\nDeposit SOL di Kamino → kSOL (8% APY base)\n\n### Step 2\n• Borrow USDC (LTV 75%)\n• 50% swap ke SOL\n• LP di Orca SOL/USDC (±5%)\n• Stake LP di Kamino Multiply\n\n### Yield\n| Source | APY |\n|---|---|\n| Kamino lending | 8% |\n| Orca LP | 45% |\n| 3x leverage | +90% |\n| KMNO rewards | ~40% |\n| **Total** | **~200%** |\n\n### Risk ⚠️\n• IL jika SOL drop >15%\n• Liquidation jika LTV >85%\n• Rebalance setiap 48 jam`,
    unlocks:203, alphaVotes:156, rugVotes:31, totalEarned:2030, createdAt:Date.now()-259200000,
  },
  {
    id:'a4', title:'5 NFT Blue-Chip yang Akan 10x di Bull Run',
    author:'@nft_sage', category:'NFT', price:20,
    teaser:'Setelah bear market, 5 koleksi NFT blue-chip sekarang di floor terendah sepanjang masa. Catalyst besar belum di-price-in oleh market…',
    fullContent:`## 1. Pudgy Penguins — 8 ETH → 25 ETH\nRetail IP (Walmart), upcoming token.\n\n## 2. Azuki — 5 ETH → 15 ETH\nAnime studio partnership Jepang.\n\n## 3. Milady — 3.5 ETH → 12 ETH\nRemilia ecosystem, cult community.\n\n## 4. DeGods — 2 ETH → 8 ETH\nNew team, cross-chain expansion.\n\n## 5. Bong Bears — 15 ETH → 40 ETH\nBerachain mainnet imminent + airdrop.\n\n## Strategi\n• DCA 2–4 minggu\n• 40% aman / 40% medium / 20% degen\n• Hold minimum 6 bulan`,
    unlocks:67, alphaVotes:45, rugVotes:18, totalEarned:1340, createdAt:Date.now()-345600000,
  },
  {
    id:'a5', title:'Fed Pivot & Dampak ke Crypto — Macro Deep Dive',
    author:'@macro_guru', category:'Macro', price:30,
    teaser:'Fed meeting berikutnya bisa jadi turning point siklus. Data inflasi dan yield curve menunjukkan sinyal kuat pivot akan lebih cepat dari konsensus…',
    fullContent:`## Data Macro\n• CPI: 2.3% (target 2%)\n• Unemployment: 4.1%\n• 10Y-2Y Yield: steepening\n• ISM: kontraksi 3 bulan\n\n## Skenario Fed\n| Skenario | Prob |\n|---|---|\n| Cut 25bps | 60% |\n| Hold dovish | 30% |\n| Cut 50bps | 10% |\n\n## Dampak\nRate cut → USD lemah → BTC/ETH pump 15–25%.\nAltseason mulai 2–3 minggu setelah cut.\n\n## Positioning\n1. BTC 50% portfolio\n2. Overweight ETH\n3. SOL + AVAX high-beta\n4. No leverage sampai konfirmasi`,
    unlocks:54, alphaVotes:41, rugVotes:5, totalEarned:1620, createdAt:Date.now()-432000000,
  },
  {
    id:'a6', title:'3 Meme Coin Stealth — Belum Launch 🚀',
    author:'@degen_lord', category:'Meme', price:5,
    teaser:'3 meme coin dalam fase stealth/pre-launch. Komunitas kecil tapi organik. Ada insider info listing CEX sudah di pipeline. Entry window: minggu ini saja…',
    fullContent:`## ⚠️ HIGH RISK — 1–3% portfolio only.\n\n## 1. $SPHEREDOG (Unicity)\n• Contract deployed, belum launch\n• 2.800 members Telegram (organik)\n• 2 CEX tier-2 confirmed\n• Target 20–50x\n\n## 2. $MONADPEPE (Monad)\n• First meme di Monad mainnet\n• 5.200 members\n• Catalyst: mainnet launch\n• Buy dalam 5 menit pertama\n\n## 3. $AIGIRL (Base)\n• Stealth launch 5–7 hari lagi\n• AI + anime waifu = viral\n• 3 KOL 500K+ sudah commit\n• DCA jam pertama, jangan FOMO`,
    unlocks:312, alphaVotes:201, rugVotes:89, totalEarned:1560, createdAt:Date.now()-43200000,
  },
]

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

const uid  = () => Math.random().toString(36).slice(2,10)
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function shortAddr(a: string): string {
  if (a.startsWith('DIRECT://')) return a.slice(9, 17) + '…'
  return a.slice(0, 6) + '…' + a.slice(-4)
}

function fmtUCT(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/* localStorage helpers for demo wallet */
function loadDemo(): DemoStore | null {
  try { const r = localStorage.getItem(DEMO_KEY); return r ? JSON.parse(r) as DemoStore : null }
  catch { return null }
}
function saveDemo(d: DemoStore): void {
  localStorage.setItem(DEMO_KEY, JSON.stringify(d))
}

/**
 * Parse UCT balance from sphere_getBalance response.
 * The SDK returns Asset[] (array!), not { amount: string }.
 * Each Asset has { coinId, symbol, totalAmount, decimals, ... }.
 */
function parseBalance(raw: unknown): { balance: number; coinId: string } {
  if (!Array.isArray(raw)) return { balance: 0, coinId: UCT_COIN_ID }
  const assets = raw as SphereAsset[]
  /* Try to find UCT by coinId first, then by symbol */
  const uct = assets.find(a => a.coinId === UCT_COIN_ID)
           ?? assets.find(a => a.symbol?.toUpperCase() === 'UCT')
  if (!uct) return { balance: 0, coinId: UCT_COIN_ID }
  const base = BigInt(uct.totalAmount || '0')
  return { balance: Number(base / BASE_UNIT), coinId: uct.coinId }
}

/* ════════════════════════════════════════════════════════════
   APP
   ════════════════════════════════════════════════════════════ */

export default function App() {

  /* ── core state ────────────────────────────── */
  const [w, setW] = useState<WalletState>({
    status:'disconnected', nametag:'', address:'', balance:0, sessionId:'', client:null, uctCoinId: UCT_COIN_ID,
  })
  const [alphas, setAlphas]         = useState<AlphaPost[]>(SEED)
  const [ticker, setTicker]         = useState<string[]>(
    ['🔥 @whale99 unlocked "Whale BTC Q4" — 25 UCT','⚡ @degen_ser unlocked "Meme Coin Stealth" — 5 UCT','🚀 @alpha_sniper unlocked "DeFi Yield 200%" — 10 UCT','💎 @moon_chaser unlocked "Airdrop Monad" — 15 UCT','👑 @diamond_paws voted ALPHA 🔥 on "Fed Pivot"'],
  )
  const [tab, setTab]               = useState<Tab>('feed')
  const [bumpQ, setBumpQ]           = useState<string[]>([])
  const [shakingId, setShakingId]   = useState<string | null>(null)
  const [glowId, setGlowId]        = useState<string | null>(null)
  const [unlocked, setUnlocked]     = useState<Set<string>>(new Set())
  const [readAlpha, setReadAlpha]   = useState<AlphaPost | null>(null)
  const [demoModal, setDemoModal]   = useState(false)
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null)

  /* upload form */
  const [uTitle, setUTitle]     = useState('')
  const [uCat, setUCat]         = useState<Category>('DeFi')
  const [uTeaser, setUTeaser]   = useState('')
  const [uBody, setUBody]       = useState('')
  const [uPrice, setUPrice]     = useState(10)
  const [uPdf, setUPdf]         = useState('')

  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const connected = w.status === 'connected' || w.status === 'demo'

  /* ── toast ─────────────────────────────────── */
  const flash = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  /* ── bump + shake ──────────────────────────── */
  const bump = useCallback((id: string) => {
    setShakingId(id); setGlowId(id)
    setBumpQ(q => [id, ...q.filter(x => x !== id)])
    setTimeout(() => setShakingId(null), 800)
    setTimeout(() => setGlowId(null), 5400)
  }, [])

  /* ── restore demo on mount ─────────────────── */
  useEffect(() => {
    const d = loadDemo()
    if (d) {
      setW({ status:'demo', nametag:d.nametag, address:'DIRECT://demo', balance:d.balance, sessionId:'demo', client:null, uctCoinId: UCT_COIN_ID })
      setUnlocked(new Set(d.unlockedIds))
    }
  }, [])

  /* ── auto-ticker ───────────────────────────── */
  useEffect(() => {
    const iv = setInterval(() => {
      const a = pick(SEED)
      const u = pick(FAKE_READERS)
      setTicker(t => [`${pick(['🔥','⚡','💎','🚀'])} ${u} unlocked "${a.title.slice(0,28)}…" — ${a.price} UCT`, ...t].slice(0, 50))
    }, 14000)
    return () => clearInterval(iv)
  }, [])

  /* ── persist demo state ────────────────────── */
  useEffect(() => {
    if (w.status === 'demo') {
      saveDemo({ nametag: w.nametag, balance: w.balance, unlockedIds: [...unlocked] })
    }
  }, [w.status, w.nametag, w.balance, unlocked])

  /* ── silent reconnect (real SDK) ────────────── */
  useEffect(() => {
    let cancelled = false
    const sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) return
    ;(async () => {
      try {
        const { autoConnect } = await import('@unicitylabs/sphere-sdk/impl/browser/connect')
        const res = await autoConnect({
          dapp: { name: 'A1 Sphere', url: location.origin },
          walletUrl: WALLET_URL, network: NET_TESTNET2,
          resumeSessionId: sid, silent: true, timeout: 8000,
        })
        if (cancelled) { void res.disconnect(); return }
        const id = res.connection.identity
        let bal = 0
        let resolvedCoinId = UCT_COIN_ID
        try {
          const raw = await res.client.query('sphere_getBalance')
          const parsed = parseBalance(raw)
          bal = parsed.balance
          resolvedCoinId = parsed.coinId
        } catch { /* balance query optional */ }
        sessionStorage.setItem(SESSION_KEY, res.connection.sessionId)
        setW({
          status: 'connected',
          nametag: id.nametag ? `@${id.nametag}` : shortAddr(id.directAddress ?? id.chainPubkey),
          address: id.directAddress ?? id.chainPubkey,
          balance: bal, sessionId: res.connection.sessionId, uctCoinId: resolvedCoinId,
          client: { query: (m, p) => res.client.query(m, p), intent: (a, p) => res.client.intent(a, p), disconnect: () => res.disconnect() },
        })
      } catch { /* silent reconnect failed — user will click connect manually */ }
    })()
    return () => { cancelled = true }
  }, [])

  /* ── connect wallet ────────────────────────── */
  const connect = useCallback(async () => {
    if (w.status === 'connecting') return
    setW(prev => ({ ...prev, status: 'connecting' }))
    try {
      const { autoConnect } = await import('@unicitylabs/sphere-sdk/impl/browser/connect')
      const res = await autoConnect({
        dapp: { name: 'A1 Sphere', url: location.origin, description: 'Pay-to-Read Alpha Market on Unicity' },
        walletUrl: WALLET_URL, network: NET_TESTNET2, timeout: 30000,
      })
      const id = res.connection.identity
      let bal = 0
      let resolvedCoinId = UCT_COIN_ID
      try {
        const raw = await res.client.query('sphere_getBalance')
        const parsed = parseBalance(raw)
        bal = parsed.balance
        resolvedCoinId = parsed.coinId
      } catch { /* balance is optional */ }
      sessionStorage.setItem(SESSION_KEY, res.connection.sessionId)
      localStorage.removeItem(DEMO_KEY)
      setW({
        status: 'connected',
        nametag: id.nametag ? `@${id.nametag}` : shortAddr(id.directAddress ?? id.chainPubkey),
        address: id.directAddress ?? id.chainPubkey,
        balance: bal, sessionId: res.connection.sessionId, uctCoinId: resolvedCoinId,
        client: { query: (m, p) => res.client.query(m, p), intent: (a, p) => res.client.intent(a, p), disconnect: () => res.disconnect() },
      })
      flash(`✅ Connected as ${id.nametag ? '@' + id.nametag : 'wallet'}`)
    } catch {
      setW(prev => ({ ...prev, status: 'disconnected' }))
      setDemoModal(true)
    }
  }, [w.status, flash])

  /* ── activate demo ─────────────────────────── */
  const activateDemo = useCallback((p: { nametag: string; balance: number }) => {
    setW({ status:'demo', nametag:p.nametag, address:'DIRECT://demo_'+uid(), balance:p.balance, sessionId:'demo', client:null, uctCoinId: UCT_COIN_ID })
    setDemoModal(false)
    flash(`🧪 Demo: ${p.nametag} (${p.balance} UCT)`)
  }, [flash])

  /* ── disconnect ────────────────────────────── */
  const disconnect = useCallback(async () => {
    if (w.client) { try { await w.client.disconnect() } catch { /* ignore */ } }
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(DEMO_KEY)
    setW({ status:'disconnected', nametag:'', address:'', balance:0, sessionId:'', client:null, uctCoinId: UCT_COIN_ID })
    setUnlocked(new Set())
    flash('Disconnected')
  }, [w.client, flash])

  /* ── unlock alpha ──────────────────────────── */
  const doUnlock = useCallback(async (alpha: AlphaPost) => {
    if (!connected) { flash('⚠️ Connect wallet first', false); return }
    if (unlocked.has(alpha.id)) { setReadAlpha(alpha); return }
    if (w.balance < alpha.price) { flash(`❌ Insufficient UCT — need ${alpha.price}`, false); return }

    /* Real wallet → fire intent('send') */
    if (w.status === 'connected' && w.client) {
      try {
        await w.client.intent('send', {
          to: alpha.author,  /* Keep '@' prefix — SDK parseAddress requires it for nametags */
          amount: String(BigInt(alpha.price) * BASE_UNIT),
          coinId: w.uctCoinId,
          memo: `A1 Sphere: "${alpha.title}"`,
        })
        /* Refresh balance from wallet after successful payment */
        try {
          const raw = await w.client.query('sphere_getBalance', { coinId: w.uctCoinId })
          const parsed = parseBalance(raw)
          setW(prev => ({ ...prev, balance: parsed.balance }))
        } catch { /* balance refresh optional — will desync but not crash */ }
      } catch (e: unknown) {
        const code = (e as { code?: number })?.code
        if (code === 4003 || code === 4200) { flash('Payment cancelled', false); return }
        if (code === 4009) { flash('⚠️ Wallet locked', false); return }
        if (code === 4100) { flash('❌ Insufficient balance in wallet', false); return }
        if (code === 4101) { flash('❌ Invalid recipient address', false); return }
        flash('❌ Payment failed', false); return
      }
    } else {
      /* Demo mode — just deduct locally */
      setW(prev => ({ ...prev, balance: prev.balance - alpha.price }))
    }
    setAlphas(prev => prev.map(a => a.id === alpha.id ? { ...a, unlocks: a.unlocks + 1, totalEarned: a.totalEarned + alpha.price } : a))
    setUnlocked(prev => new Set(prev).add(alpha.id))
    setTicker(t => [`⚡ ${w.nametag || 'anon'} unlocked "${alpha.title.slice(0,26)}…" — ${alpha.price} UCT`, ...t].slice(0, 50))
    bump(alpha.id)
    flash(`🔓 Unlocked! −${alpha.price} UCT`)
    const updated = { ...alpha, unlocks: alpha.unlocks + 1, totalEarned: alpha.totalEarned + alpha.price }
    setTimeout(() => setReadAlpha(updated), 400)
  }, [connected, unlocked, w, bump, flash])

  /* ── simulate buy ──────────────────────────── */
  const simBuy = useCallback(() => {
    const a = pick(alphas), u = pick(FAKE_READERS)
    setAlphas(prev => prev.map(x => x.id === a.id ? { ...x, unlocks: x.unlocks + 1, totalEarned: x.totalEarned + x.price } : x))
    setTicker(t => [`🔥 ${u} unlocked "${a.title.slice(0,26)}…" — ${a.price} UCT`, ...t].slice(0, 50))
    bump(a.id); flash(`⚡ ${u} bought alpha!`)
  }, [alphas, bump, flash])

  /* ── vote ───────────────────────────────────── */
  const doVote = useCallback((id: string, kind: 'alpha' | 'rug') => {
    setAlphas(prev => prev.map(a => a.id === id ? { ...a, alphaVotes: a.alphaVotes + (kind === 'alpha' ? 1 : 0), rugVotes: a.rugVotes + (kind === 'rug' ? 1 : 0) } : a))
    if (readAlpha?.id === id) setReadAlpha(r => r ? { ...r, alphaVotes: r.alphaVotes + (kind === 'alpha' ? 1 : 0), rugVotes: r.rugVotes + (kind === 'rug' ? 1 : 0) } : r)
    flash(kind === 'alpha' ? '🔥 Voted ALPHA!' : '💩 Voted RUG!')
  }, [readAlpha, flash])

  /* ── publish ───────────────────────────────── */
  const doPublish = useCallback(() => {
    if (!uTitle.trim() || !uTeaser.trim() || !uBody.trim()) { flash('⚠️ Fill required fields', false); return }
    const a: AlphaPost = {
      id: uid(), title: uTitle.trim(), author: w.nametag || shortAddr(w.address),
      category: uCat, price: uPrice, teaser: uTeaser.trim(), fullContent: uBody.trim(),
      unlocks: 0, alphaVotes: 0, rugVotes: 0, totalEarned: 0, createdAt: Date.now(),
      pdfName: uPdf || undefined,
    }
    setAlphas(prev => [a, ...prev])
    bump(a.id)
    setTicker(t => [`📝 ${a.author} posted "${a.title.slice(0,28)}…"`, ...t].slice(0, 50))
    setUTitle(''); setUTeaser(''); setUBody(''); setUPrice(10); setUPdf('')
    setTab('feed'); flash('✅ Alpha published!')
  }, [uTitle, uTeaser, uBody, uCat, uPrice, uPdf, w.nametag, w.address, bump, flash])

  /* ── derived ───────────────────────────────── */
  const king      = alphas.reduce((b, a) => a.totalEarned > b.totalEarned ? a : b, alphas[0])
  const myTag     = w.nametag || (connected ? shortAddr(w.address) : '')
  const myAlphas  = alphas.filter(a => a.author === myTag)
  const myEarned  = myAlphas.reduce((s, a) => s + a.totalEarned, 0)
  const myReads   = myAlphas.reduce((s, a) => s + a.unlocks, 0)
  const sorted    = [
    ...bumpQ.map(id => alphas.find(a => a.id === id)).filter(Boolean) as AlphaPost[],
    ...alphas.filter(a => !bumpQ.includes(a.id)).sort((a, b) => b.createdAt - a.createdAt),
  ]

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: '#060609' }}>

      {/* ── TICKER ────────────────────────────── */}
      <div className="overflow-hidden h-7 flex items-center border-b" style={{ background: '#080810', borderColor: 'rgba(255,87,34,.1)' }}>
        <div className="anim-ticker flex gap-14 whitespace-nowrap min-w-max">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="text-[11px] font-medium" style={{ color: 'rgba(203,213,225,.55)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b" style={{ background: 'rgba(8,8,16,.92)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,.06)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg g-orange flex items-center justify-center" style={{ boxShadow: '0 0 16px rgba(255,87,34,.4)' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>A1 SPHERE</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,87,34,.12)', color: '#FF5722', border: '1px solid rgba(255,87,34,.25)', fontFamily: 'JetBrains Mono,monospace' }}>Built on Unicity</span>
                </div>
                <p className="text-[10px] hidden sm:block" style={{ color: 'rgba(148,163,184,.5)' }}>Pay-to-Read Alpha Market</p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button onClick={simBuy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors" style={{ background: 'rgba(16,185,129,.08)', color: '#10B981', border: '1px solid rgba(16,185,129,.2)' }}>
                <Activity className="w-3.5 h-3.5" /><span className="hidden sm:inline">⚡ Simulate Live Buy</span><span className="sm:hidden">⚡</span>
              </button>
              {!connected ? (
                <button onClick={connect} disabled={w.status === 'connecting'} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg,#FF5722,#FF8A00)', boxShadow: '0 2px 14px rgba(255,87,34,.3)' }}>
                  <Wallet className="w-3.5 h-3.5" />{w.status === 'connecting' ? 'Connecting…' : 'Connect Sphere Wallet'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(251,185,36,.06)', border: '1px solid rgba(251,185,36,.18)' }}>
                    <DollarSign className="w-3 h-3" style={{ color: '#FBB924' }} />
                    <span className="font-bold" style={{ color: '#FBB924', fontFamily: 'JetBrains Mono,monospace' }}>{fmtUCT(w.balance)} UCT</span>
                  </div>
                  <button onClick={disconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors hover:border-red-500/30" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }} title="Disconnect">
                    <div className="w-1.5 h-1.5 rounded-full anim-pulse" style={{ background: w.status === 'demo' ? '#FBB924' : '#10B981' }} />
                    <span style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono,monospace' }}>{w.nametag}</span>
                    {w.status === 'demo' && <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(251,185,36,.12)', color: '#FBB924' }}>DEMO</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-2">
            {([['feed', 'Alpha Feed', <Sparkles key="i" className="w-3.5 h-3.5" />], ['publish', 'Publish Alpha', <Upload key="i" className="w-3.5 h-3.5" />], ['dashboard', 'Creator Dashboard', <BarChart3 key="i" className="w-3.5 h-3.5" />]] as [Tab, string, ReactNode][]).map(([k, label, icon]) => (
              <button key={k} onClick={() => { if (k !== 'feed' && !connected) { flash('⚠️ Connect wallet first', false); return } setTab(k) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg cursor-pointer transition-colors"
                style={tab === k ? { background: 'rgba(255,255,255,.06)', color: '#F1F5F9', borderTop: '1px solid rgba(255,87,34,.35)', borderLeft: '1px solid rgba(255,255,255,.06)', borderRight: '1px solid rgba(255,255,255,.06)' } : { color: 'rgba(148,163,184,.5)' }}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── MAIN ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-7">

        {/* === FEED === */}
        {tab === 'feed' && (
          <div className="anim-fade-up">
            {/* King */}
            <div className="mb-8 p-px rounded-2xl anim-glow-gld" style={{ background: 'linear-gradient(135deg,rgba(251,185,36,.45),rgba(255,138,0,.25),rgba(251,185,36,.45))' }}>
              <div className="rounded-2xl p-6" style={{ background: 'rgba(10,10,16,.97)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5" style={{ color: '#FBB924', filter: 'drop-shadow(0 0 6px rgba(251,185,36,.6))' }} />
                  <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk,sans-serif', color: '#FBB924' }}>👑 King of the Sphere</span>
                  <span className="ml-auto text-[10px]" style={{ color: 'rgba(148,163,184,.4)' }}>Most UCT earned</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1 min-w-0">
                    <span className={`cat-badge ${CAT_CLS[king.category]} mb-2`}>{king.category}</span>
                    <h2 className="text-lg font-bold text-white leading-snug mb-1">{king.title}</h2>
                    <p className="text-xs mb-2" style={{ color: 'rgba(148,163,184,.6)' }}>by <span style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono,monospace' }}>{king.author}</span> · {ago(king.createdAt)}</p>
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(203,213,225,.6)' }}>{king.teaser}</p>
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-2 sm:min-w-[140px]">
                    <Mini icon={<DollarSign />} label="Earned" val={`${king.totalEarned} UCT`} color="#FBB924" />
                    <Mini icon={<Eye />} label="Unlocks" val={String(king.unlocks)} color="#38BDF8" />
                    <Mini icon={<Flame />} label="Alpha" val={String(king.alphaVotes)} color="#10B981" />
                    <button onClick={() => doUnlock(king)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg,rgba(251,185,36,.2),rgba(255,138,0,.2))', border: '1px solid rgba(251,185,36,.35)' }}>
                      {unlocked.has(king.id) ? <><BookOpen className="w-3.5 h-3.5" />Read Again</> : <><Lock className="w-3.5 h-3.5" />Unlock {king.price} UCT</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recently bumped */}
            {bumpQ.length > 0 && (
              <section className="mb-6">
                <h3 className="flex items-center gap-2 text-xs font-bold mb-3" style={{ color: '#10B981' }}>
                  <TrendingUp className="w-4 h-4" /> Recently Unlocked
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bumpQ.slice(0, 3).map(id => { const a = alphas.find(x => x.id === id); return a ? <Card key={a.id} a={a} shaking={shakingId === a.id} glowing={glowId === a.id} open={unlocked.has(a.id)} onUnlock={doUnlock} onVote={doVote} /> : null })}
                </div>
              </section>
            )}

            {/* All */}
            <section>
              <h3 className="flex items-center gap-2 text-xs font-bold mb-3" style={{ color: 'rgba(148,163,184,.6)' }}>
                <Sparkles className="w-3.5 h-3.5 opacity-50" /> All Alpha Posts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.filter(a => !bumpQ.slice(0, 3).includes(a.id)).map(a => (
                  <Card key={a.id} a={a} shaking={shakingId === a.id} glowing={glowId === a.id} open={unlocked.has(a.id)} onUnlock={doUnlock} onVote={doVote} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* === PUBLISH === */}
        {tab === 'publish' && (
          <div className="max-w-2xl mx-auto anim-fade-up">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
              <Upload className="w-5 h-5" style={{ color: '#FF5722' }} /> Publish New Alpha
            </h2>
            <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(12,13,20,.8)', border: '1px solid rgba(255,255,255,.07)' }}>
              <Fld label="Title *"><input value={uTitle} onChange={e => setUTitle(e.target.value)} placeholder="e.g. Full Airdrop Guide Monad Q1 2027" className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)' }} /></Fld>
              <div className="grid grid-cols-2 gap-4">
                <Fld label="Category"><select value={uCat} onChange={e => setUCat(e.target.value as Category)} className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)' }}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></Fld>
                <Fld label="Price (UCT)"><input type="number" min={1} value={uPrice} onChange={e => setUPrice(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)', color: '#FBB924', fontFamily: 'JetBrains Mono,monospace' }} /></Fld>
              </div>
              <Fld label="Free Teaser * — shown publicly"><textarea value={uTeaser} onChange={e => setUTeaser(e.target.value)} rows={3} placeholder="Hook that makes readers want to pay…" className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none resize-y" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)' }} /></Fld>
              <Fld label="Full Content * — visible after payment"><textarea value={uBody} onChange={e => setUBody(e.target.value)} rows={9} placeholder="Full alpha analysis…" className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none resize-y" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)' }} /></Fld>
              <Fld label="Attach PDF (optional)"><label className="flex items-center gap-2 cursor-pointer text-sm hover:text-white transition-colors" style={{ color: 'rgba(148,163,184,.6)' }}><FileText className="w-4 h-4" />{uPdf || 'Choose PDF file…'}<input type="file" accept=".pdf" className="hidden" onChange={e => setUPdf(e.target.files?.[0]?.name ?? '')} /></label></Fld>
              <button onClick={doPublish} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg,#FF5722,#FF8A00)', boxShadow: '0 4px 20px rgba(255,87,34,.25)' }}>
                <Plus className="w-4 h-4" /> Publish Alpha
              </button>
            </div>
          </div>
        )}

        {/* === DASHBOARD === */}
        {tab === 'dashboard' && (
          <div className="anim-fade-up">
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(12,13,20,.8)', border: '1px solid rgba(255,255,255,.07)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl g-orange flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ fontFamily: 'Space Grotesk,sans-serif', boxShadow: '0 0 22px rgba(255,87,34,.35)' }}>
                  {(w.nametag || '?').replace('@', '')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-bold" style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono,monospace' }}>{w.nametag}</span>
                    {w.status === 'demo' && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,185,36,.12)', color: '#FBB924' }}>DEMO</span>}
                    {w.status === 'connected' && <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,.1)', color: '#10B981' }}><Shield className="w-2.5 h-2.5" />Sphere Wallet</span>}
                  </div>
                  <p className="text-xs mt-1 truncate" style={{ color: 'rgba(148,163,184,.35)', fontFamily: 'JetBrains Mono,monospace' }}>{w.address}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(251,185,36,.06)', border: '1px solid rgba(251,185,36,.18)' }}>
                  <DollarSign className="w-5 h-5" style={{ color: '#FBB924' }} />
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#FBB924', fontFamily: 'JetBrains Mono,monospace' }}>{fmtUCT(w.balance)}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(251,185,36,.5)' }}>UCT balance</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <Stat icon={<FileText className="w-5 h-5" />} label="Published" val={String(myAlphas.length)} color="#FF5722" />
                <Stat icon={<Eye className="w-5 h-5" />} label="Unlocks" val={String(myReads)} color="#38BDF8" />
                <Stat icon={<DollarSign className="w-5 h-5" />} label="Earned" val={fmtUCT(myEarned)} color="#FBB924" />
                <Stat icon={<Flame className="w-5 h-5" />} label="Rating" val={myAlphas.length ? `${Math.round(myAlphas.reduce((s, a) => s + (a.alphaVotes / Math.max(a.alphaVotes + a.rugVotes, 1)) * 100, 0) / myAlphas.length)}%` : '—'} color="#10B981" />
              </div>
            </div>
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: 'rgba(148,163,184,.6)' }}><BookOpen className="w-3.5 h-3.5" /> My Published Alphas</h3>
            {myAlphas.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(12,13,20,.5)', border: '1px dashed rgba(255,255,255,.07)' }}>
                <Upload className="w-8 h-8 mx-auto mb-3 opacity-25" /><p className="text-sm" style={{ color: 'rgba(148,163,184,.45)' }}>No alpha published yet.</p>
                <button onClick={() => setTab('publish')} className="mt-3 text-xs cursor-pointer" style={{ color: '#FF5722' }}>→ Publish first alpha</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myAlphas.map(a => <Card key={a.id} a={a} shaking={false} glowing={false} open onUnlock={() => setReadAlpha(a)} onVote={doVote} owner />)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════ READING MODAL ═══════════════════════ */}
      {readAlpha && <ReadModal alpha={readAlpha} isOpen={unlocked.has(readAlpha.id) || myAlphas.some(x => x.id === readAlpha.id)} onClose={() => setReadAlpha(null)} onUnlock={doUnlock} onVote={doVote} />}

      {/* ════ DEMO SELECTOR MODAL ═════════════════ */}
      {demoModal && (
        <div className="fixed inset-0 z-50 modal-bg flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDemoModal(false) }}>
          <div className="w-full max-w-sm rounded-2xl p-6 anim-fade-up" style={{ background: 'rgba(10,10,18,.98)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Wallet className="w-5 h-5" style={{ color: '#FF5722' }} /><h3 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>Sphere Wallet Connect</h3></div><button onClick={() => setDemoModal(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button></div>
            <p className="text-xs mb-1" style={{ color: 'rgba(148,163,184,.5)' }}>Sphere Wallet tidak terdeteksi (localhost/dev). Pilih profil demo:</p>
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: 'rgba(255,87,34,.05)', border: '1px solid rgba(255,87,34,.18)', color: 'rgba(255,138,0,.75)' }}>ℹ️ Di production, identitas langsung dari Sphere Wallet user via ConnectClient.</div>
            <div className="space-y-2">
              {DEMO_PROFILES.map(p => (
                <button key={p.nametag} onClick={() => activateDemo(p)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left cursor-pointer transition-all hover:border-[rgba(255,87,34,.25)]" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg g-orange flex items-center justify-center text-xs font-bold text-white">{p.nametag.replace('@', '')[0].toUpperCase()}</div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono,monospace' }}>{p.nametag}</div>
                      <div className="text-xs" style={{ color: 'rgba(251,185,36,.6)', fontFamily: 'JetBrains Mono,monospace' }}>{p.balance} UCT</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ TOAST ═══════════════════════════════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium text-white anim-fade-up flex items-center gap-2" style={{ background: 'rgba(12,12,20,.95)', border: `1px solid ${toast.ok ? 'rgba(16,185,129,.25)' : 'rgba(255,87,34,.25)'}`, backdropFilter: 'blur(20px)' }}>
          {toast.ok ? <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} /> : <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FF5722' }} />}{toast.msg}
        </div>
      )}

      {/* ════ FOOTER ══════════════════════════════ */}
      <footer className="border-t mt-16 py-6 text-center text-xs" style={{ borderColor: 'rgba(255,255,255,.04)', color: 'rgba(148,163,184,.3)' }}>
        <span className="g-orange-text font-bold">A1 SPHERE</span> · Pay-to-Read Alpha Market · Powered by <span style={{ color: '#FF5722' }}>Unicity Network</span>
      </footer>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════ */

/* ── Alpha Card ──────────────────────────────── */
function Card({ a, shaking, glowing, open, onUnlock, onVote, owner }: {
  a: AlphaPost; shaking: boolean; glowing: boolean; open: boolean
  onUnlock: (a: AlphaPost) => void; onVote: (id: string, k: 'alpha' | 'rug') => void; owner?: boolean
}) {
  const total = a.alphaVotes + a.rugVotes
  const pct   = total ? Math.round(a.alphaVotes / total * 100) : 50
  return (
    <div className={`glass rounded-2xl overflow-hidden flex flex-col ${shaking ? 'anim-shake' : ''} ${glowing ? 'anim-glow-grn' : ''}`} style={glowing ? { borderColor: 'rgba(16,185,129,.4)' } : undefined}>
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span className={`cat-badge ${CAT_CLS[a.category]}`}>{a.category}</span>
          <span className="text-[10px]" style={{ color: 'rgba(148,163,184,.35)' }}>{ago(a.createdAt)}</span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug mb-1.5 line-clamp-2" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>{a.title}</h3>
        <p className="text-xs" style={{ color: 'rgba(167,139,250,.75)', fontFamily: 'JetBrains Mono,monospace' }}>{a.author}</p>
      </div>
      <div className="px-4 pb-3 relative flex-1">
        <p className="text-xs leading-relaxed line-clamp-4" style={{ color: 'rgba(203,213,225,.55)' }}>{a.teaser}</p>
        {!open && <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(transparent,rgba(18,19,26,.98))' }} />}
      </div>
      <div className="px-4 pb-2 flex items-center gap-3 text-[10px]" style={{ color: 'rgba(148,163,184,.45)' }}>
        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{a.unlocks}</span>
        <span className="flex items-center gap-0.5" style={{ fontFamily: 'JetBrains Mono,monospace' }}><DollarSign className="w-3 h-3" />{a.totalEarned}</span>
        <span className="flex items-center gap-0.5 ml-auto" style={{ color: '#10B981' }}><Flame className="w-3 h-3" />{pct}%</span>
        <span className="flex items-center gap-0.5" style={{ color: '#FF5722' }}><ThumbsDown className="w-3 h-3" />{100 - pct}%</span>
      </div>
      <div className="mx-4 mb-3 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(to right,#10B981,rgba(16,185,129,.4))' }} />
      </div>
      <div className="p-4 pt-2 flex gap-2">
        {owner ? (
          <button onClick={() => onUnlock(a)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all" style={{ background: 'rgba(255,87,34,.08)', color: '#FF5722', border: '1px solid rgba(255,87,34,.2)' }}><BarChart3 className="w-3.5 h-3.5" /> View</button>
        ) : open ? (
          <button onClick={() => onUnlock(a)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all" style={{ background: 'rgba(16,185,129,.08)', color: '#10B981', border: '1px solid rgba(16,185,129,.2)' }}><BookOpen className="w-3.5 h-3.5" /> Read</button>
        ) : (
          <button onClick={() => onUnlock(a)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg,#FF5722,#FF8A00)', boxShadow: '0 2px 12px rgba(255,87,34,.2)' }}><Lock className="w-3.5 h-3.5" /> Unlock — {a.price} UCT</button>
        )}
        {!owner && <>
          <button onClick={() => onVote(a.id, 'alpha')} title="Alpha 🔥" className="px-2.5 py-2 rounded-xl cursor-pointer transition-all" style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', color: '#10B981' }}><Flame className="w-3.5 h-3.5" /></button>
          <button onClick={() => onVote(a.id, 'rug')} title="Rug 💩" className="px-2.5 py-2 rounded-xl cursor-pointer transition-all" style={{ background: 'rgba(255,87,34,.06)', border: '1px solid rgba(255,87,34,.15)', color: '#FF5722' }}><ThumbsDown className="w-3.5 h-3.5" /></button>
        </>}
      </div>
    </div>
  )
}

/* ── Reading Modal ───────────────────────────── */
function ReadModal({ alpha, isOpen, onClose, onUnlock, onVote }: {
  alpha: AlphaPost; isOpen: boolean; onClose: () => void
  onUnlock: (a: AlphaPost) => void; onVote: (id: string, k: 'alpha' | 'rug') => void
}) {
  return (
    <div className="fixed inset-0 z-50 modal-bg flex items-start justify-center overflow-y-auto p-4 pt-12" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-3xl rounded-2xl mb-12 anim-fade-up" style={{ background: 'rgba(10,10,18,.98)', border: '1px solid rgba(255,255,255,.08)' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
          <div>
            <span className={`cat-badge ${CAT_CLS[alpha.category]} mb-2`}>{alpha.category}</span>
            <h2 className="text-xl font-bold text-white leading-snug" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>{alpha.title}</h2>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(148,163,184,.5)' }}>by <span style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono,monospace' }}>{alpha.author}</span> · {ago(alpha.createdAt)}{alpha.pdfName && <span className="ml-2" style={{ color: '#38BDF8' }}>📎 {alpha.pdfName}</span>}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer ml-3 mt-1 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>
        {/* Body */}
        <div className="p-6">
          <div className="mb-5 pb-5 border-b" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'rgba(148,163,184,.45)' }}><Tag className="w-3 h-3" /> FREE TEASER</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(203,213,225,.75)' }}>{alpha.teaser}</p>
          </div>
          {isOpen ? (
            <>
              <div className="space-y-1.5">
                {alpha.fullContent.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-white font-bold mt-5 mb-2 text-base" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>{line.slice(3)}</h3>
                  if (line.startsWith('### ')) return <h4 key={i} className="text-white font-semibold mt-4 mb-1 text-sm" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>{line.slice(4)}</h4>
                  if (line.startsWith('• ') || line.startsWith('- ')) return <p key={i} className="text-sm ml-4" style={{ color: 'rgba(203,213,225,.7)' }}>{line}</p>
                  if (line.startsWith('|')) return <p key={i} className="text-xs py-0.5" style={{ color: 'rgba(148,163,184,.75)', fontFamily: 'JetBrains Mono,monospace' }}>{line}</p>
                  if (line.trim() === '') return <div key={i} className="h-2" />
                  return <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(203,213,225,.75)' }}>{line}</p>
                })}
              </div>
              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                <p className="text-xs mb-3" style={{ color: 'rgba(148,163,184,.45)' }}>Rate this alpha:</p>
                <div className="flex gap-3">
                  <button onClick={() => onVote(alpha.id, 'alpha')} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all" style={{ background: 'rgba(16,185,129,.08)', color: '#10B981', border: '1px solid rgba(16,185,129,.25)' }}><Flame className="w-4 h-4" /> Alpha 🔥 <span className="text-xs opacity-60">({alpha.alphaVotes})</span></button>
                  <button onClick={() => onVote(alpha.id, 'rug')} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all" style={{ background: 'rgba(255,87,34,.08)', color: '#FF5722', border: '1px solid rgba(255,87,34,.25)' }}><ThumbsDown className="w-4 h-4" /> Rug 💩 <span className="text-xs opacity-60">({alpha.rugVotes})</span></button>
                </div>
              </div>
            </>
          ) : (
            <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.05)' }}>
              <div className="blur-lock p-5 select-none">
                {alpha.fullContent.split('\n').slice(0, 10).map((l, i) => <p key={i} className="text-sm mb-1" style={{ color: 'rgba(203,213,225,.5)' }}>{l || '\u00a0'}</p>)}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6" style={{ background: 'linear-gradient(transparent 0%,rgba(10,10,18,.7) 30%,rgba(10,10,18,.97) 55%)' }}>
                <div className="mt-auto">
                  <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(148,163,184,.35)' }} />
                  <p className="text-sm font-semibold text-white mb-1">Full Alpha & PDF Locked</p>
                  <p className="text-xs mb-5" style={{ color: 'rgba(148,163,184,.5)' }}>Pay {alpha.price} UCT to unlock the full analysis.</p>
                  <button onClick={() => onUnlock(alpha)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white mx-auto cursor-pointer" style={{ background: 'linear-gradient(135deg,#FF5722,#FF8A00)', boxShadow: '0 4px 22px rgba(255,87,34,.35)' }}><Unlock className="w-4 h-4" /> Unlock Full Alpha — {alpha.price} UCT</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 px-6 py-4 border-t text-xs" style={{ borderColor: 'rgba(255,255,255,.05)', color: 'rgba(148,163,184,.4)' }}>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{alpha.unlocks}</span>
          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{alpha.totalEarned} UCT</span>
          <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" />{alpha.alphaVotes}</span>
          <span className="flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" />{alpha.rugVotes}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Small helpers ───────────────────────────── */
function Mini({ icon, label, val, color }: { icon: ReactNode; label: string; val: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}>
      <span style={{ color }} className="w-3.5 h-3.5">{icon}</span>
      <div><div className="text-xs font-bold" style={{ color, fontFamily: 'JetBrains Mono,monospace' }}>{val}</div><div className="text-[9px]" style={{ color: 'rgba(148,163,184,.45)' }}>{label}</div></div>
    </div>
  )
}
function Stat({ icon, label, val, color }: { icon: ReactNode; label: string; val: string; color: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.05)' }}>
      <div style={{ color }} className="flex justify-center mb-1.5">{icon}</div>
      <div className="text-lg font-bold" style={{ color, fontFamily: 'JetBrains Mono,monospace' }}>{val}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,.45)' }}>{label}</div>
    </div>
  )
}
function Fld({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(148,163,184,.6)' }}>{label}</label>{children}</div>
}
