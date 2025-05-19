"use client"

import { useEffect, useRef } from "react"

interface BarChartProps {
  data: Array<{
    category: string
    amount: number
    color: string
  }>
}

export function BarChartComponent({ data }: BarChartProps) {
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
    const maxAmount = Math.max(...data.map((item) => item.amount))

    // Skalierungsfaktor für die Höhe der Balken
    const yScale = chartHeight / maxAmount

    // Breite der Balken berechnen
    const barWidth = (chartWidth / data.length) * 0.8
    const barSpacing = (chartWidth / data.length) * 0.2

    // Y-Achse zeichnen
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    yAxis.setAttribute("x1", padding.left.toString())
    yAxis.setAttribute("y1", padding.top.toString())
    yAxis.setAttribute("x2", padding.left.toString())
    yAxis.setAttribute("y2", (padding.top + chartHeight).toString())
    yAxis.setAttribute("stroke", "#CBD5E1") // slate-300
    yAxis.setAttribute("stroke-width", "1")
    svg.appendChild(yAxis)

    // X-Achse zeichnen
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    xAxis.setAttribute("x1", padding.left.toString())
    xAxis.setAttribute("y1", (padding.top + chartHeight).toString())
    xAxis.setAttribute("x2", (padding.left + chartWidth).toString())
    xAxis.setAttribute("y2", (padding.top + chartHeight).toString())
    xAxis.setAttribute("stroke", "#CBD5E1") // slate-300
    xAxis.setAttribute("stroke-width", "1")
    svg.appendChild(xAxis)

    // Y-Achsen-Beschriftungen
    const yTicks = 5
    for (let i = 0; i <= yTicks; i++) {
      const yPos = padding.top + chartHeight - (i / yTicks) * chartHeight
      const amount = (i / yTicks) * maxAmount

      // Linie für die Markierung
      const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
      tickLine.setAttribute("x1", (padding.left - 5).toString())
      tickLine.setAttribute("y1", yPos.toString())
      tickLine.setAttribute("x2", padding.left.toString())
      tickLine.setAttribute("y2", yPos.toString())
      tickLine.setAttribute("stroke", "#94A3B8") // slate-400
      tickLine.setAttribute("stroke-width", "1")
      svg.appendChild(tickLine)

      // Horizontale Hilfslinie
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
      gridLine.setAttribute("x1", padding.left.toString())
      gridLine.setAttribute("y1", yPos.toString())
      gridLine.setAttribute("x2", (padding.left + chartWidth).toString())
      gridLine.setAttribute("y2", yPos.toString())
      gridLine.setAttribute("stroke", "#E2E8F0") // slate-200
      gridLine.setAttribute("stroke-width", "1")
      gridLine.setAttribute("stroke-dasharray", "4,4")
      svg.appendChild(gridLine)

      // Beschriftung
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
      label.setAttribute("x", (padding.left - 10).toString())
      label.setAttribute("y", yPos.toString())
      label.setAttribute("text-anchor", "end")
      label.setAttribute("dominant-baseline", "middle")
      label.setAttribute("font-size", "10")
      label.setAttribute("fill", "#64748B") // slate-500
      label.textContent = `€${amount.toFixed(0)}`
      svg.appendChild(label)
    }

    // Balken zeichnen
    data.forEach((item, index) => {
      const barHeight = item.amount * yScale
      const x = padding.left + index * (barWidth + barSpacing) + barSpacing / 2
      const y = padding.top + chartHeight - barHeight

      // Balken
      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      bar.setAttribute("x", x.toString())
      bar.setAttribute("y", y.toString())
      bar.setAttribute("width", barWidth.toString())
      bar.setAttribute("height", barHeight.toString())
      bar.setAttribute("fill", item.color)
      bar.setAttribute("rx", "4") // Abgerundete Ecken

      // Hover-Effekt
      bar.addEventListener("mouseenter", () => {
        bar.setAttribute("opacity", "0.8")
      })

      bar.addEventListener("mouseleave", () => {
        bar.setAttribute("opacity", "1")
      })

      svg.appendChild(bar)

      // X-Achsen-Beschriftung (Kategorie)
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
      label.setAttribute("x", (x + barWidth / 2).toString())
      label.setAttribute("y", (padding.top + chartHeight + 15).toString())
      label.setAttribute("text-anchor", "middle")
      label.setAttribute("font-size", "10")
      label.setAttribute("fill", "#64748B") // slate-500

      // Kategoriename kürzen, wenn zu lang
      const categoryName = item.category.length > 10 ? item.category.substring(0, 8) + "..." : item.category

      label.textContent = categoryName
      svg.appendChild(label)

      // Betrag über dem Balken anzeigen
      const amountLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
      amountLabel.setAttribute("x", (x + barWidth / 2).toString())
      amountLabel.setAttribute("y", (y - 5).toString())
      amountLabel.setAttribute("text-anchor", "middle")
      amountLabel.setAttribute("font-size", "10")
      amountLabel.setAttribute("fill", "#64748B") // slate-500
      amountLabel.textContent = `€${item.amount}`
      svg.appendChild(amountLabel)
    })
  }, [data])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 400 300" className="max-w-full max-h-[300px]"></svg>
    </div>
  )
}
