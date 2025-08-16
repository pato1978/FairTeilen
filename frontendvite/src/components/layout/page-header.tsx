'use client'

import { MonthSelector } from '@/components/layout/month-selector'
import { YearSelector } from '@/components/layout/year-selector'
import { useMonth } from '@/context/month-context'
import { useMemo } from 'react'

type HeaderMode = 'month' | 'year' | 'none'

interface PageHeaderProps {
    title: string
    /** 'month' (Overview) | 'year' (Jahresübersicht) | 'none' */
    mode?: HeaderMode
    /** optional anderes Startdatum (z. B. in Detailviews) */
    initialDate?: Date
    /** optional: kontrolliert von außen */
    onMonthChange?: React.Dispatch<React.SetStateAction<Date>>
    showMonthSelector?: boolean
}

export function PageHeader({ title, mode = 'month', initialDate, onMonthChange }: PageHeaderProps) {
    const monthCtx = useMonth()
    const currentDate = initialDate || monthCtx.currentDate
    const setCurrentDate = onMonthChange || monthCtx.setCurrentDate

    const subline = useMemo(() => {
        if (mode === 'month') {
            return currentDate.toLocaleDateString('de-DE', {
                month: 'long',
                year: 'numeric',
            })
        }
        if (mode === 'year') {
            return String(currentDate.getFullYear())
        }
        return ''
    }, [currentDate, mode])

    return (
        <div
            className="
        w-full
        px-4            /* ⬅️ links/rechts einheitlich zu den Karten */
        pt-1 pb-2       /* ⬆️ kompakter oben/unten */
        mb-1            /* ↓ kleiner Abstand zum Content, Karten regeln den Rest */
        border-b border-gray-200/80
        backdrop-blur-[2px]
      "
        >
            <div className="flex items-baseline justify-between gap-3">
                {/* Titelblock */}
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 truncate">
                        {title}
                    </h2>
                    {subline && (
                        <div className="text-sm text-gray-500 -mt-0.5 capitalize">{subline}</div>
                    )}
                </div>

                {/* Selector rechts, einheitlich klein */}
                {mode !== 'none' && (
                    <div className="shrink-0">
                        <div className="inline-flex rounded-lg bg-white shadow-sm ring-1 ring-gray-200 px-1 py-1">
                            {mode === 'month' ? (
                                <MonthSelector
                                    currentDate={currentDate}
                                    setCurrentDate={setCurrentDate}
                                />
                            ) : (
                                <YearSelector
                                    selectedYear={currentDate.getFullYear()}
                                    onChange={y =>
                                        setCurrentDate(new Date(y, currentDate.getMonth(), 1))
                                    }
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
