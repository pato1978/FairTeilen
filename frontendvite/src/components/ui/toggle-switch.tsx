'use client'

interface ToggleSwitchProps {
    isChecked: boolean
    onChange: () => void
    label?: string
    onLabel?: string
    offLabel?: string
}

export function ToggleSwitch({
    isChecked,
    onChange,
    label,
    onLabel = 'Monatlich',
    offLabel = 'Einmalig',
}: ToggleSwitchProps) {
    // Generiere eine eindeutige ID für das Input-Element
    const id = `toggle-${Math.random().toString(36).substr(2, 9)}`

    return (
        <div className="flex items-center">
            <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
                <input
                    id={id}
                    type="checkbox"
                    className="sr-only peer"
                    checked={isChecked}
                    onChange={onChange}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                <span className="ml-2 text-xs text-gray-700 flex items-center">
                    {label || (isChecked ? onLabel : offLabel)}
                </span>
            </label>
        </div>
    )
}
