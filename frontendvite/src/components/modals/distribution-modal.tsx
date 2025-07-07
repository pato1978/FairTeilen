'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Baby,
    Check,
    Euro,
    Lock,
    Percent,
    Plus,
    SwitchCamera,
    Trash2,
    Unlock,
    Users,
    X,
} from 'lucide-react'

export interface Participant {
    id: string
    name: string
    percentage: number
    amount?: number
    locked?: boolean
}

interface DistributionModalProps {
    isOpen: boolean
    onClose: () => void
    participants: Participant[]
    onSave: (participants: Participant[]) => void
    isChildExpense?: boolean
    expenseAmount?: string
}

export function DistributionModal({
    isOpen,
    onClose,
    participants: initialParticipants,
    onSave,
    isChildExpense = false,
    expenseAmount = '0',
}: DistributionModalProps) {
    const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
    const [animation, setAnimation] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
        isOpen ? 'entering' : 'exited'
    )
    const [allocationMode, setAllocationMode] = useState<'percentage' | 'amount'>('percentage')
    const modalRef = useRef<HTMLDivElement>(null)

    // Parse expense amount from string (remove € symbol and convert to number)
    const totalExpenseAmount =
        Number.parseFloat(
            String(expenseAmount ?? '0')
                .replace('€', '')
                .replace(',', '.')
        ) || 0

    // Handle animation states
    useEffect(() => {
        let timeout: NodeJS.Timeout

        if (isOpen && animation === 'entering') {
            // Start enter animation
            timeout = setTimeout(() => setAnimation('entered'), 10)
        } else if (!isOpen && animation === 'exiting') {
            // Start exit animation
            timeout = setTimeout(() => setAnimation('exited'), 300)
        }

        return () => clearTimeout(timeout)
    }, [isOpen, animation])

    // Update animation state when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setAnimation('entering')
            // Create a deep copy to ensure state updates
            const updatedParticipants = initialParticipants.map(p => ({
                ...p,
                locked: p.locked || false,
                // Calculate initial amounts based on percentages if not already set
                amount: p.amount || (p.percentage / 100) * totalExpenseAmount,
            }))
            setParticipants(updatedParticipants)
        } else if (animation !== 'exited' && animation !== 'exiting') {
            setAnimation('exiting')
        }
    }, [isOpen, initialParticipants, totalExpenseAmount])

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

    const handleSave = () => {
        // Before saving, ensure both percentage and amount values are set for all participants
        const finalParticipants = participants.map(p => {
            if (allocationMode === 'percentage') {
                // If in percentage mode, update amounts based on percentages
                return {
                    ...p,
                    amount: (p.percentage / 100) * totalExpenseAmount,
                }
            } else {
                // If in amount mode, update percentages based on amounts
                const amount = p.amount || 0
                const totalAllocated = participants.reduce(
                    (sum, part) => sum + (part.amount || 0),
                    0
                )
                const percentage = totalAllocated > 0 ? (amount / totalAllocated) * 100 : 0
                return {
                    ...p,
                    percentage: Math.round(percentage * 10) / 10,
                }
            }
        })

        onSave(finalParticipants)
        handleClose()
    }

    const handlePercentageChange = (id: string, value: number) => {
        // Ensure value is between 0 and 100
        const clampedValue = Math.min(100, Math.max(0, value))

        // Create a new array to ensure state updates
        const updatedParticipants = participants.map(p => ({ ...p }))

        // Find the participant to update
        const participantToUpdate = updatedParticipants.find(p => p.id === id)
        if (!participantToUpdate) return

        // Update the percentage
        const oldValue = participantToUpdate.percentage
        participantToUpdate.percentage = clampedValue

        // Also update the amount based on the new percentage
        participantToUpdate.amount = (clampedValue / 100) * totalExpenseAmount

        // Calculate the difference to distribute
        const diff = oldValue - clampedValue

        // Get all unlocked participants except the one being updated
        const unlocked = updatedParticipants.filter(p => p.id !== id && !p.locked)

        if (unlocked.length > 0) {
            // Calculate the total percentage of unlocked participants
            const unlockedTotal = unlocked.reduce((sum, p) => sum + p.percentage, 0)

            if (unlockedTotal > 0) {
                // Distribute the difference proportionally among unlocked participants
                unlocked.forEach(p => {
                    const ratio = p.percentage / unlockedTotal
                    p.percentage += diff * ratio
                    // Update amount as well
                    p.amount = (p.percentage / 100) * totalExpenseAmount
                })
            } else {
                // If all unlocked participants have 0%, distribute evenly
                const evenShare = diff / unlocked.length
                unlocked.forEach(p => {
                    p.percentage += evenShare
                    // Update amount as well
                    p.amount = (p.percentage / 100) * totalExpenseAmount
                })
            }
        } else {
            // If all other participants are locked, adjust this participant to make total 100%
            const total = updatedParticipants.reduce((sum, p) => sum + p.percentage, 0)
            if (total !== 100) {
                participantToUpdate.percentage = clampedValue + (100 - total)
                // Update amount as well
                participantToUpdate.amount =
                    (participantToUpdate.percentage / 100) * totalExpenseAmount
            }
        }

        // Round percentages to 1 decimal place
        updatedParticipants.forEach(p => {
            p.percentage = Math.round(p.percentage * 10) / 10
            // Ensure amount is also rounded to 2 decimal places
            p.amount = Math.round((p.amount || 0) * 100) / 100
        })

        // Ensure total is exactly 100%
        const total = updatedParticipants.reduce((sum, p) => sum + p.percentage, 0)
        if (Math.abs(total - 100) > 0.1) {
            // Find an unlocked participant to adjust
            const adjustableParticipant = updatedParticipants.find(p => !p.locked && p.id !== id)
            if (adjustableParticipant) {
                adjustableParticipant.percentage += 100 - total
                adjustableParticipant.percentage =
                    Math.round(adjustableParticipant.percentage * 10) / 10
                // Update amount as well
                adjustableParticipant.amount =
                    (adjustableParticipant.percentage / 100) * totalExpenseAmount
            } else if (!participantToUpdate.locked) {
                // If all others are locked, adjust the current participant
                participantToUpdate.percentage += 100 - total
                participantToUpdate.percentage =
                    Math.round(participantToUpdate.percentage * 10) / 10
                // Update amount as well
                participantToUpdate.amount =
                    (participantToUpdate.percentage / 100) * totalExpenseAmount
            }
        }

        setParticipants(updatedParticipants)
    }

    const handleAmountChange = (id: string, value: number) => {
        // Ensure value is not negative
        const clampedValue = Math.max(0, value)

        // Create a new array to ensure state updates
        const updatedParticipants = participants.map(p => ({ ...p }))

        // Find the participant to update
        const participantToUpdate = updatedParticipants.find(p => p.id === id)
        if (!participantToUpdate) return

        // Update the amount
        const oldAmount = participantToUpdate.amount || 0
        participantToUpdate.amount = clampedValue

        // Calculate the difference to distribute
        const diff = oldAmount - clampedValue

        // Get all unlocked participants except the one being updated
        const unlocked = updatedParticipants.filter(p => p.id !== id && !p.locked)

        if (unlocked.length > 0 && diff !== 0 && totalExpenseAmount > 0) {
            // Calculate the total amount of unlocked participants
            const unlockedTotal = unlocked.reduce((sum, p) => sum + (p.amount || 0), 0)

            if (unlockedTotal > 0) {
                // Distribute the difference proportionally among unlocked participants
                unlocked.forEach(p => {
                    const ratio = (p.amount || 0) / unlockedTotal
                    p.amount = Math.max(0, (p.amount || 0) + diff * ratio)
                })
            } else {
                // If all unlocked participants have 0, distribute evenly
                const evenShare = diff / unlocked.length
                unlocked.forEach(p => {
                    p.amount = Math.max(0, (p.amount || 0) + evenShare)
                })
            }
        }

        // Round amounts to 2 decimal places
        updatedParticipants.forEach(p => {
            p.amount = Math.round((p.amount || 0) * 100) / 100
        })

        // Calculate total allocated amount
        const totalAllocated = updatedParticipants.reduce((sum, p) => sum + (p.amount || 0), 0)

        // If total allocated exceeds total expense, adjust proportionally
        if (totalAllocated > totalExpenseAmount) {
            const ratio = totalExpenseAmount / totalAllocated
            updatedParticipants.forEach(p => {
                if (!p.locked && p.id !== id) {
                    p.amount = Math.round((p.amount || 0) * ratio * 100) / 100
                }
            })
        }

        // Update percentages based on amounts
        const newTotalAllocated = updatedParticipants.reduce((sum, p) => sum + (p.amount || 0), 0)
        if (newTotalAllocated > 0) {
            updatedParticipants.forEach(p => {
                p.percentage = Math.round(((p.amount || 0) / newTotalAllocated) * 1000) / 10
            })
        }

        setParticipants(updatedParticipants)
    }

    const handleEvenDistribution = () => {
        if (participants.length === 0) return

        if (allocationMode === 'percentage') {
            // Distribute percentages evenly
            const evenPercentage = 100 / participants.length
            const updatedParticipants = participants.map(p => ({
                ...p,
                percentage: Math.round(evenPercentage * 10) / 10,
                amount: Math.round((evenPercentage / 100) * totalExpenseAmount * 100) / 100,
                locked: false, // Unlock all participants when distributing evenly
            }))

            // Adjust for rounding errors
            const total = updatedParticipants.reduce((sum, p) => sum + p.percentage, 0)
            if (Math.abs(total - 100) > 0.1 && updatedParticipants.length > 0) {
                updatedParticipants[0].percentage += 100 - total
                updatedParticipants[0].percentage =
                    Math.round(updatedParticipants[0].percentage * 10) / 10
                updatedParticipants[0].amount =
                    Math.round(
                        (updatedParticipants[0].percentage / 100) * totalExpenseAmount * 100
                    ) / 100
            }

            setParticipants(updatedParticipants)
        } else {
            // Distribute amounts evenly
            const evenAmount = totalExpenseAmount / participants.length
            const updatedParticipants = participants.map(p => ({
                ...p,
                amount: Math.round(evenAmount * 100) / 100,
                percentage: Math.round((100 / participants.length) * 10) / 10,
                locked: false, // Unlock all participants when distributing evenly
            }))

            // Adjust for rounding errors
            const totalAmount = updatedParticipants.reduce((sum, p) => sum + (p.amount || 0), 0)
            if (
                Math.abs(totalAmount - totalExpenseAmount) > 0.01 &&
                updatedParticipants.length > 0
            ) {
                updatedParticipants[0].amount =
                    (updatedParticipants[0].amount || 0) + (totalExpenseAmount - totalAmount)
                updatedParticipants[0].amount =
                    Math.round((updatedParticipants[0].amount || 0) * 100) / 100
            }

            setParticipants(updatedParticipants)
        }
    }

    const toggleLock = (id: string) => {
        setParticipants(
            participants.map(p => (p.id === id ? { ...p, locked: !p.locked } : { ...p }))
        )
    }

    const addParticipant = () => {
        // Only allow up to 5 participants
        if (participants.length >= 5) return

        // Calculate an even distribution for the new set of participants
        const newCount = participants.length + 1
        const evenShare = 100 / newCount
        const evenAmount = totalExpenseAmount / newCount

        // Adjust existing participants' percentages and amounts
        const updatedParticipants = participants.map(p => {
            // Only adjust unlocked participants
            if (p.locked) return p
            return {
                ...p,
                percentage: Math.round(((p.percentage * (newCount - 1)) / newCount) * 10) / 10,
                amount: Math.round((((p.amount || 0) * (newCount - 1)) / newCount) * 100) / 100,
            }
        })

        // Create the new participant
        const newId = `user${participants.length + 1}`
        const newName =
            isChildExpense && newId === 'user3' ? 'Kind' : `Partner ${participants.length + 1}`

        // Add the new participant
        updatedParticipants.push({
            id: newId,
            name: newName,
            percentage: Math.round(evenShare * 10) / 10,
            amount: Math.round(evenAmount * 100) / 100,
            locked: false,
        })

        // Ensure total is exactly 100% and total amount matches expense amount
        const totalPercentage = updatedParticipants.reduce((sum, p) => sum + p.percentage, 0)
        const totalAmount = updatedParticipants.reduce((sum, p) => sum + (p.amount || 0), 0)

        if (
            Math.abs(totalPercentage - 100) > 0.1 ||
            Math.abs(totalAmount - totalExpenseAmount) > 0.01
        ) {
            // Find an unlocked participant to adjust
            const adjustableParticipant = updatedParticipants.find(p => !p.locked)
            if (adjustableParticipant) {
                if (Math.abs(totalPercentage - 100) > 0.1) {
                    adjustableParticipant.percentage += 100 - totalPercentage
                    adjustableParticipant.percentage =
                        Math.round(adjustableParticipant.percentage * 10) / 10
                }
                if (Math.abs(totalAmount - totalExpenseAmount) > 0.01) {
                    adjustableParticipant.amount =
                        (adjustableParticipant.amount || 0) + (totalExpenseAmount - totalAmount)
                    adjustableParticipant.amount =
                        Math.round((adjustableParticipant.amount || 0) * 100) / 100
                }
            }
        }

        setParticipants(updatedParticipants)
    }

    const removeParticipant = (id: string) => {
        // Don't allow removing if only 2 participants remain
        if (participants.length <= 2) return

        // Find the participant to remove
        const participantToRemove = participants.find(p => p.id === id)
        if (!participantToRemove) return

        // Get the percentage and amount to redistribute
        const percentageToRedistribute = participantToRemove.percentage
        const amountToRedistribute = participantToRemove.amount || 0

        // Filter out the participant to remove
        const remainingParticipants = participants.filter(p => p.id !== id)

        // Get unlocked participants
        const unlockedParticipants = remainingParticipants.filter(p => !p.locked)

        if (unlockedParticipants.length > 0) {
            if (allocationMode === 'percentage') {
                // Calculate total percentage of unlocked participants
                const unlockedTotal = unlockedParticipants.reduce((sum, p) => sum + p.percentage, 0)

                // Distribute the removed participant's percentage among unlocked participants
                remainingParticipants.forEach(p => {
                    if (!p.locked) {
                        const ratio =
                            unlockedTotal > 0
                                ? p.percentage / unlockedTotal
                                : 1 / unlockedParticipants.length
                        p.percentage += percentageToRedistribute * ratio
                        p.percentage = Math.round(p.percentage * 10) / 10
                        // Update amount as well
                        p.amount = Math.round((p.percentage / 100) * totalExpenseAmount * 100) / 100
                    }
                })
            } else {
                // Calculate total amount of unlocked participants
                const unlockedTotal = unlockedParticipants.reduce(
                    (sum, p) => sum + (p.amount || 0),
                    0
                )

                // Distribute the removed participant's amount among unlocked participants
                remainingParticipants.forEach(p => {
                    if (!p.locked) {
                        const ratio =
                            unlockedTotal > 0
                                ? (p.amount || 0) / unlockedTotal
                                : 1 / unlockedParticipants.length
                        p.amount = (p.amount || 0) + amountToRedistribute * ratio
                        p.amount = Math.round((p.amount || 0) * 100) / 100
                        // Update percentage as well
                        const totalAmount = remainingParticipants.reduce(
                            (sum, part) => sum + (part.amount || 0),
                            0
                        )
                        p.percentage =
                            totalAmount > 0
                                ? Math.round(((p.amount || 0) / totalAmount) * 1000) / 10
                                : 0
                    }
                })
            }
        } else {
            // If all remaining participants are locked, unlock the first one and give it the percentage/amount
            if (remainingParticipants.length > 0) {
                remainingParticipants[0].locked = false

                if (allocationMode === 'percentage') {
                    remainingParticipants[0].percentage += percentageToRedistribute
                    remainingParticipants[0].percentage =
                        Math.round(remainingParticipants[0].percentage * 10) / 10
                    remainingParticipants[0].amount =
                        Math.round(
                            (remainingParticipants[0].percentage / 100) * totalExpenseAmount * 100
                        ) / 100
                } else {
                    remainingParticipants[0].amount =
                        (remainingParticipants[0].amount || 0) + amountToRedistribute
                    remainingParticipants[0].amount =
                        Math.round((remainingParticipants[0].amount || 0) * 100) / 100

                    const totalAmount = remainingParticipants.reduce(
                        (sum, p) => sum + (p.amount || 0),
                        0
                    )
                    if (totalAmount > 0) {
                        remainingParticipants.forEach(p => {
                            p.percentage = Math.round(((p.amount || 0) / totalAmount) * 1000) / 10
                        })
                    }
                }
            }
        }

        // Ensure total is exactly 100% and total amount matches expense amount
        const totalPercentage = remainingParticipants.reduce((sum, p) => sum + p.percentage, 0)
        const totalAmount = remainingParticipants.reduce((sum, p) => sum + (p.amount || 0), 0)

        if (
            Math.abs(totalPercentage - 100) > 0.1 ||
            Math.abs(totalAmount - totalExpenseAmount) > 0.01
        ) {
            // Find an unlocked participant to adjust
            const adjustableParticipant = remainingParticipants.find(p => !p.locked)
            if (adjustableParticipant) {
                if (Math.abs(totalPercentage - 100) > 0.1) {
                    adjustableParticipant.percentage += 100 - totalPercentage
                    adjustableParticipant.percentage =
                        Math.round(adjustableParticipant.percentage * 10) / 10
                }
                if (Math.abs(totalAmount - totalExpenseAmount) > 0.01) {
                    adjustableParticipant.amount =
                        (adjustableParticipant.amount || 0) + (totalExpenseAmount - totalAmount)
                    adjustableParticipant.amount =
                        Math.round((adjustableParticipant.amount || 0) * 100) / 100
                }
            }
        }

        setParticipants(remainingParticipants)
    }

    const toggleAllocationMode = () => {
        // When switching modes, ensure all values are properly calculated
        const updatedParticipants = participants.map(p => {
            if (allocationMode === 'percentage') {
                // Switching from percentage to amount
                return {
                    ...p,
                    amount: Math.round((p.percentage / 100) * totalExpenseAmount * 100) / 100,
                }
            } else {
                // Switching from amount to percentage
                const totalAllocated = participants.reduce(
                    (sum, part) => sum + (part.amount || 0),
                    0
                )
                return {
                    ...p,
                    percentage:
                        totalAllocated > 0
                            ? Math.round(((p.amount || 0) / totalAllocated) * 1000) / 10
                            : 0,
                }
            }
        })

        setParticipants(updatedParticipants)
        setAllocationMode(allocationMode === 'percentage' ? 'amount' : 'percentage')
    }

    // Calculate total allocated amount and remaining amount
    const totalAllocatedAmount = participants.reduce((sum, p) => sum + (p.amount || 0), 0)
    const remainingAmount = Math.max(0, totalExpenseAmount - totalAllocatedAmount)
    const isOverAllocated = totalAllocatedAmount > totalExpenseAmount

    return (
        <div
            className={`fixed inset-0 z-50 bg-black transition-opacity duration-300 ${
                animation === 'entering' || animation === 'entered'
                    ? 'bg-opacity-50'
                    : 'bg-opacity-0'
            } ${animation === 'exited' ? 'pointer-events-none' : ''}`}
            onClick={e => {
                // Prevent clicks inside the modal from closing it
                e.stopPropagation()
            }}
        >
            <div
                ref={modalRef}
                className={`fixed top-1/2 left-1/2 -translate-y-1/2 h-auto max-h-[85%] w-[85%] sm:w-[75%] md:w-[65%] max-w-md bg-[#f8fafc] rounded-xl shadow-lg transform transition-all duration-300 ease-out z-50 ${
                    animation === 'entering' || animation === 'entered'
                        ? 'translate-x-[-50%] opacity-100'
                        : 'translate-x-[50%] opacity-0'
                }`}
                onClick={e => {
                    // Prevent clicks inside the modal from closing it
                    e.stopPropagation()
                }}
            >
                {/* Header */}
                <div className="sticky top-0 px-4 py-3 flex justify-between items-center z-10 bg-blue-600 text-white">
                    <h3 className="font-medium text-lg">Verteilung festlegen</h3>
                    <button
                        onClick={e => {
                            e.stopPropagation()
                            handleClose()
                        }}
                        className="p-2 rounded-full hover:bg-blue-500 active:bg-blue-700 transition-colors"
                    >
                        <X className="h-5 w-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 pb-safe overflow-y-auto max-h-[calc(100%-56px)] flex flex-col">
                    {/* Allocation Mode Toggle */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700">
                                Verteilungsmethode
                            </h4>
                            <button
                                onClick={e => {
                                    e.stopPropagation()
                                    toggleAllocationMode()
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <SwitchCamera className="h-4 w-4 mr-1" />
                                <span className="text-xs">
                                    {allocationMode === 'percentage'
                                        ? 'Zu Beträgen wechseln'
                                        : 'Zu Prozenten wechseln'}
                                </span>
                            </button>
                        </div>

                        {/* Mode description */}
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                            {allocationMode === 'percentage' ? (
                                <div className="flex items-center">
                                    <Percent className="h-4 w-4 mr-1 flex-shrink-0" />
                                    <span>
                                        Prozentuale Verteilung: Jeder Teilnehmer erhält einen
                                        prozentualen Anteil der Gesamtausgabe.
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <Euro className="h-4 w-4 mr-1 flex-shrink-0" />
                                    <span>
                                        Betragsverteilung: Geben Sie für jeden Teilnehmer einen
                                        konkreten Betrag an.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                                {allocationMode === 'percentage'
                                    ? 'Prozentuale Verteilung'
                                    : 'Betragsverteilung'}
                            </h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={e => {
                                        e.stopPropagation()
                                        handleEvenDistribution()
                                    }}
                                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                                >
                                    Gleichmäßig verteilen
                                </button>
                                {participants.length < 5 && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation()
                                            addParticipant()
                                        }}
                                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-md hover:bg-green-100 flex items-center"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Partner
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {participants.map(participant => (
                                <div
                                    key={participant.id}
                                    className={`bg-white rounded-xl border ${participant.locked ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} p-3 shadow-sm`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center">
                                            <div
                                                className={`${participant.locked ? 'bg-blue-100' : 'bg-blue-50'} p-2 rounded-full mr-2`}
                                            >
                                                {participant.name.includes('Kind') ? (
                                                    <Baby className="h-4 w-4 text-blue-600" />
                                                ) : (
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                )}
                                            </div>
                                            <span className="font-medium">{participant.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1">
                                                {allocationMode === 'percentage' ? (
                                                    <>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={participant.percentage}
                                                            onChange={e => {
                                                                e.stopPropagation()
                                                                if (!participant.locked) {
                                                                    handlePercentageChange(
                                                                        participant.id,
                                                                        Number.parseFloat(
                                                                            e.target.value
                                                                        ) || 0
                                                                    )
                                                                }
                                                            }}
                                                            className={`w-12 bg-transparent text-right focus:outline-none ${participant.locked ? 'text-gray-500' : ''}`}
                                                            disabled={participant.locked}
                                                        />
                                                        <Percent className="h-4 w-4 text-gray-500 ml-1" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-gray-500 mr-1">
                                                            €
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={(
                                                                participant.amount || 0
                                                            ).toFixed(2)}
                                                            onChange={e => {
                                                                e.stopPropagation()
                                                                if (!participant.locked) {
                                                                    handleAmountChange(
                                                                        participant.id,
                                                                        Number.parseFloat(
                                                                            e.target.value
                                                                        ) || 0
                                                                    )
                                                                }
                                                            }}
                                                            className={`w-16 bg-transparent text-right focus:outline-none ${participant.locked ? 'text-gray-500' : ''}`}
                                                            disabled={participant.locked}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    toggleLock(participant.id)
                                                }}
                                                className={`p-1.5 rounded-full ${
                                                    participant.locked
                                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                                aria-label={
                                                    participant.locked ? 'Entsperren' : 'Sperren'
                                                }
                                            >
                                                {participant.locked ? (
                                                    <Lock className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Unlock className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            {participants.length > 2 && (
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        removeParticipant(participant.id)
                                                    }}
                                                    className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                                                    aria-label="Entfernen"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Slider - only show in percentage mode */}
                                    {allocationMode === 'percentage' && (
                                        <div className="relative pt-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={participant.percentage}
                                                onChange={e => {
                                                    e.stopPropagation()
                                                    if (!participant.locked) {
                                                        handlePercentageChange(
                                                            participant.id,
                                                            Number.parseFloat(e.target.value)
                                                        )
                                                    }
                                                }}
                                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer relative z-10 ${
                                                    participant.locked
                                                        ? 'opacity-70 cursor-not-allowed'
                                                        : ''
                                                }`}
                                                style={{
                                                    background: `linear-gradient(to right, ${participant.locked ? '#93c5fd' : '#3b82f6'} 0%, ${participant.locked ? '#93c5fd' : '#3b82f6'} ${participant.percentage}%, #e5e7eb ${participant.percentage}%, #e5e7eb 100%)`,
                                                }}
                                                disabled={participant.locked}
                                            />
                                        </div>
                                    )}

                                    {/* Amount display in percentage mode */}
                                    {allocationMode === 'percentage' && (
                                        <div className="mt-2 text-xs text-gray-500 text-right">
                                            ≈ €
                                            {(
                                                (participant.percentage / 100) *
                                                totalExpenseAmount
                                            ).toFixed(2)}
                                        </div>
                                    )}

                                    {/* Percentage display in amount mode */}
                                    {allocationMode === 'amount' && (
                                        <div className="mt-2 text-xs text-gray-500 text-right">
                                            ≈ {participant.percentage.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total indicator */}
                    <div className="mb-4 bg-blue-50 p-3 rounded-xl">
                        {allocationMode === 'percentage' ? (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-700">Gesamt:</span>
                                <span
                                    className={`text-sm font-bold ${
                                        Math.abs(
                                            participants.reduce((sum, p) => sum + p.percentage, 0) -
                                                100
                                        ) > 0.1
                                            ? 'text-red-600'
                                            : 'text-blue-700'
                                    }`}
                                >
                                    {participants
                                        .reduce((sum, p) => sum + p.percentage, 0)
                                        .toFixed(1)}
                                    %
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-700">
                                        Gesamtausgabe:
                                    </span>
                                    <span className="text-sm font-bold text-blue-700">
                                        €{totalExpenseAmount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-700">
                                        Zugewiesen:
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${isOverAllocated ? 'text-red-600' : 'text-blue-700'}`}
                                    >
                                        €{totalAllocatedAmount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-700">
                                        Verbleibend:
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}
                                    >
                                        {isOverAllocated ? '-' : ''}€
                                        {Math.abs(remainingAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Warning for over-allocation */}
                    {allocationMode === 'amount' && isOverAllocated && (
                        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                            Warnung: Die zugewiesenen Beträge übersteigen die Gesamtausgabe. Bitte
                            passen Sie die Beträge an.
                        </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 flex space-x-3 border-t border-gray-100 sticky bottom-0 bg-[#f8fafc] pb-4 px-4 rounded-b-xl">
                        <button
                            className="flex-1 py-2.5 text-sm font-medium text-blue-600 bg-white rounded-xl active:bg-gray-100 transition-colors"
                            onClick={e => {
                                e.stopPropagation()
                                handleClose()
                            }}
                        >
                            Abbrechen
                        </button>
                        <button
                            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl active:bg-blue-700 transition-colors flex items-center justify-center"
                            onClick={e => {
                                e.stopPropagation()
                                handleSave()
                            }}
                            disabled={allocationMode === 'amount' && isOverAllocated}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Speichern
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
