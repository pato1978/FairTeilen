'use client'

import { useEffect, useRef } from 'react'

interface LineChartProps {
    data: Array<{
        month: string
        total: number
        categories: Record<string, number>
    }>
    viewType: 'total' | 'categories'
    selectedCategories: string[]
    categoryColors: Record<string, string>
}

export function LineChartComponent({
    data,
    viewType,
    selectedCategories,
    categoryColors,
}: LineChartProps) {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return

        const svg = svgRef.current
        const width = svg.clientWidth
        const height = svg.clientHeight

        // Alle vorhandenen Elemente entfernen
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild)
        }

        // Diagrammparameter
        const padding = { top: 20, right: 20, bottom: 40, left: 60 }
        const chartWidth = width - padding.left - padding.right
        const chartHeight = height - padding.top - padding.bottom

        // Maximalen Betrag ermitteln
        let maxAmount = 0

        if (viewType === 'total') {
            maxAmount = Math.max(...data.map(item => item.total))
        } else {
            // Bei Kategorieansicht den maximalen Wert über alle ausgewählten Kategorien ermitteln
            const categoryValues = data.flatMap(item =>
                selectedCategories.map(cat => item.categories[cat] || 0)
            )
            maxAmount = Math.max(...categoryValues)
        }

        // Skalierungsfaktor für die Höhe
        const yScale = chartHeight / maxAmount

        // X-Achsen-Abstand zwischen den Punkten
        const xStep = chartWidth / (data.length - 1)

        // Y-Achse zeichnen
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        yAxis.setAttribute('x1', padding.left.toString())
        yAxis.setAttribute('y1', padding.top.toString())
        yAxis.setAttribute('x2', padding.left.toString())
        yAxis.setAttribute('y2', (padding.top + chartHeight).toString())
        yAxis.setAttribute('stroke', '#CBD5E1') // slate-300
        yAxis.setAttribute('stroke-width', '1')
        svg.appendChild(yAxis)

        // X-Achse zeichnen
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        xAxis.setAttribute('x1', padding.left.toString())
        xAxis.setAttribute('y1', (padding.top + chartHeight).toString())
        xAxis.setAttribute('x2', (padding.left + chartWidth).toString())
        xAxis.setAttribute('y2', (padding.top + chartHeight).toString())
        xAxis.setAttribute('stroke', '#CBD5E1') // slate-300
        xAxis.setAttribute('stroke-width', '1')
        svg.appendChild(xAxis)

        // Y-Achsen-Beschriftungen
        const yTicks = 5
        for (let i = 0; i <= yTicks; i++) {
            const yPos = padding.top + chartHeight - (i / yTicks) * chartHeight
            const amount = (i / yTicks) * maxAmount

            // Linie für die Markierung
            const tickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            tickLine.setAttribute('x1', (padding.left - 5).toString())
            tickLine.setAttribute('y1', yPos.toString())
            tickLine.setAttribute('x2', padding.left.toString())
            tickLine.setAttribute('y2', yPos.toString())
            tickLine.setAttribute('stroke', '#94A3B8') // slate-400
            tickLine.setAttribute('stroke-width', '1')
            svg.appendChild(tickLine)

            // Horizontale Hilfslinie
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            gridLine.setAttribute('x1', padding.left.toString())
            gridLine.setAttribute('y1', yPos.toString())
            gridLine.setAttribute('x2', (padding.left + chartWidth).toString())
            gridLine.setAttribute('y2', yPos.toString())
            gridLine.setAttribute('stroke', '#E2E8F0') // slate-200
            gridLine.setAttribute('stroke-width', '1')
            gridLine.setAttribute('stroke-dasharray', '4,4')
            svg.appendChild(gridLine)

            // Beschriftung
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            label.setAttribute('x', (padding.left - 10).toString())
            label.setAttribute('y', yPos.toString())
            label.setAttribute('text-anchor', 'end')
            label.setAttribute('dominant-baseline', 'middle')
            label.setAttribute('font-size', '10')
            label.setAttribute('fill', '#64748B') // slate-500
            label.textContent = `€${amount.toFixed(0)}`
            svg.appendChild(label)
        }

        // X-Achsen-Beschriftungen (Monate)
        data.forEach((item, index) => {
            const x = padding.left + index * xStep

            // Beschriftung
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            label.setAttribute('x', x.toString())
            label.setAttribute('y', (padding.top + chartHeight + 15).toString())
            label.setAttribute('text-anchor', 'middle')
            label.setAttribute('font-size', '10')
            label.setAttribute('fill', '#64748B') // slate-500
            label.textContent = item.month
            svg.appendChild(label)
        })

        if (viewType === 'total') {
            // Linie für Gesamtausgaben zeichnen
            let pathD = ''

            data.forEach((item, index) => {
                const x = padding.left + index * xStep
                const y = padding.top + chartHeight - item.total * yScale

                if (index === 0) {
                    pathD += `M ${x} ${y}`
                } else {
                    pathD += ` L ${x} ${y}`
                }
            })

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.setAttribute('d', pathD)
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', '#3B82F6') // blue-500
            path.setAttribute('stroke-width', '2')
            svg.appendChild(path)

            // Punkte für jeden Datenpunkt
            data.forEach((item, index) => {
                const x = padding.left + index * xStep
                const y = padding.top + chartHeight - item.total * yScale

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
                circle.setAttribute('cx', x.toString())
                circle.setAttribute('cy', y.toString())
                circle.setAttribute('r', '4')
                circle.setAttribute('fill', '#3B82F6') // blue-500
                circle.setAttribute('stroke', 'white')
                circle.setAttribute('stroke-width', '1')
                svg.appendChild(circle)
            })
        } else {
            // Linien für jede ausgewählte Kategorie zeichnen
            selectedCategories.forEach(category => {
                let pathD = ''

                data.forEach((item, index) => {
                    const x = padding.left + index * xStep
                    const y = padding.top + chartHeight - (item.categories[category] || 0) * yScale

                    if (index === 0) {
                        pathD += `M ${x} ${y}`
                    } else {
                        pathD += ` L ${x} ${y}`
                    }
                })

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                path.setAttribute('d', pathD)
                path.setAttribute('fill', 'none')
                path.setAttribute('stroke', categoryColors[category] || '#9CA3AF') // Default: gray-400
                path.setAttribute('stroke-width', '2')
                svg.appendChild(path)

                // Punkte für jeden Datenpunkt
                data.forEach((item, index) => {
                    const x = padding.left + index * xStep
                    const y = padding.top + chartHeight - (item.categories[category] || 0) * yScale

                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
                    circle.setAttribute('cx', x.toString())
                    circle.setAttribute('cy', y.toString())
                    circle.setAttribute('r', '4')
                    circle.setAttribute('fill', categoryColors[category] || '#9CA3AF') // Default: gray-400
                    circle.setAttribute('stroke', 'white')
                    circle.setAttribute('stroke-width', '1')
                    svg.appendChild(circle)
                })
            })
        }
    }, [data, viewType, selectedCategories, categoryColors])

    return (
        <div className="w-full h-full flex items-center justify-center">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 400 300"
                className="max-w-full max-h-[300px]"
            ></svg>
        </div>
    )
}
