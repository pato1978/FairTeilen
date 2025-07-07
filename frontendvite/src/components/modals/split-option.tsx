import { ChevronDown, Percent, Star } from 'lucide-react'
import { Expense } from '@/components/modals/expense-editor-bottom-sheet.tsx'

export function SplitOption(props: { editingExpense: Expense; onClick: (e) => void }) {
    return (
        <>
            {/* Verteilung */}
            {!props.editingExpense.isPersonal && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verteilung
                    </label>
                    <button
                        onClick={props.onClick}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        <div className="flex items-center">
                            <div className="bg-blue-50 p-2 rounded-lg mr-3">
                                <Percent className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Gleichmäßig</span>
                            <Star className="h-4 w-4 text-yellow-300 ml-2" />
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                </div>
            )}
        </>
    )
}
