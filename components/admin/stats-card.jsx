'use client'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

function CountUp({ value, prefix = '', suffix = '', decimals = 0 }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) =>
    `${prefix}${Number(latest).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  )

  useEffect(() => {
    const controls = animate(count, Number(value) || 0, { duration: 1.2, ease: 'easeOut' })
    return controls.stop
  }, [value, count])

  return <motion.span>{rounded}</motion.span>
}

export default function StatsCard({ icon: Icon, label, value, prefix, suffix, decimals, subtext, accent = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative bg-card border border-border rounded-2xl p-5 overflow-hidden group hover:border-orange-500/40 transition-colors ${accent ? 'glow-orange' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
          <div className="font-display text-3xl font-bold mt-2 font-mono">
            {typeof value === 'number' ? (
              <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            ) : (
              <span>{value ?? '—'}</span>
            )}
          </div>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
