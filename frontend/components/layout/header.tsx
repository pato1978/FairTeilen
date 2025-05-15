import { DollarSign, Menu } from "lucide-react"

export function Header() {
  return (
    <header className="fixed top-0 bg-blue-700 text-white h-14 flex items-center justify-between px-4 z-10 shadow-md max-w-md w-full mx-auto left-0 right-0">
      <div className="flex items-center">
        <DollarSign className="h-6 w-6" />
        <span className="ml-1.5 font-bold text-base">Fair Teilen</span>
      </div>
      <button className="p-1.5 rounded-full active:bg-blue-700 transition-colors">
        <Menu className="h-5 w-5" />
      </button>
    </header>
  )
}

