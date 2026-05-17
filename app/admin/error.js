'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardBody, Button } from '@heroui/react'

export default function AdminError({ error, reset }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-content1/50 backdrop-blur-md border border-divider rounded-3xl shadow-2xl">
        <CardBody className="p-8">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20" />
                    <Image
                        src="/icons/icon-192.png"
                        width={48}
                        height={48}
                        alt="WBS Admin"
                        className="relative rounded-2xl"
                        priority
                    />
                </div>
                <div>
                    <p className="text-[10px] text-default-400 uppercase tracking-[0.2em] font-bold">WBS Admin</p>
                    <h1 className="text-xl font-black">Something went wrong</h1>
                </div>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-sm text-default-600">
                <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500" />
                <p className="leading-relaxed">Try reloading this screen. If it keeps happening, check your connection and credentials.</p>
            </div>

            <Button
                onPress={() => reset()}
                color="warning"
                size="lg"
                className="mt-8 font-bold shadow-lg shadow-warning/20"
                startContent={<RefreshCw className="w-4 h-4" />}
            >
                Retry
            </Button>
        </CardBody>
      </Card>
    </div>
  )
}
