'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { Expense } from '@/types'

export interface DeleteConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    expense: Expense | null
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
}: DeleteConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const [animation, setAnimation] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
        isOpen ? 'entering' : 'exited'
    )

    // Handle animation states
    useEffect(() => {
        let timeout: NodeJS.Timeout

        if (isOpen && animation === 'entering') {
            timeout = setTimeout(() => setAnimation('entered'), 10)
        } else if (!isOpen && animation === 'exiting') {
            timeout = setTimeout(() => setAnimation('exited'), 300)
        }

        return () => clearTimeout(timeout)
    }, [isOpen, animation])

    // Update animation state when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setAnimation('entering')
        } else if (animation !== 'exited' && animation !== 'exiting') {
            setAnimation('exiting')
        }
    }, [isOpen])

    // Handle outside clicks
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node) &&
                animation === 'entered'
            ) {
                handleClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, animation])

    // Don't render anything if not open and animation is exited
    if (animation === 'exited' && !isOpen) return null

    const handleClose = () => {
        setAnimation('exiting')
        setTimeout(() => {
            onClose()
        }, 300)
    }

    const handleConfirm = () => {
        onConfirm()
        handleClose()
    }

    return (
        <div
            className={`fixed inset-0 z-[80] bg-black transition-opacity duration-300 ${
                animation === 'entering' || animation === 'entered'
                    ? 'bg-opacity-50'
                    : 'bg-opacity-0'
            } ${animation === 'exited' ? 'pointer-events-none' : ''}`}
        >
            <div
                ref={modalRef}
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[75%] md:w-[65%] max-w-sm bg-white rounded-xl shadow-lg transform transition-all duration-300 ease-out z-[90] ${
                    animation === 'entering' || animation === 'entered'
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95'
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-4 py-4 text-left border-b border-gray-100 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="bg-red-50 p-2 rounded-lg mr-3">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">Ausgabe löschen?</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 pt-2 pb-4 bg-white border-t border-gray-100 flex space-x-3 rounded-b-xl">
                    <button
                        className="flex-1 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors"
                        onClick={handleClose}
                    >
                        Abbrechen
                    </button>
                    <button
                        className="flex-1 py-2.5 text-sm font-medium   text-blue-600 bg-blue-50 border border-blue-300 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors flex items-center justify-center"
                        onClick={handleConfirm}
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Löschen
                    </button>
                </div>
            </div>
        </div>
    )
}
