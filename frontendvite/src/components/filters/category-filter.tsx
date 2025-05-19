"use client"

import { useState } from "react"
import { Filter, Check } from "lucide-react"

interface CategoryFilterProps {
  categories: string[]
  selectedCategories: string[]
  onChange: (categories: string[]) => void
}

export function CategoryFilter({ categories, selectedCategories, onChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter((c) => c !== category))
    } else {
      onChange([...selectedCategories, category])
    }
  }

  const selectAll = () => {
    onChange([...categories])
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-blue-50 text-blue-600 text-sm"
      >
        <Filter className="h-4 w-4" />
        <span>Kategorien</span>
        {selectedCategories.length > 0 && (
          <span className="bg-blue-600 text-white rounded-full text-xs px-1.5">{selectedCategories.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white shadow-md rounded-md p-2 z-10 w-48 border border-gray-100">
          <div className="flex justify-between mb-2 pb-2 border-b border-gray-100">
            <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
              Alle auswählen
            </button>
            <button onClick={clearAll} className="text-xs text-gray-500 hover:underline">
              Zurücksetzen
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {categories.map((category, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => toggleCategory(category)}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center ${
                    selectedCategories.includes(category) ? "bg-blue-600" : "border border-gray-300"
                  }`}
                >
                  {selectedCategories.includes(category) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm">{category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
