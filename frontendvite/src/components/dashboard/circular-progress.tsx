import type React from 'react'

interface CircularProgressProps {
    percentage: number
    size: number
    strokeWidth: number
    color: string
    children: React.ReactNode
}

export function CircularProgress({
    percentage,
    size,
    strokeWidth,
    color,
    children,
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const dash = (percentage * circumference) / 100

    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#EDF2F7" // Light background for the circle
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - dash}
                    strokeLinecap="round"
                />
            </svg>
            <div
                className="absolute flex flex-col items-center justify-center bg-blue-50 rounded-full"
                style={{ width: size - strokeWidth * 2, height: size - strokeWidth * 2 }}
            >
                {children}
            </div>
        </div>
    )
}
