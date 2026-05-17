'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/stats-card'
import {
  UtensilsCrossed,
  FolderTree,
  TicketPercent,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  Plus,
  Clock,
  PieChart,
} from 'lucide-react'
import {
  Button,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Progress,
} from '@heroui/react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    items: 0,
    categories: 0,
    promos: 0,
    activeItems: 0,
    unavailableItems: 0,
    avgPrice: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const lbTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Beirut',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date())
      setCurrentTime(lbTime)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [items, cats, promos] = await Promise.all([
          supabase.from('items').select('id, available, price'),
          supabase.from('categories').select('id'),
          supabase.from('promo_codes').select('id'),
        ])

        const firstErr = items.error || cats.error || promos.error
        if (firstErr) {
          toast.error(firstErr.message || 'Failed to load dashboard')
        }

        const itemsData = items.data || []
        const totalItems = itemsData.length
        const activeItems = itemsData.filter(i => i.available).length
        const avgPrice = totalItems > 0
          ? itemsData.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0) / totalItems
          : 0

        setStats({
          items: totalItems,
          categories: cats.data?.length || 0,
          promos: promos.data?.length || 0,
          activeItems: activeItems,
          unavailableItems: totalItems - activeItems,
          avgPrice: avgPrice,
        })
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="w-10 h-10 animate-pulse text-orange-500" />
        <p className="text-sm text-muted-foreground animate-pulse font-mono uppercase tracking-widest">Gathering Data...</p>
      </div>
    )
  }

  const menuHealth = (stats.activeItems / (stats.items || 1)) * 100

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Command Center</h1>
          <p className="text-default-500 font-medium">Real-time menu performance & analytics.</p>
        </div>
        <Card className="bg-content1/50 backdrop-blur-xl border border-divider shadow-xl rounded-3xl">
          <CardBody className="py-3 px-6 flex flex-row items-center gap-4">
            <div className="flex flex-col items-center md:items-end">
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em]">Beirut Time (EET)</p>
              <p className="text-2xl font-black font-mono">{currentTime}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500 animate-pulse" />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          icon={UtensilsCrossed}
          label="Total Products"
          value={stats.items}
          subtext={`${stats.activeItems} items online`}
          delay={0.1}
        />
        <StatsCard
          icon={FolderTree}
          label="Menu Categories"
          value={stats.categories}
          subtext="Navigation blocks"
          delay={0.2}
        />
        <StatsCard
          icon={TicketPercent}
          label="Avg. Item Price"
          value={stats.avgPrice}
          prefix="$"
          decimals={2}
          subtext="Market positioning"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-content1/50 backdrop-blur-md border border-divider rounded-3xl shadow-xl overflow-hidden group">
          <CardHeader className="p-6 flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Menu Health Score</h2>
            </div>
            <p className="text-xs text-default-400">Percentage of available items vs total items.</p>
          </CardHeader>
          <CardBody className="p-8 pt-0 flex flex-col items-center justify-center text-center gap-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96" cy="96" r="88"
                  className="stroke-divider fill-none"
                  strokeWidth="12"
                />
                <circle
                  cx="96" cy="96" r="88"
                  className="stroke-orange-500 fill-none transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  strokeDasharray={552.92}
                  strokeDashoffset={552.92 - (552.92 * menuHealth) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black tracking-tighter">{Math.round(menuHealth)}%</span>
                <span className="text-[10px] text-default-500 font-bold uppercase tracking-widest">Optimized</span>
              </div>
            </div>
            <div className="grid grid-cols-2 w-full gap-4">
                <div className="p-4 rounded-2xl bg-success/10 border border-success/20">
                    <p className="text-[10px] text-success font-bold uppercase tracking-widest mb-1">Online</p>
                    <p className="text-2xl font-black">{stats.activeItems}</p>
                </div>
                <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20">
                    <p className="text-[10px] text-danger font-bold uppercase tracking-widest mb-1">Offline</p>
                    <p className="text-2xl font-black">{stats.unavailableItems}</p>
                </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card className="bg-content1/50 backdrop-blur-md border border-divider rounded-3xl shadow-xl">
            <CardHeader className="p-6 pb-0 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Quick Actions</h2>
            </CardHeader>
            <CardBody className="p-6 grid grid-cols-2 gap-4">
                <Button as={Link} href="/admin/items" color="warning" variant="flat" className="h-24 rounded-2xl flex flex-col gap-2 font-bold shadow-sm">
                    <Plus className="w-6 h-6" />
                    New Item
                </Button>
                <Button as={Link} href="/admin/categories" color="primary" variant="flat" className="h-24 rounded-2xl flex flex-col gap-2 font-bold shadow-sm">
                    <FolderTree className="w-6 h-6" />
                    Sort Menu
                </Button>
                <Button as={Link} href="/admin/promo-codes" color="secondary" variant="flat" className="h-24 rounded-2xl flex flex-col gap-2 font-bold shadow-sm">
                    <TicketPercent className="w-6 h-6" />
                    Promos
                </Button>
                <Button as={Link} href="/admin/settings" color="default" variant="flat" className="h-24 rounded-2xl flex flex-col gap-2 font-bold shadow-sm">
                    <TrendingUp className="w-6 h-6" />
                    Settings
                </Button>
            </CardBody>
          </Card>

          <Card className="bg-content1/50 backdrop-blur-md border border-divider rounded-3xl shadow-xl overflow-hidden">
             <CardBody className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold">System Integrity</h3>
                    <Chip size="sm" color="success" variant="flat" className="font-bold">ALL GREEN</Chip>
                </div>
                <div className="space-y-4 pt-2">
                    {[
                        { label: 'API Latency', value: 98, color: 'success' },
                        { label: 'DB Load', value: 12, color: 'primary' },
                        { label: 'Storage', value: 84, color: 'warning' },
                    ].map((sys, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-default-500">
                                <span>{sys.label}</span>
                                <span>{sys.value}%</span>
                            </div>
                            <Progress size="sm" color={sys.color} value={sys.value} className="max-w-md" />
                        </div>
                    ))}
                </div>
             </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
