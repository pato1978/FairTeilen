import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

interface PageLayoutProps {
  children: React.ReactNode
  onAddButtonClick?: () => void
  showAddButton?: boolean
}

export function PageLayout({ children, onAddButtonClick, showAddButton = true }: PageLayoutProps) {
  return (
    <>
        <Header />
      <div className="page-container flex flex-col">
        {children}
        <Footer onAddButtonClick={onAddButtonClick} showAddButton={showAddButton} />
      </div>
    </>
  )
}
