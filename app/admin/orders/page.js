'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import StatusBadge from '@/components/admin/status-badge'
import { format } from 'date-fns'
import { Loader2, Phone, MapPin, Clock, User, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

const STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled']

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [soundOn, setSoundOn] = useState(true)
  const initialLoadDone = useRef(false)

  const load = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (!error) setOrders(data || [])
    setLoading(false)
    initialLoadDone.current = true
  }

  const playPing = () => {
    if (!soundOn) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start(); osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => [payload.new, ...prev])
        if (initialLoadDone.current) {
          playPing()
          toast.success(`New order from ${payload.new.customer_name || 'customer'}`, {
            description: `$${Number(payload.new.total || 0).toFixed(2)}`,
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.map((o) => o.id === payload.new.id ? payload.new : o))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [soundOn])

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const updateStatus = async (id, status) => {
    const res = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error || 'Failed')
    toast.success(`Order → ${status}`)
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">{orders.length} total · {orders.filter(o=>o.status==='pending').length} pending</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSoundOn(!soundOn)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${soundOn ? 'border-orange-500 text-orange-500' : 'border-border text-muted-foreground'}`}>
            <Volume2 className="w-3.5 h-3.5" /> Sound {soundOn ? 'on' : 'off'}
          </button>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-6 py-3 font-medium">Order #</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Promo</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" /></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No orders</td></tr>}
              <AnimatePresence initial={false}>
                {filtered.map((o, idx) => (
                  <motion.tr
                    key={o.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(idx, 10) * 0.02 }}
                    onClick={() => setSelected(o)}
                    className="border-b border-border hover:bg-secondary/30 cursor-pointer"
                  >
                    <td className="px-6 py-3 font-mono text-xs">#{String(o.id).slice(0, 8)}</td>
                    <td className="px-6 py-3">{o.customer_name || '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground font-mono text-xs">{o.phone || '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{(o.items || []).length}</td>
                    <td className="px-6 py-3 font-mono font-semibold">${Number(o.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-muted-foreground font-mono text-xs">{o.promo_code || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{format(new Date(o.created_at), 'MMM d, HH:mm')}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-card border-border overflow-y-auto scrollbar-thin">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl flex items-center gap-2">
                  Order <span className="font-mono text-orange-500">#{String(selected.id).slice(0, 8)}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm"><User className="w-4 h-4 text-muted-foreground" />{selected.customer_name || '—'}</div>
                  <div className="flex items-center gap-3 text-sm font-mono"><Phone className="w-4 h-4 text-muted-foreground" />{selected.phone || '—'}</div>
                  <div className="flex items-start gap-3 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{selected.address || '—'}</span></div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{format(new Date(selected.created_at), 'MMM d, yyyy • HH:mm')}</div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Items</h4>
                  <div className="space-y-2">
                    {(selected.items || []).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{it.name_en || it.name || 'Item'}</div>
                          <div className="text-xs text-muted-foreground font-mono">× {it.qty || it.quantity || 1}</div>
                        </div>
                        <div className="font-mono text-sm">${Number(it.price || 0).toFixed(2)}</div>
                      </div>
                    ))}
                    {(!selected.items || selected.items.length === 0) && <p className="text-xs text-muted-foreground">No items</p>}
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  {selected.promo_code && (
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Promo</span><span className="font-mono text-orange-500">{selected.promo_code}</span></div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm uppercase tracking-wider text-muted-foreground">Total</span>
                    <span className="font-display text-2xl font-bold font-mono">${Number(selected.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Update status</label>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
