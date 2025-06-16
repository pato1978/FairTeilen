export const userColorMap: Record<string, { text: string; border: string }> = {
    'blue-500': { text: 'text-blue-500', border: 'border-blue-500' },
    'green-500': { text: 'text-green-500', border: 'border-green-500' },
    'purple-500': { text: 'text-purple-500', border: 'border-purple-500' },
    'orange-500': { text: 'text-orange-500', border: 'border-orange-500' },
    // Falls kein Eintrag gefunden wird, nehmen wir als Fallback 'gray-400'
    'gray-400': { text: 'text-gray-400', border: 'border-gray-400' },
}
