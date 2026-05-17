'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/stats-card'
import {
  UtensilsCrossed,
  FolderTree,
  TicketPercent,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCcw,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@heroui/react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    items: 0,
    categories: 0,
    promos: 0,
    activeItems: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [items, cats, promos, orders] = await Promise.all([
          supabase.from('items').select('id, available'),
          supabase.from('categories').select('id'),
          supabase.from('promo_codes').select('id'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
        ])

        const firstErr = items.error || cats.error || promos.error || orders.error
        if (firstErr) {
          toast.error(firstErr.message || 'Failed to load dashboard')
        }

        setStats({
          items: items.data?.length || 0,
          categories: cats.data?.length || 0,
          promos: promos.data?.length || 0,
          activeItems: items.data?.filter(i => i.available).length || 0
        })
        setRecentOrders(orders.data || [])
      } catch (err) {
        console.error('Error loading dashboard:', err)
        toast.error(err?.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCcw className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight">Analytics</h1>
        <p className="text-default-500 font-medium">Monitoring your restaurant performance in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={UtensilsCrossed}
          label="Menu Items"
          value={stats.items}
          subtext={`${stats.activeItems} items online`}
          delay={0.1}
        />
        <StatsCard
          icon={FolderTree}
          label="Categories"
          value={stats.categories}
          subtext="Menu sections"
          delay={0.2}
        />
        <StatsCard
          icon={TicketPercent}
          label="Promo Codes"
          value={stats.promos}
          subtext="Active discounts"
          delay={0.3}
        />
        <StatsCard
          icon={TrendingUp}
          label="Daily Growth"
          value={12.4}
          suffix="%"
          decimals={1}
          accent
          subtext="+2.1% from yesterday"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold tracking-tight">Recent Orders</h2>
            <Button
              as={Link}
              href="/admin/orders"
              variant="light"
              color="warning"
              size="sm"
              className="font-bold"
              endContent={<ChevronRight className="w-4 h-4" />}
            >
              View All
            </Button>
          </div>

          <Table
            aria-label="Recent orders table"
            classNames={{
              wrapper: "bg-content1/50 backdrop-blur-md shadow-xl rounded-3xl border border-divider",
              th: "bg-content2 text-default-500 font-bold",
            }}
          >
            <TableHeader>
              <TableColumn>ORDER ID</TableColumn>
              <TableColumn>CUSTOMER</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn align="end">TOTAL</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No recent orders.">
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-content2/50 transition-colors">
                  <TableCell>
                    <span className="font-mono text-xs text-default-400">#{order.id.slice(-6).toUpperCase()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{order.customer_name}</span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="dot"
                      color={order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}
                      className="capitalize font-bold border-none"
                    >
                      {order.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-orange-500">${Number(order.total).toFixed(2)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight px-2">Infrastructure</h2>
          <Card className="bg-content1/50 backdrop-blur-md border border-divider rounded-3xl shadow-xl">
            <CardBody className="p-6 space-y-6">
              {[
                { label: 'API Gateway', status: 'Operational', color: 'success', icon: CheckCircle2 },
                { label: 'Primary Database', status: 'Healthy', color: 'success', icon: CheckCircle2 },
                { label: 'Cloud Storage', status: '84% Capacity', color: 'warning', icon: AlertCircle },
                { label: 'Worker Services', status: 'Running', color: 'success', icon: CheckCircle2 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl bg-${item.color}/10 flex items-center justify-center text-${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-[10px] uppercase tracking-widest text-default-400 font-bold">{item.status}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full bg-${item.color} shadow-[0_0_8px_var(--tw-shadow-color)] shadow-${item.color}`} />
                </div>
              ))}
            </CardBody>
          </Card>

          <Card className="bg-orange-500 rounded-3xl shadow-2xl shadow-orange-500/20">
             <CardBody className="p-6">
                <h4 className="text-white font-black text-xl mb-1">Weekly Recap</h4>
                <p className="text-white/80 text-xs mb-4">Your store performance is up by 15% this week compared to last week.</p>
                <Button className="bg-white text-orange-500 font-bold" size="sm">Download Report</Button>
             </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
