import type React from "react"
import { Header } from "./header"
import { Footer } from "./footer"

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

