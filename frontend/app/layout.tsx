import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { MonthProvider } from "@/context/month-context" // ✅ NEU
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fair Teilen - Finanzplaner",
  description: "Gemeinsame Ausgaben fair aufteilen",
  generator: 'v0.dev'
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="de" className="flex justify-center bg-gray-100">
      <body className={`${inter.className} max-w-md w-full bg-[#EAEFF5] min-h-screen overflow-hidden relative`}>
      <MonthProvider> {/* ✅ Zentraler Monatskontext */}

              <div className="app-container w-full h-full">
                  {children}
              </div>


      </MonthProvider>
      </body>
      </html>
  )
}
