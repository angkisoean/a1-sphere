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
  Activity, Shield, History, ArrowUpRight, ArrowDownLeft, Clock,
} from 'lucide-react'

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

type Category  = 'DeFi' | 'NFT' | 'Airdrop' | 'Trading' | 'Macro' | 'Meme'
type Tab       = 'feed' | 'library' | 'publish' | 'dashboard'

interface AlphaPost {
  id: string; title: string; author: string; category: Category
  price: number; teaser: string; fullContent: string
  unlocks: number; alphaVotes: number; rugVotes: number
  totalEarned: number; createdAt: number; pdfName?: string
}

interface TxRecord {
  id: string
  type: 'unlock' | 'earn' | 'publish'
  title: string
  amount: number
  counterparty: string
  timestamp: number
  txHash: string
  status: 'confirmed'
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
const VOTES_KEY     = 'a1sphere_user_votes'
const CUSTOM_KEY    = 'a1sphere_custom_alphas'
const UNLOCKED_KEY  = 'a1sphere_unlocked'
const TX_KEY        = 'a1sphere_tx_history'
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
    id:'a1', title:'Monad Testnet Airdrop Strategy — Comprehensive Playbook',
    author:'@alpha_hunter', category:'Airdrop', price:15,
    teaser:'Monad is a high-performance EVM L1 backed by $225M from Paradigm. The public testnet is live — this is the golden window to establish on-chain history before the snapshot…',
    fullContent:`## Overview\nMonad L1 — $225M institutional funding, 10,000 TPS, 1-second finality with full EVM compatibility.\n\n## Step 1: Wallet & Network Setup\nAdd Monad Testnet to your wallet:\n• RPC Endpoint: https://testnet-rpc.monad.xyz\n• Chain ID: 10143\n• Currency Symbol: MON\n\n## Step 2: Faucet Claim Sequence\nVisit faucet.monad.xyz to claim 0.5 MON daily. Join official Discord for verified role credentials.\n\n## Step 3: Mandatory Protocol Interactions (Weekly Cadence)\n1. MonadSwap — Execute 10+ swaps per month across diverse liquidity pools\n2. MonadBridge — Bridge assets from Sepolia once weekly\n3. MonadLend — Supply collateral and borrow stablecoins with safe LTV (<65%)\n4. MonadNFT — Mint weekly ecosystem commemorative badge\n\n## Sybil Prevention & Pro Tips\n• Use 3–5 distinct wallets with natural interaction intervals\n• Never fund multiple testnet wallets from the same exchange address\n• Maintain multi-month consistency rather than one-day burst volume\n\n## Expected Allocation & Timeline\nEstimated reward range: $1,200 – $6,500 per qualified wallet. Target TGE: Q1 2027. Confidence: 88%.`,
    unlocks:142, alphaVotes:89, rugVotes:12, totalEarned:2130, createdAt:Date.now()-172800000,
  },
  {
    id:'a2', title:'Whale On-Chain Accumulation BTC — Q4 Macro Thesis',
    author:'@onchain_wizard', category:'Trading', price:25,
    teaser:'On-chain order flow indicates aggressive accumulation by tier-1 institutional entities between $58K–$62K over the last 14 days. This structural pattern mirrors the pre-expansion breakout of early 2024…',
    fullContent:`## Tracked Whale Cohorts\n1. 0x3f5CE… — Accumulated 2,400 BTC across 7 trading sessions\n2. 0x8aC12… — 1,800 BTC net outflow from centralized exchanges\n3. 0xD4e9F… — Institutional custody wallet holding 5,200+ BTC without selling\n\n## Key Quantitative Indicators\n• Exchange Reserve Ratio: Down 12.4% MoM (Supply shock setup)\n• MVRV Z-Score: 1.25 — Deeply undervalued historical accumulation band\n• Long-Term Holder SOPR: Reset to neutral baseline\n\n## Macro Catalyst Confluence\nFederal Reserve rate-cutting cycle + global liquidity index expanding + post-halving structural supply contraction.\n\n## Target Trajectories\n• Tier 1: $78,000 (Initial liquidity grab)\n• Tier 2: $95,000 (Psychological resistance)\n• Cycle Target: $125,000+ upon sustained institutional ETF inflows\n\n## Risk Management\nInvalidation close below weekly 200 EMA ($51,800). Take partial 25% profits at Tier 1, hold runner core with trailing stop.`,
    unlocks:98, alphaVotes:72, rugVotes:8, totalEarned:2450, createdAt:Date.now()-86400000,
  },
  {
    id:'a3', title:'DeFi 200% APY Yield Engine — Concentrated Solana Strategy',
    author:'@defi_maxi', category:'DeFi', price:10,
    teaser:'A high-efficiency yield loop on Solana yielding 200%+ net APY by stacking recursive lending with concentrated liquidity pools. Here is the exact step-by-step risk parameter model…',
    fullContent:`## Strategy Overview: Kamino Finance × Orca Whirlpools\n\n### Step 1: Base Asset Deployment\nDeposit liquid SOL into Kamino to mint kSOL (8.2% base staking yield).\n\n### Step 2: Leverage Loop Structure\n• Borrow USDC against kSOL collateral at conservative 60% LTV\n• Swap 50% USDC back into SOL\n• Provide concentrated LP in Orca SOL/USDC Whirlpool tight range (±5%)\n• Stake resulting LP tokens into Kamino Multiply vault\n\n### Yield Breakdown\n| Source | Net APY |\n|---|---|\n| Liquid Staking Yield | 8.2% |\n| Orca Trading Fees (Concentrated) | 48.0% |\n| Recursive 3x Leverage Factor | +92.5% |\n| Protocol Token Emissions | ~52.0% |\n| **Total Blended APY** | **~200.7%** |\n\n### Risk Mitigation Matrix ⚠️\n• Impermanent loss if SOL moves >18% outside range within 48h\n• Liquidation trigger threshold: LTV >82%\n• Monitor oracle health and rebalance active LP boundaries every 48 hours`,
    unlocks:203, alphaVotes:156, rugVotes:31, totalEarned:2030, createdAt:Date.now()-259200000,
  },
  {
    id:'a4', title:'5 Blue-Chip NFTs Primed for 10x Multiple in Next Cycle',
    author:'@nft_sage', category:'NFT', price:20,
    teaser:'Following the cyclical NFT capitulation, 5 blue-chip intellectual property ecosystems are sitting at historical valuation floors ahead of major consumer brand catalysts…',
    fullContent:`## 1. Pudgy Penguins — Floor Target: 25 ETH\nGlobal retail IP distribution (Walmart, Target), consumer licensing royalties, and upcoming ecosystem token catalyst.\n\n## 2. Azuki — Floor Target: 15 ETH\nAnime production studio partnerships in Tokyo, Web3 streaming IP, and dedicated AnimeChain layer-2 infrastructure.\n\n## 3. Milady Maker — Floor Target: 12 ETH\nRemilia decentralized media collective, hyper-loyal cultural moat, and viral meme narrative dominance.\n\n## 4. DeGods — Floor Target: 8 ETH\nNew executive team transition, zero-royalty community marketplace, and multi-chain cross-pollination.\n\n## 5. Bong Bears — Floor Target: 40 ETH\nBerachain mainnet launch imminent. Direct validator delegation yield and perpetual airdrop entitlement.\n\n## Execution Playbook\n• Accumulate via DCA over a 2–4 week window\n• 40% Tier-1 Bluechip / 40% Mid-cap IP / 20% Cultural Memetic\n• Minimum investment horizon: 9–14 months`,
    unlocks:67, alphaVotes:45, rugVotes:18, totalEarned:1340, createdAt:Date.now()-345600000,
  },
  {
    id:'a5', title:'Fed Pivot & Crypto Liquidity Cycles — Macro Deep Dive',
    author:'@macro_guru', category:'Macro', price:30,
    teaser:'Upcoming central bank rate trajectory marks a generational inflection point for risk assets. Inflation telemetry and inverted yield curve unwinds indicate aggressive easing ahead…',
    fullContent:`## Key Macro Telemetry\n• Core CPI: 2.3% YoY (Target convergence zone)\n• Sahm Rule Recession Indicator: Moderating\n• 10Y-2Y Treasury Curve: Bull steepening regime\n• Global M2 Money Supply: Expanding at fastest pace since 2021\n\n## Easing Scenarios Matrix\n| Federal Reserve Decision | Market Probability | Crypto Market Impact |\n|---|---|---|\n| 25 bps Rate Cut | 65% | Gradual upside rally, BTC leading |\n| 50 bps Dovish Cut | 25% | Initial volatility followed by explosive altseason |\n| Hawkish Pause | 10% | Temporary 5-8% pullback before retest |\n\n## Asset Allocation Recommendations\n1. Bitcoin (BTC): 50% portfolio anchor (Digital monetary asset)\n2. Ethereum (ETH): 25% portfolio (Deflationary gas & staking asset)\n3. Solana (SOL) & High-Beta L1s: 20% (Consumer velocity play)\n4. Liquid Stables (USDC/USDT): 5% dry powder for flash dips`,
    unlocks:54, alphaVotes:41, rugVotes:5, totalEarned:1620, createdAt:Date.now()-432000000,
  },
  {
    id:'a6', title:'3 Stealth Meme Coins Prior to Tier-1 Exchange Listings 🚀',
    author:'@degen_lord', category:'Meme', price:5,
    teaser:'3 low-cap meme tokens currently trading in stealth pre-launch phases with organic community traction and verified market-maker pipelines before CEX announcements…',
    fullContent:`## ⚠️ HIGH RISK DEGEN SPECULATION — Maximum 1–3% portfolio risk.\n\n## 1. $SPHEREDOG (Unicity Ecosystem)\n• Contract deployed, fair-launch structure\n• 2,800 active Telegram members (zero paid bot volume)\n• Confirmed market-maker engagement for tier-2 exchange listing\n• Upside Target: 20x – 50x from initial liquidity pool price\n\n## 2. $MONADPEPE (Monad Ecosystem)\n• First culturally aligned meme coin primed for Monad mainnet\n• 5,400 organic community members\n• Primary catalyst: Mainnet ecosystem incentive distribution\n• Strategy: Enter during first 5-10 minutes of liquidity seeding\n\n## 3. $AIGIRL (Base Network)\n• Autonomous AI agent with interactive social media streaming\n• 3 verified crypto KOLs (500K+ reach) committed without presale discounts\n• Fair launch via liquidity bonding curve\n• Execution: DCA in first trading hour, strictly take initial capital off the table at 3x`,
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

/* Unlocked IDs persistence */
function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY)
    return raw ? JSON.parse(raw) as string[] : []
  } catch { return [] }
}
function saveUnlocked(ids: string[]): void {
  try { localStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

/* Transaction history persistence */
function loadTxHistory(): TxRecord[] {
  try {
    const raw = localStorage.getItem(TX_KEY)
    if (raw) return JSON.parse(raw) as TxRecord[]
    return [
      {
        id: 'tx_init_1',
        type: 'earn',
        title: 'Monad Testnet Airdrop Strategy',
        amount: 15,
        counterparty: '@whale99',
        timestamp: Date.now() - 3600000 * 3,
        txHash: '0x8f2a49b1c7e094',
        status: 'confirmed',
      },
      {
        id: 'tx_init_2',
        type: 'earn',
        title: 'Whale On-Chain Accumulation BTC',
        amount: 25,
        counterparty: '@degen_ser',
        timestamp: Date.now() - 3600000 * 8,
        txHash: '0x3b190fe721dc58',
        status: 'confirmed',
      },
    ]
  } catch {
    return []
  }
}
function saveTxHistory(list: TxRecord[]): void {
  try { localStorage.setItem(TX_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

/* User vote persistence */
function loadUserVotes(): Record<string, 'alpha' | 'rug'> {
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) as Record<string, 'alpha' | 'rug'> : {}
  } catch {
    return {}
  }
}
function saveUserVotes(v: Record<string, 'alpha' | 'rug'>): void {
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(v))
  } catch { /* ignore */ }
}

/* Published alphas persistence */
function loadCustomAlphas(): AlphaPost[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    return raw ? JSON.parse(raw) as AlphaPost[] : []
  } catch {
    return []
  }
}
function saveCustomAlphas(list: AlphaPost[]): void {
  try {
    const custom = list.filter(a => !SEED.some(s => s.id === a.id))
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom))
  } catch { /* ignore */ }
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
  const [alphas, setAlphas]         = useState<AlphaPost[]>(() => [...loadCustomAlphas(), ...SEED])
  const [userVotes, setUserVotes]   = useState<Record<string, 'alpha' | 'rug'>>(loadUserVotes)
  const [ticker, setTicker]         = useState<string[]>(
    ['🔥 @whale99 unlocked "Whale BTC Q4" — 25 UCT','⚡ @degen_ser unlocked "Meme Coin Stealth" — 5 UCT','🚀 @alpha_sniper unlocked "DeFi Yield 200%" — 10 UCT','💎 @moon_chaser unlocked "Monad Airdrop" — 15 UCT','👑 @diamond_paws voted ALPHA 🔥 on "Fed Pivot"'],
  )
  const [tab, setTab]               = useState<Tab>('feed')
  const [bumpQ, setBumpQ]           = useState<string[]>([])
  const [shakingId, setShakingId]   = useState<string | null>(null)
  const [glowId, setGlowId]        = useState<string | null>(null)
  const [unlocked, setUnlocked]     = useState<Set<string>>(() => new Set(loadUnlocked()))
  const [transactions, setTransactions] = useState<TxRecord[]>(loadTxHistory)
  const [dashTab, setDashTab]       = useState<'published' | 'library' | 'history'>('published')
  const [txFilter, setTxFilter]     = useState<'all' | 'unlock' | 'earn' | 'publish'>('all')
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
  const pdfInputRef             = useRef<HTMLInputElement>(null)

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
      setUnlocked(prev => {
        const merged = new Set([...prev, ...d.unlockedIds])
        saveUnlocked([...merged])
        return merged
      })
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
        const { autoConnect } = await import('@unicitylabs/sphere-sdk/connect/browser')
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
      const { autoConnect } = await import('@unicitylabs/sphere-sdk/connect/browser')
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
    flash(`🧪 Demo profile: ${p.nametag} (${p.balance} UCT)`)
  }, [flash])

  /* ── disconnect ────────────────────────────── */
  const disconnect = useCallback(async () => {
    if (w.client) { try { await w.client.disconnect() } catch { /* ignore */ } }
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(DEMO_KEY)
    setW({ status:'disconnected', nametag:'', address:'', balance:0, sessionId:'', client:null, uctCoinId: UCT_COIN_ID })
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

    setAlphas(prev => {
      const next = prev.map(a => a.id === alpha.id ? { ...a, unlocks: a.unlocks + 1, totalEarned: a.totalEarned + alpha.price } : a)
      saveCustomAlphas(next)
      return next
    })

    setUnlocked(prev => {
      const next = new Set(prev).add(alpha.id)
      saveUnlocked([...next])
      return next
    })

    /* Add to transaction history */
    const tx: TxRecord = {
      id: 'tx_' + uid(),
      type: 'unlock',
      title: alpha.title,
      amount: alpha.price,
      counterparty: alpha.author,
      timestamp: Date.now(),
      txHash: '0x' + uid() + uid(),
      status: 'confirmed',
    }
    setTransactions(prev => {
      const next = [tx, ...prev]
      saveTxHistory(next)
      return next
    })

    setTicker(t => [`⚡ ${w.nametag || 'anon'} unlocked "${alpha.title.slice(0,26)}…" — ${alpha.price} UCT`, ...t].slice(0, 50))
    bump(alpha.id)
    flash(`🔓 Unlocked! −${alpha.price} UCT`)
    const updated = { ...alpha, unlocks: alpha.unlocks + 1, totalEarned: alpha.totalEarned + alpha.price }
    setTimeout(() => setReadAlpha(updated), 400)
  }, [connected, unlocked, w, bump, flash])

  /* ── simulate buy ──────────────────────────── */
  const simBuy = useCallback(() => {
    const a = pick(alphas), u = pick(FAKE_READERS)
    setAlphas(prev => {
      const next = prev.map(x => x.id === a.id ? { ...x, unlocks: x.unlocks + 1, totalEarned: x.totalEarned + x.price } : x)
      saveCustomAlphas(next)
      return next
    })
    setTicker(t => [`🔥 ${u} unlocked "${a.title.slice(0,26)}…" — ${a.price} UCT`, ...t].slice(0, 50))
    bump(a.id)
    flash(`⚡ ${u} unlocked alpha!`)

    /* Add simulated transaction record */
    const tx: TxRecord = {
      id: 'tx_' + uid(),
      type: 'earn',
      title: a.title,
      amount: a.price,
      counterparty: u,
      timestamp: Date.now(),
      txHash: '0x' + uid() + uid(),
      status: 'confirmed',
    }
    setTransactions(prev => {
      const next = [tx, ...prev]
      saveTxHistory(next)
      return next
    })
  }, [alphas, bump, flash])

  /* ── vote (mutually exclusive with undo/toggle) ── */
  const doVote = useCallback((id: string, kind: 'alpha' | 'rug') => {
    const currentVote = userVotes[id]

    if (currentVote === kind) {
      /* UNDO vote: user clicks the same button again */
      setUserVotes(prev => {
        const next = { ...prev }
        delete next[id]
        saveUserVotes(next)
        return next
      })

      setAlphas(prev => {
        const next = prev.map(a => {
          if (a.id !== id) return a
          return {
            ...a,
            alphaVotes: kind === 'alpha' ? Math.max(0, a.alphaVotes - 1) : a.alphaVotes,
            rugVotes: kind === 'rug' ? Math.max(0, a.rugVotes - 1) : a.rugVotes,
          }
        })
        saveCustomAlphas(next)
        return next
      })

      if (readAlpha?.id === id) {
        setReadAlpha(r => r ? {
          ...r,
          alphaVotes: kind === 'alpha' ? Math.max(0, r.alphaVotes - 1) : r.alphaVotes,
          rugVotes: kind === 'rug' ? Math.max(0, r.rugVotes - 1) : r.rugVotes,
        } : r)
      }

      flash(kind === 'alpha' ? '↩️ Alpha vote cancelled' : '↩️ Rug vote cancelled')
    } else if (currentVote) {
      /* SWITCH vote: user changes mind to the other option */
      setUserVotes(prev => {
        const next = { ...prev, [id]: kind }
        saveUserVotes(next)
        return next
      })

      setAlphas(prev => {
        const next = prev.map(a => {
          if (a.id !== id) return a
          return {
            ...a,
            alphaVotes: kind === 'alpha' ? a.alphaVotes + 1 : Math.max(0, a.alphaVotes - 1),
            rugVotes: kind === 'rug' ? a.rugVotes + 1 : Math.max(0, a.rugVotes - 1),
          }
        })
        saveCustomAlphas(next)
        return next
      })

      if (readAlpha?.id === id) {
        setReadAlpha(r => r ? {
          ...r,
          alphaVotes: kind === 'alpha' ? r.alphaVotes + 1 : Math.max(0, r.alphaVotes - 1),
          rugVotes: kind === 'rug' ? r.rugVotes + 1 : Math.max(0, r.rugVotes - 1),
        } : r)
      }

      flash(kind === 'alpha' ? '🔥 Switched vote: ALPHA!' : '💩 Switched vote: RUG!')
    } else {
      /* FIRST VOTE */
      setUserVotes(prev => {
        const next = { ...prev, [id]: kind }
        saveUserVotes(next)
        return next
      })

      setAlphas(prev => {
        const next = prev.map(a => {
          if (a.id !== id) return a
          return {
            ...a,
            alphaVotes: kind === 'alpha' ? a.alphaVotes + 1 : a.alphaVotes,
            rugVotes: kind === 'rug' ? a.rugVotes + 1 : a.rugVotes,
          }
        })
        saveCustomAlphas(next)
        return next
      })

      if (readAlpha?.id === id) {
        setReadAlpha(r => r ? {
          ...r,
          alphaVotes: kind === 'alpha' ? r.alphaVotes + 1 : r.alphaVotes,
          rugVotes: kind === 'rug' ? r.rugVotes + 1 : r.rugVotes,
        } : r)
      }

      flash(kind === 'alpha' ? '🔥 Voted ALPHA!' : '💩 Voted RUG!')
    }
  }, [userVotes, readAlpha, flash])

  /* ── publish ───────────────────────────────── */
  const doPublish = useCallback(() => {
    if (!uTitle.trim() || !uTeaser.trim() || !uBody.trim()) { flash('⚠️ Please fill in all required fields', false); return }
    if (uPrice < 1 || isNaN(uPrice)) { flash('⚠️ Minimum price is 1 UCT', false); return }
    const a: AlphaPost = {
      id: uid(), title: uTitle.trim(), author: w.nametag || shortAddr(w.address),
      category: uCat, price: Math.max(1, Math.round(uPrice)), teaser: uTeaser.trim(), fullContent: uBody.trim(),
      unlocks: 0, alphaVotes: 0, rugVotes: 0, totalEarned: 0, createdAt: Date.now(),
      pdfName: uPdf.trim() || undefined,
    }
    setAlphas(prev => {
      const next = [a, ...prev]
      saveCustomAlphas(next)
      return next
    })

    /* Add publication transaction record */
    const tx: TxRecord = {
      id: 'tx_' + uid(),
      type: 'publish',
      title: a.title,
      amount: 0,
      counterparty: 'Unicity Network',
      timestamp: Date.now(),
      txHash: '0x' + uid() + uid(),
      status: 'confirmed',
    }
    setTransactions(prev => {
      const next = [tx, ...prev]
      saveTxHistory(next)
      return next
    })

    bump(a.id)
    setTicker(t => [`📝 ${a.author} posted "${a.title.slice(0,28)}…"`, ...t].slice(0, 50))
    setUTitle(''); setUTeaser(''); setUBody(''); setUPrice(10); setUPdf('')
    if (pdfInputRef.current) pdfInputRef.current.value = ''
    setTab('feed'); flash('✅ Alpha published successfully!')
  }, [uTitle, uTeaser, uBody, uCat, uPrice, uPdf, w.nametag, w.address, bump, flash])

  /* ── derived ───────────────────────────────── */
  const king           = alphas.reduce((b, a) => a.totalEarned > b.totalEarned ? a : b, alphas[0])
  const myTag          = w.nametag || (connected ? shortAddr(w.address) : '')
  const myAlphas       = alphas.filter(a => a.author === myTag)
  const myEarned       = myAlphas.reduce((s, a) => s + a.totalEarned, 0)
  const myReads        = myAlphas.reduce((s, a) => s + a.unlocks, 0)
  const unlockedAlphas = alphas.filter(a => unlocked.has(a.id))
  const filteredTx     = transactions.filter(t => txFilter === 'all' || t.type === txFilter)
  const sorted         = [
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
            {([
              ['feed', 'Alpha Feed', <Sparkles key="f" className="w-3.5 h-3.5" />],
              ['library', 'My Library', <BookOpen key="l" className="w-3.5 h-3.5" />, unlockedAlphas.length],
              ['publish', 'Publish Alpha', <Upload key="p" className="w-3.5 h-3.5" />],
              ['dashboard', 'Creator & Activity', <BarChart3 key="d" className="w-3.5 h-3.5" />, transactions.length],
            ] as [Tab, string, ReactNode, number?][]).map(([k, label, icon, badge]) => (
              <button
                key={k}
                onClick={() => {
                  if ((k === 'publish' || k === 'dashboard') && !connected) {
                    flash('⚠️ Connect wallet first', false)
                    return
                  }
                  setTab(k)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg cursor-pointer transition-colors"
                style={
                  tab === k
                    ? {
                        background: 'rgba(255,255,255,.06)',
                        color: '#F1F5F9',
                        borderTop: '1px solid rgba(255,87,34,.35)',
                        borderLeft: '1px solid rgba(255,255,255,.06)',
                        borderRight: '1px solid rgba(255,255,255,.06)',
                      }
                    : { color: 'rgba(148,163,184,.5)' }
                }
              >
                {icon}
                <span>{label}</span>
                {typeof badge === 'number' && badge > 0 && (
                  <span
                    className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold"
                    style={{
                      background: k === 'library' ? 'rgba(56,189,248,.15)' : 'rgba(255,87,34,.15)',
                      color: k === 'library' ? '#38BDF8' : '#FF5722',
                      border: `1px solid ${k === 'library' ? 'rgba(56,189,248,.3)' : 'rgba(255,87,34,.3)'}`,
                    }}
                  >
                    {badge}
                  </span>
                )}
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
                  {bumpQ.slice(0, 3).map(id => {
                    const a = alphas.find(x => x.id === id)
                    return a ? (
                      <Card
                        key={a.id}
                        a={a}
                        shaking={shakingId === a.id}
                        glowing={glowId === a.id}
                        open={unlocked.has(a.id)}
                        onUnlock={doUnlock}
                        onVote={doVote}
                        userVote={userVotes[a.id]}
                      />
                    ) : null
                  })}
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
                  <Card
                    key={a.id}
                    a={a}
                    shaking={shakingId === a.id}
                    glowing={glowId === a.id}
                    open={unlocked.has(a.id)}
                    onUnlock={doUnlock}
                    onVote={doVote}
                    userVote={userVotes[a.id]}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* === MY LIBRARY (UNLOCKED ALPHAS) === */}
        {tab === 'library' && (
          <div className="anim-fade-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
                  <BookOpen className="w-5 h-5" style={{ color: '#38BDF8' }} /> My Library — Unlocked Research & PDFs
                </h2>
                <p className="text-xs" style={{ color: 'rgba(148,163,184,.6)' }}>
                  All research reports and documents you have unlocked with UCT. Available to re-read anytime.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.25)', color: '#38BDF8', fontFamily: 'JetBrains Mono,monospace' }}>
                <Check className="w-3.5 h-3.5" />
                <span>{unlockedAlphas.length} Unlocked Reports</span>
              </div>
            </div>

            {unlockedAlphas.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(12,13,20,.6)', border: '1px dashed rgba(255,255,255,.08)' }}>
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white mb-1">Your library is empty</h3>
                <p className="text-xs max-w-md mx-auto mb-5" style={{ color: 'rgba(148,163,184,.5)' }}>
                  You haven't unlocked any alpha reports yet. Browse the Alpha Feed and unlock research or leak reports with UCT to read them here anytime.
                </p>
                <button
                  onClick={() => setTab('feed')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg,#FF5722,#FF8A00)', boxShadow: '0 4px 18px rgba(255,87,34,.25)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Browse Alpha Feed
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAlphas.map(a => (
                  <Card
                    key={a.id}
                    a={a}
                    shaking={shakingId === a.id}
                    glowing={glowId === a.id}
                    open={true}
                    onUnlock={() => setReadAlpha(a)}
                    onVote={doVote}
                    userVote={userVotes[a.id]}
                  />
                ))}
              </div>
            )}
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
              
              {/* PDF upload with Cancel / Remove capability */}
              <Fld label="Attach PDF (optional)">
                {!uPdf ? (
                  <label className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-[#FF5722]/50 hover:bg-white/[0.02] cursor-pointer text-sm text-slate-400 hover:text-white transition-all">
                    <FileText className="w-4 h-4 text-[#FF5722]" />
                    <span>Choose PDF research / document file...</span>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setUPdf(file.name)
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-sky-500/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-200 truncate">{uPdf}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-[#38BDF8] border border-sky-500/20 flex-shrink-0">
                        PDF Attached
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors cursor-pointer"
                        title="Choose another PDF file"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUPdf('')
                          if (pdfInputRef.current) pdfInputRef.current.value = ''
                          flash('📎 PDF attachment removed')
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                        title="Remove PDF attachment"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setUPdf(file.name)
                      }}
                    />
                  </div>
                )}
              </Fld>

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
                <Stat
                  icon={<Flame className="w-5 h-5" />}
                  label="Alpha Rating"
                  val={(() => {
                    const totalAlpha = myAlphas.reduce((s, a) => s + a.alphaVotes, 0)
                    const totalRug   = myAlphas.reduce((s, a) => s + a.rugVotes, 0)
                    const totalVotes = totalAlpha + totalRug
                    return totalVotes > 0 ? `${Math.round((totalAlpha / totalVotes) * 100)}%` : '—'
                  })()}
                  color="#10B981"
                />
              </div>
            </div>

            {/* Subtabs Switcher */}
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
              <button
                onClick={() => setDashTab('published')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                style={
                  dashTab === 'published'
                    ? { background: 'rgba(255,87,34,.15)', color: '#FF5722', border: '1px solid rgba(255,87,34,.3)' }
                    : { background: 'rgba(255,255,255,.03)', color: 'rgba(148,163,184,.6)', border: '1px solid rgba(255,255,255,.05)' }
                }
              >
                <BookOpen className="w-3.5 h-3.5" /> Published Alphas ({myAlphas.length})
              </button>
              <button
                onClick={() => setDashTab('library')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                style={
                  dashTab === 'library'
                    ? { background: 'rgba(56,189,248,.15)', color: '#38BDF8', border: '1px solid rgba(56,189,248,.3)' }
                    : { background: 'rgba(255,255,255,.03)', color: 'rgba(148,163,184,.6)', border: '1px solid rgba(255,255,255,.05)' }
                }
              >
                <Check className="w-3.5 h-3.5" /> Unlocked Library ({unlockedAlphas.length})
              </button>
              <button
                onClick={() => setDashTab('history')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                style={
                  dashTab === 'history'
                    ? { background: 'rgba(16,185,129,.15)', color: '#10B981', border: '1px solid rgba(16,185,129,.3)' }
                    : { background: 'rgba(255,255,255,.03)', color: 'rgba(148,163,184,.6)', border: '1px solid rgba(255,255,255,.05)' }
                }
              >
                <History className="w-3.5 h-3.5" /> Transaction History ({transactions.length})
              </button>
            </div>

            {/* Subtab: Published */}
            {dashTab === 'published' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: 'rgba(148,163,184,.6)' }}>
                    <BookOpen className="w-3.5 h-3.5" /> My Published Alphas
                  </h3>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-white/[0.02] px-2.5 py-1 rounded-full border border-white/[0.05]">
                    <Shield className="w-3 h-3 text-[#FF5722]" /> Read-Only (Published & Immutable)
                  </span>
                </div>
                {myAlphas.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(12,13,20,.5)', border: '1px dashed rgba(255,255,255,.07)' }}>
                    <Upload className="w-8 h-8 mx-auto mb-3 opacity-25" />
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,.45)' }}>No alpha published yet.</p>
                    <button onClick={() => setTab('publish')} className="mt-3 text-xs cursor-pointer" style={{ color: '#FF5722' }}>
                      → Publish first alpha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myAlphas.map(a => (
                      <Card
                        key={a.id}
                        a={a}
                        shaking={false}
                        glowing={false}
                        open
                        onUnlock={() => setReadAlpha(a)}
                        onVote={doVote}
                        owner
                        userVote={userVotes[a.id]}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtab: Library */}
            {dashTab === 'library' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: '#38BDF8' }}>
                    <BookOpen className="w-3.5 h-3.5" /> My Unlocked Alphas & PDFs ({unlockedAlphas.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Unlimited lifetime re-reading access
                  </span>
                </div>
                {unlockedAlphas.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(12,13,20,.5)', border: '1px dashed rgba(255,255,255,.07)' }}>
                    <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-25 text-[#38BDF8]" />
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,.45)' }}>You haven't unlocked any alpha reports yet.</p>
                    <button onClick={() => setTab('feed')} className="mt-3 text-xs cursor-pointer" style={{ color: '#FF5722' }}>
                      → Browse Alpha Feed
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unlockedAlphas.map(a => (
                      <Card
                        key={a.id}
                        a={a}
                        shaking={shakingId === a.id}
                        glowing={glowId === a.id}
                        open
                        onUnlock={() => setReadAlpha(a)}
                        onVote={doVote}
                        userVote={userVotes[a.id]}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtab: History */}
            {dashTab === 'history' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: '#10B981' }}>
                      <History className="w-3.5 h-3.5" /> Transaction Ledger & Activity
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      On-chain payments, creator payouts, and alpha publication records
                    </p>
                  </div>
                  {/* Filters */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[11px]">
                    {(['all', 'unlock', 'earn', 'publish'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setTxFilter(f)}
                        className="px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer"
                        style={
                          txFilter === f
                            ? { background: 'rgba(255,255,255,.1)', color: '#FFF', fontWeight: 600 }
                            : { color: 'rgba(148,163,184,.5)' }
                        }
                      >
                        {f === 'all' ? `All (${transactions.length})` : f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTx.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(12,13,20,.5)', border: '1px dashed rgba(255,255,255,.07)' }}>
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-25 text-slate-500" />
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,.45)' }}>No transactions found for this filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border" style={{ background: 'rgba(12,13,20,.8)', borderColor: 'rgba(255,255,255,.07)' }}>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,.06)', color: 'rgba(148,163,184,.5)' }}>
                          <th className="py-3 px-4 font-semibold">Type</th>
                          <th className="py-3 px-4 font-semibold">Title / Description</th>
                          <th className="py-3 px-4 font-semibold">Counterparty</th>
                          <th className="py-3 px-4 font-semibold">Amount</th>
                          <th className="py-3 px-4 font-semibold">Date & Time</th>
                          <th className="py-3 px-4 font-semibold">Tx Hash / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                        {filteredTx.map(tx => (
                          <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              {tx.type === 'unlock' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                  <ArrowUpRight className="w-3 h-3" /> Pay-to-Read
                                </span>
                              )}
                              {tx.type === 'earn' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-[#10B981] border border-emerald-500/20">
                                  <ArrowDownLeft className="w-3 h-3" /> Reader Payout
                                </span>
                              )}
                              {tx.type === 'publish' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-[#38BDF8] border border-sky-500/20">
                                  <Upload className="w-3 h-3" /> Published
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-xs font-medium text-slate-200 truncate">
                              {tx.title}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]" style={{ color: '#A78BFA' }}>
                              {tx.counterparty}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                              {tx.type === 'unlock' && <span className="text-red-400">−{tx.amount} UCT</span>}
                              {tx.type === 'earn' && <span className="text-[#10B981]">+{tx.amount} UCT</span>}
                              {tx.type === 'publish' && <span className="text-slate-500">Free</span>}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                              {ago(tx.timestamp)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-slate-500 truncate max-w-[90px]" title={tx.txHash}>{tx.txHash.slice(0, 10)}…</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════ READING MODAL ═══════════════════════ */}
      {readAlpha && (
        <ReadModal
          alpha={alphas.find(a => a.id === readAlpha.id) ?? readAlpha}
          isOpen={unlocked.has(readAlpha.id) || myAlphas.some(x => x.id === readAlpha.id)}
          onClose={() => setReadAlpha(null)}
          onUnlock={doUnlock}
          onVote={doVote}
          userVote={userVotes[readAlpha.id]}
        />
      )}

      {/* ════ DEMO SELECTOR MODAL ═════════════════ */}
      {demoModal && (
        <div className="fixed inset-0 z-50 modal-bg flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDemoModal(false) }}>
          <div className="w-full max-w-sm rounded-2xl p-6 anim-fade-up" style={{ background: 'rgba(10,10,18,.98)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Wallet className="w-5 h-5" style={{ color: '#FF5722' }} /><h3 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>Sphere Wallet Connect</h3></div><button onClick={() => setDemoModal(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button></div>
            <p className="text-xs mb-1" style={{ color: 'rgba(148,163,184,.5)' }}>Sphere Wallet not detected (localhost/preview). Select a demo profile:</p>
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: 'rgba(255,87,34,.05)', border: '1px solid rgba(255,87,34,.18)', color: 'rgba(255,138,0,.75)' }}>ℹ️ In production, identity connects directly from user's Sphere Wallet via ConnectClient.</div>
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
function Card({ a, shaking, glowing, open, onUnlock, onVote, owner, userVote }: {
  a: AlphaPost; shaking: boolean; glowing: boolean; open: boolean
  onUnlock: (a: AlphaPost) => void; onVote: (id: string, k: 'alpha' | 'rug') => void; owner?: boolean
  userVote?: 'alpha' | 'rug'
}) {
  const total    = a.alphaVotes + a.rugVotes
  const alphaPct = total ? Math.round((a.alphaVotes / total) * 100) : 0
  const rugPct   = total ? 100 - alphaPct : 0

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
        <span className="flex items-center gap-1 ml-auto font-mono text-[11px]" style={{ color: total ? '#10B981' : 'rgba(148,163,184,.4)' }}>
          <Flame className="w-3 h-3" />{total ? `${alphaPct}%` : '0%'}
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px]" style={{ color: total ? '#FF5722' : 'rgba(148,163,184,.4)' }}>
          <ThumbsDown className="w-3 h-3" />{total ? `${rugPct}%` : '0%'}
        </span>
      </div>
      <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: total ? `${alphaPct}%` : '0%',
            background: 'linear-gradient(to right,#10B981,rgba(16,185,129,.4))',
          }}
        />
      </div>
      <div className="p-4 pt-2 flex gap-2">
        {owner ? (
          <button
            onClick={() => onUnlock(a)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{ background: 'rgba(255,87,34,.08)', color: '#FF5722', border: '1px solid rgba(255,87,34,.2)' }}
            title="Read-only: Preview your publication"
          >
            <Eye className="w-3.5 h-3.5" /> View Alpha (Read-Only)
          </button>
        ) : open ? (
          <button onClick={() => onUnlock(a)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all" style={{ background: 'rgba(16,185,129,.08)', color: '#10B981', border: '1px solid rgba(16,185,129,.2)' }}><BookOpen className="w-3.5 h-3.5" /> Read</button>
        ) : (
          <button onClick={() => onUnlock(a)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg,#FF5722,#FF8A00)', boxShadow: '0 2px 12px rgba(255,87,34,.2)' }}><Lock className="w-3.5 h-3.5" /> Unlock — {a.price} UCT</button>
        )}
        {!owner && (
          <>
            <button
              type="button"
              onClick={() => onVote(a.id, 'alpha')}
              title={userVote === 'alpha' ? 'Cancel Alpha vote (Undo)' : 'Vote Alpha 🔥'}
              className="px-2.5 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center"
              style={
                userVote === 'alpha'
                  ? { background: 'rgba(16,185,129,.25)', border: '1px solid #10B981', color: '#10B981', boxShadow: '0 0 12px rgba(16,185,129,.4)' }
                  : { background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', color: '#10B981' }
              }
            >
              <Flame className={`w-3.5 h-3.5 ${userVote === 'alpha' ? 'fill-[#10B981]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onVote(a.id, 'rug')}
              title={userVote === 'rug' ? 'Cancel Rug vote (Undo)' : 'Vote Rug 💩'}
              className="px-2.5 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center"
              style={
                userVote === 'rug'
                  ? { background: 'rgba(255,87,34,.25)', border: '1px solid #FF5722', color: '#FF5722', boxShadow: '0 0 12px rgba(255,87,34,.4)' }
                  : { background: 'rgba(255,87,34,.06)', border: '1px solid rgba(255,87,34,.15)', color: '#FF5722' }
              }
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${userVote === 'rug' ? 'fill-[#FF5722]' : ''}`} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Reading Modal ───────────────────────────── */
function ReadModal({ alpha, isOpen, onClose, onUnlock, onVote, userVote }: {
  alpha: AlphaPost; isOpen: boolean; onClose: () => void
  onUnlock: (a: AlphaPost) => void; onVote: (id: string, k: 'alpha' | 'rug') => void
  userVote?: 'alpha' | 'rug'
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold" style={{ color: 'rgba(148,163,184,.6)' }}>Rate this alpha:</p>
                  {userVote && (
                    <span className="text-[11px] text-slate-400">
                      💡 Click the same button again to cancel your vote (undo)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onVote(alpha.id, 'alpha')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all"
                    style={
                      userVote === 'alpha'
                        ? { background: 'rgba(16,185,129,.22)', color: '#10B981', border: '1px solid #10B981', boxShadow: '0 0 14px rgba(16,185,129,.4)' }
                        : { background: 'rgba(16,185,129,.08)', color: '#10B981', border: '1px solid rgba(16,185,129,.25)' }
                    }
                  >
                    <Flame className={`w-4 h-4 ${userVote === 'alpha' ? 'fill-[#10B981]' : ''}`} />
                    {userVote === 'alpha' ? 'Voted ALPHA 🔥' : 'Alpha 🔥'}
                    <span className="text-xs opacity-75 font-mono">({alpha.alphaVotes})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onVote(alpha.id, 'rug')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all"
                    style={
                      userVote === 'rug'
                        ? { background: 'rgba(255,87,34,.22)', color: '#FF5722', border: '1px solid #FF5722', boxShadow: '0 0 14px rgba(255,87,34,.4)' }
                        : { background: 'rgba(255,87,34,.08)', color: '#FF5722', border: '1px solid rgba(255,87,34,.25)' }
                    }
                  >
                    <ThumbsDown className={`w-4 h-4 ${userVote === 'rug' ? 'fill-[#FF5722]' : ''}`} />
                    {userVote === 'rug' ? 'Voted RUG 💩' : 'Rug 💩'}
                    <span className="text-xs opacity-75 font-mono">({alpha.rugVotes})</span>
                  </button>
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
