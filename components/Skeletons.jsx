'use client';

import { motion } from 'framer-motion';

export function TableSkeleton({ rows = 5, cols = 7 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex gap-6 p-4 bg-secondary rounded-lg"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-secondary-foreground/10 rounded" />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="p-6 bg-card border border-border rounded-2xl space-y-3"
        >
          <div className="h-6 bg-secondary rounded w-2/3" />
          <div className="h-4 bg-secondary rounded" />
          <div className="h-4 bg-secondary rounded w-4/5" />
        </motion.div>
      ))}
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="rounded-lg overflow-hidden bg-card border border-border"
    >
      <div className="aspect-square bg-secondary" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
    </motion.div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-4 bg-secondary rounded w-1/4 mb-2"
          />
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-10 bg-secondary rounded"
          />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-12 bg-secondary rounded-lg"
        />
      ))}
    </div>
  );
}
