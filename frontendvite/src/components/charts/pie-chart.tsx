'use client'

import { useEffect, useRef } from 'react'

interface PieChartProps {
    data: Array<{
        category: string
        amount: number
        color: string
    }>
}

export function PieChartComponent({ data }: PieChartProps) {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return

        const svg = svgRef.current
        const width = svg.clientWidth
        const height = svg.clientHeight
        const radius = (Math.min(width, height) / 2) * 0.8
        const centerX = width / 2
        const centerY = height / 2

        // Alle vorhandenen Elemente entfernen
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild)
        }

        // Gesamtbetrag berechnen
        const total = data.reduce((sum, item) => sum + item.amount, 0)

        // Kreissegmente zeichnen
        let startAngle = 0

        data.forEach(item => {
            const percentage = item.amount / total
            const endAngle = startAngle + percentage * 2 * Math.PI

            // Berechnung der Punkte für den Pfad
            const x1 = centerX + radius * Math.sin(startAngle)
            const y1 = centerY - radius * Math.cos(startAngle)
            const x2 = centerX + radius * Math.sin(endAngle)
            const y2 = centerY - radius * Math.cos(endAngle)

            // Pfad erstellen
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

            // Großer Bogen (1) wenn der Winkel > 180 Grad ist
            const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

            // Pfad definieren
            const d = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
            ].join(' ')

            path.setAttribute('d', d)
            path.setAttribute('fill', item.color)
            path.setAttribute('stroke', 'white')
            path.setAttribute('stroke-width', '1')

            // Tooltip-Daten hinzufügen
            path.setAttribute('data-category', item.category)
            path.setAttribute('data-amount', item.amount.toString())
            path.setAttribute('data-percentage', (percentage * 100).toFixed(1))

            // Hover-Effekt
            path.addEventListener('mouseenter', () => {
                path.setAttribute('opacity', '0.8')
            })

            path.addEventListener('mouseleave', () => {
                path.setAttribute('opacity', '1')
            })

            svg.appendChild(path)

            // Startwinkel für das nächste Segment aktualisieren
            startAngle = endAngle
        })
    }, [data])

    return (
        <div className="w-full h-full flex items-center justify-center">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 300 300"
                className="max-w-full max-h-[300px]"
            ></svg>
        </div>
    )
}
