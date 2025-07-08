'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'

import { EnhancedMonthCard } from './enhanced-month-card'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useFetchYearOverview } from '@/services/useYearOverviewHook.ts'
import type { MonthlyOverview } from '@/types/monthly-overview'

export default function JahresUebersicht() {
    const currentYear = new Date().getFullYear()
    const fetchYearOverview = useFetchYearOverview() // ✅ Hook-Aufruf direkt im Component Body
    const [selectedYear] = useState(currentYear)
    const [monthsData, setMonthsData] = useState<Record<number, MonthlyOverview>>({})

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        const load = async () => {
            try {
                const result = await fetchYearOverview(selectedYear)
                const record: Record<number, MonthlyOverview> = {}
                result.months.forEach(month => {
                    const monthNumber = new Date(month.monthKey).getMonth() + 1
                    record[monthNumber] = month
                })
                setMonthsData(record)
            } catch (error) {
                console.error('[Jahresübersicht] Fehler beim Laden:', error)
            }
        }
        load()
    }, [fetchYearOverview, selectedYear])

    //const handleYearChange = (year: number) => {
    //  setSelectedYear(year)
    //}

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    }

    const getMonthId = (month: MonthlyOverview) => parseInt(month.monthKey.split('-')[1], 10)

    const sortedMonths = Object.values(monthsData).sort((a, b) => {
        const aId = getMonthId(a)
        const bId = getMonthId(b)
        return sortOrder === 'asc' ? aId - bId : bId - aId
    })

    return (
        <PageLayout showAddButton={false}>
            <div className="page-header-container scale-80 transform-origin-top">
                <PageHeader showMonthSelector={false} title="Jahresübersicht" />
            </div>

            <div className="flex-1 px-4 pb-6 mt-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Monate</h3>
                    <button
                        onClick={toggleSortOrder}
                        className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md"
                    >
                        {sortOrder === 'asc' ? (
                            <>
                                <span>Jan → Dez</span>
                                <ArrowDown className="h-3 w-3 ml-1" />
                            </>
                        ) : (
                            <>
                                <span>Dez → Jan</span>
                                <ArrowUp className="h-3 w-3 ml-1" />
                            </>
                        )}
                    </button>
                </div>

                <div className="space-y-4 mb-20">
                    {sortedMonths.map(month => (
                        <EnhancedMonthCard key={month.id} month={month} />
                    ))}
                </div>
            </div>
        </PageLayout>
    )
}
