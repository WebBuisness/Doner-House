'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Send, Loader2, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase.from('notifications').select('*').order('sent_at', { ascending: false }).limit(100)
    setHistory(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const send = async () => {
    if (!title || !body) return toast.error('Title and message required')
    setSending(true)
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, target }),
    })
    const json = await res.json()
    setSending(false)
    if (!res.ok) return toast.error(json.error || 'Failed')
    toast.success('Notification queued & logged')
    setTitle(''); setBody('')
    load()
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Push Notifications</h1>
        <p className="text-muted-foreground mt-1">Broadcast messages to customers</p>
      </div>

      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-orange-500" />
          <h3 className="font-display text-lg font-semibold">Compose Notification</h3>
        </div>
        <div className="space-y-4">
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label><Input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1.5 bg-secondary border-border" placeholder="🔥 Fresh Döner specials!" /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label><Textarea value={body} onChange={(e)=>setBody(e.target.value)} className="mt-1.5 bg-secondary border-border" rows={4} placeholder="Let customers know what's up..." /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Target</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All customers</SelectItem></SelectContent>
            </Select>
          </div>
          <Button onClick={send} disabled={sending} className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 h-11">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Send Notification'}
          </Button>
        </div>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-display text-lg font-semibold">History</h3>
          <p className="text-xs text-muted-foreground mt-1">Last 100 notifications</p>
        </div>
        <div className="divide-y divide-border">
          {loading && <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" /></div>}
          {!loading && history.length === 0 && <div className="p-12 text-center text-muted-foreground">No notifications sent yet</div>}
          {history.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx, 10) * 0.03 }}
              className="p-5 hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{n.body}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground font-mono">{format(new Date(n.sent_at), 'MMM d HH:mm')}</div>
                  <div className="text-xs text-orange-500 mt-1 capitalize">{n.target || 'all'}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
