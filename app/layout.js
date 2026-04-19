import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Döner House — Admin',
  description: 'Admin panel for Döner House',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#0A0A0A',
              border: '1px solid #F97316',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  )
}
