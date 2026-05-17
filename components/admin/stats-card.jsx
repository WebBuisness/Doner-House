'use client'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { Card, CardBody } from '@heroui/react'

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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card
        isPressable
        className={`border-none bg-content1/50 backdrop-blur-md h-full overflow-hidden group ${
          accent ? 'shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20' : ''
        }`}
      >
        <CardBody className="p-6">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            {Icon && <Icon size={80} className="text-orange-500" />}
          </div>
          <div className="flex flex-col h-full justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <p className="text-xs uppercase tracking-widest text-default-500 font-bold">{label}</p>
            </div>
            <div>
              <div className="font-display text-4xl font-bold tracking-tight">
                {typeof value === 'number' ? (
                  <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
                ) : (
                  <span>{value ?? '—'}</span>
                )}
              </div>
              {subtext && <p className="text-[10px] text-default-400 font-medium uppercase tracking-wider mt-2">{subtext}</p>}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
