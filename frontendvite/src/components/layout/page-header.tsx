'use client'

import { MonthSelector } from '@/components/layout/month-selector'
import { YearSelector } from '@/components/layout/year-selector'
import { useMonth } from '@/context/month-context'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotification } from '@/context/notification-context'

interface PageHeaderProps {
    title: string
    showMonthSelector?: boolean
    initialDate?: Date
    onMonthChange?: React.Dispatch<React.SetStateAction<Date>>
}

export function PageHeader({ title, showMonthSelector = true, initialDate, onMonthChange }: PageHeaderProps) {
    const monthContext = useMonth()
    const currentDateValue = initialDate || monthContext.currentDate
    const setCurrentDateValue = onMonthChange || monthContext.setCurrentDate
    const [selectedYear, setSelectedYear] = useState(currentDateValue.getFullYear())
    const { unreadCount } = useNotification()

    const handleYearChange = (newYear: number) => {
        setSelectedYear(newYear)
        console.log('Neues Jahr ausgewählt:', newYear)
    }

    return (
        <div className="relative px-6 overflow-hidden py-4 text-left rounded-lg w-full mb-2 backdrop-blur-sm shadow-md -mt-4">
            {/* Hintergrund – hell statt blau */}
            <div className="absolute inset-0 rounded-lg bg-white -z-10 pl-3" />

            {/* Dezente Designakzente */}
            <div className="absolute -top-4 -right-6 w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-300/60 to-blue-100/60"></div>

            {/* Titel und Selector nebeneinander */}
            <div className="flex flex-row items-center justify-between gap-2">
                <h2 className="text-2xl font-bold text-gray-700 mr-2">{title}</h2>
                <div className="relative mr-auto">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="notification-badge flex items-center justify-center px-1 text-white text-[10px]">
                            {unreadCount}
                        </span>
                    )}
                </div>

                {showMonthSelector ? (
                    <div className="z-10 relative">
                        <MonthSelector currentDate={currentDateValue} setCurrentDate={setCurrentDateValue} />
                    </div>
                ) : (
                    <div className="inline-flex items-center justify-between bg-blue-50 rounded-lg p-2 min-w-fit">
                        <YearSelector selectedYear={selectedYear} onChange={handleYearChange} />
                    </div>
                )}
            </div>
        </div>
    )
}
