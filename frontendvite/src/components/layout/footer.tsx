import { useLocation, useNavigate } from "react-router-dom"
import { Home, PieChart, CalendarDays, User, Star } from "lucide-react"
import { EnhancedPlusButton } from "@/components/ui/enhanced-plus-button"
import { useTooltip } from "@/lib/hooks/use-tooltip"

interface FooterProps {
    onAddButtonClick?: () => void
    showAddButton?: boolean
}

export function Footer({ onAddButtonClick, showAddButton = true }: FooterProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const pathname = location.pathname
    const { isVisible: showTooltip, showAllTooltips } = useTooltip()

    const isAnalyseActive = pathname === "/analyse"
    const isJahresuebersichtActive = pathname === "/jahresuebersicht"
    const isProfileActive = pathname === "/profile"

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white h-16 flex items-center justify-between z-10 max-w-md mx-auto pb-safe">
            {/* Navigation mit 4 Elementen (2 links, Plus/Profile in der Mitte, 2 rechts) */}
            <div className="flex w-2/5 justify-around">
                <button
                    className="p-2 active:bg-blue-500 transition-colors rounded-full"
                    onClick={() => navigate("/")}
                    aria-label="Dashboard"
                >
                    <Home className={`h-5 w-5 ${pathname === "/" ? "opacity-100" : "opacity-70"}`} />
                </button>

                <button
                    className="p-2 active:bg-blue-500 transition-colors rounded-full"
                    onClick={() => navigate("/jahresuebersicht")}
                    aria-label="Jahresübersicht"
                >
                    <CalendarDays className={`h-5 w-5 ${isJahresuebersichtActive ? "opacity-100" : "opacity-70"}`} />
                </button>
            </div>

            {/* Center section - conditionally shows either Plus Button or Profile Button */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
                {showAddButton ? (
                    <div className="-mt-12 active:scale-95 transition-transform duration-150">
                        <div className="p-2 rounded-full bg-blue-400">
                            <EnhancedPlusButton variant="outline" onClick={onAddButtonClick} />
                        </div>
                    </div>
                ) : (
                    <button
                        className="p-2 active:bg-blue-500 transition-colors rounded-full"
                        onClick={() => navigate("/profile")}
                        aria-label="Profil"
                    >
                        <User className={`h-5 w-5 ${isProfileActive ? "opacity-100" : "opacity-70"}`} />
                    </button>
                )}
            </div>

            {/* Rechte Seite der Navigation */}
            <div className="flex w-2/5 justify-around">
                <button
                    className="p-2 active:bg-blue-500 transition-colors rounded-full"
                    onClick={() => navigate("/analyse")}
                    aria-label="Ausgabenanalyse"
                >
                    <PieChart className={`h-5 w-5 ${isAnalyseActive ? "opacity-100" : "opacity-70"}`} />
                </button>

                {/* Share2Gether Plus Button */}
                <div className="relative">
                    <button
                        className="p-2 active:bg-blue-500 transition-colors rounded-full"
                        onClick={showAllTooltips}
                        aria-label="Share2Gether Plus"
                    >
                        <Star className="h-5 w-5 text-yellow-300" />
                    </button>

                    {/* Tooltip */}
                    {showTooltip && (
                        <div className="absolute bottom-16 right-0 w-48 p-2 bg-white text-gray-800 rounded-lg shadow-lg text-xs z-20 transform transition-all">
                            <div className="font-medium text-blue-600 mb-1">Share2Gether Plus</div>
                            <p>Mehr Funktionen für Paare & WGs – individuelle Aufteilungen, Export & mehr.</p>
                            <div className="absolute -bottom-2 right-3 w-3 h-3 bg-white transform rotate-45"></div>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    )
}
