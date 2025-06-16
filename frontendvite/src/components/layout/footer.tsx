import { useLocation, useNavigate } from 'react-router-dom'
import { Home, PieChart, CalendarDays, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FooterProps {
    onAddButtonClick?: () => void
    showAddButton?: boolean
}

export function Footer({ onAddButtonClick, showAddButton = true }: FooterProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const pathname = location.pathname

    const isAnalyseActive = pathname === '/analyse'
    const isJahresuebersichtActive = pathname === '/jahresuebersicht'
    const isProfileActive = pathname === '/profile'

    // Gemeinsame Button-Styles für bessere Touch-Targets
    const buttonStyles = cn(
        'relative flex items-center justify-center',
        'w-12 h-12', // 48x48px für optimale Touch-Targets
        'rounded-xl', // Modernere, abgerundete Ecken
        'transition-all duration-200',
        'active:scale-95', // Subtiles Feedback
        'hover:bg-blue-50', // Desktop-Hover
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
    )

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 h-16 flex items-center justify-between z-50 max-w-md mx-auto pb-safe shadow-lg">
            {/* Safe area für iPhone-Notch */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent pointer-events-none" />

            {/* Linke Seite */}
            <div className="flex w-2/5 justify-around">
                <button
                    className={buttonStyles}
                    onClick={() => navigate('/')}
                    aria-label="Dashboard"
                >
                    <Home
                        className={`h-6 w-6 transition-colors duration-200 ${pathname === '/' ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                </button>

                <button
                    className={buttonStyles}
                    onClick={() => navigate('/jahresuebersicht')}
                    aria-label="Jahresübersicht"
                >
                    <CalendarDays
                        className={`h-6 w-6 transition-colors duration-200 ${isJahresuebersichtActive ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                </button>
            </div>

            {/* Mitte - Plus Button optimal positioniert */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-7">
                <div className="relative">
                    {/* Schatten-Effekt - gedimmt wenn disabled */}
                    <div
                        className={cn(
                            'absolute inset-0 rounded-full blur-xl',
                            showAddButton ? 'bg-blue-500/40 scale-110' : 'bg-gray-400/20 scale-105'
                        )}
                    />

                    {/* Button Container */}
                    <button
                        onClick={showAddButton ? onAddButtonClick : undefined}
                        disabled={!showAddButton}
                        className={cn(
                            'relative rounded-full shadow-lg',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
                            'w-14 h-14', // 56x56px - perfekte Größe für FAB
                            showAddButton
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 active:scale-95 cursor-pointer hover:shadow-xl'
                                : 'bg-gray-300 cursor-not-allowed'
                        )}
                        aria-label="Neue Ausgabe hinzufügen"
                        aria-disabled={!showAddButton}
                    >
                        <Plus
                            className={cn(
                                'h-6 w-6 transition-colors duration-200',
                                'absolute inset-0 m-auto', // Perfekt zentriert
                                showAddButton ? 'text-white' : 'text-gray-500'
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Rechte Seite */}
            <div className="flex w-2/5 justify-around">
                <button
                    className={buttonStyles}
                    onClick={() => navigate('/analyse')}
                    aria-label="Ausgabenanalyse"
                >
                    <PieChart
                        className={`h-6 w-6 transition-colors duration-200 ${isAnalyseActive ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                </button>

                <button
                    className={buttonStyles}
                    onClick={() => navigate('/profile')}
                    aria-label="Profil"
                >
                    <User
                        className={`h-6 w-6 transition-colors duration-200 ${isProfileActive ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                </button>
            </div>
        </footer>
    )
}
