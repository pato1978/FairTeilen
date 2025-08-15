import { getExpenseService } from '../expense/ExpenseServiceFactory'
import { getBudgetService } from '../budget/BudgetServiceFactory'
import { GROUP_ID } from '@/config/group-config'
import type { Expense } from '@/types'
import { ExpenseType } from '@/types'

export interface TransferResult {
    success: boolean
    transferredBudgets: number
    transferredExpenses: number
    errors: string[]
}

export interface RecurringTransferOptions {
    userId: string
    fromMonthKey: string // "2024-12"
    toMonthKey: string // "2025-01"
    expenseTypes?: ExpenseType[] // Optional: nur bestimmte Typen übertragen
    transferBudgets?: boolean // Default: true
    transferExpenses?: boolean // Default: true
}

const ALL_TYPES: ExpenseType[] = [ExpenseType.Personal, ExpenseType.Shared, ExpenseType.Child]

const ET_LABEL: Record<ExpenseType, string> = {
    [ExpenseType.Personal]: 'Personal',
    [ExpenseType.Shared]: 'Shared',
    [ExpenseType.Child]: 'Child',
}

export class RecurringTransferService {
    static async transferRecurringItems(
        options: RecurringTransferOptions
    ): Promise<TransferResult> {
        const result: TransferResult = {
            success: false,
            transferredBudgets: 0,
            transferredExpenses: 0,
            errors: [],
        }

        console.log('🔄 RecurringTransfer gestartet:', options)

        try {
            // Abbruch nur, wenn bereits Budget ODER bereits wiederkehrende Ausgaben im Ziel vorhanden sind
            const hasBlockingData = await this.checkExistingData(
                options.userId,
                options.toMonthKey,
                options.expenseTypes
            )

            if (hasBlockingData) {
                console.log(
                    'ℹ️ Zielmonat hat bereits Budget oder wiederkehrende Ausgaben – Transfer übersprungen'
                )
                result.success = true
                return result
            }

            if (options.transferBudgets !== false) {
                result.transferredBudgets = await this.transferBudgets(options)
            }

            if (options.transferExpenses !== false) {
                result.transferredExpenses = await this.transferRecurringExpenses(options)
            }

            result.success = true
            console.log('✅ RecurringTransfer erfolgreich:', result)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler'
            result.errors.push(errorMsg)
            console.error('❌ RecurringTransfer Fehler:', error)
        }

        return result
    }

    private static async transferBudgets(options: RecurringTransferOptions): Promise<number> {
        let transferred = 0
        const types = options.expenseTypes ?? ALL_TYPES

        for (const type of types) {
            try {
                const budgetService = await getBudgetService(type)
                const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID

                // Budget aus Vormonat laden
                const previousBudget = await budgetService.getBudget(
                    type,
                    options.fromMonthKey,
                    options.userId,
                    groupId
                )

                // Nur übertragen, wenn ein Budget vorhanden war
                if (previousBudget > 0) {
                    await budgetService.saveBudget(
                        type,
                        options.toMonthKey,
                        previousBudget,
                        options.userId,
                        groupId
                    )
                    transferred++
                    console.log(`✅ Budget übertragen: ${ET_LABEL[type]} = ${previousBudget}`)
                }
            } catch (error) {
                console.error(`❌ Budget-Transfer Fehler für ${ET_LABEL[type]}:`, error)
            }
        }

        return transferred
    }

    private static async transferRecurringExpenses(
        options: RecurringTransferOptions
    ): Promise<number> {
        let transferred = 0
        const types = options.expenseTypes ?? ALL_TYPES

        for (const type of types) {
            try {
                const expenseService = await getExpenseService(type)
                const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID

                // Wiederkehrende Ausgaben aus Vormonat laden
                const previousExpenses = await expenseService.getExpenses(
                    options.userId,
                    type,
                    options.fromMonthKey,
                    groupId
                )

                // Nur wiederkehrende Ausgaben übertragen
                const recurringExpenses = previousExpenses.filter(
                    expense => expense.isRecurring === true
                )

                for (const expense of recurringExpenses) {
                    // Neue ID generieren (mit Fallback für Umgebungen ohne crypto.randomUUID)
                    const newId =
                        typeof crypto !== 'undefined' &&
                        typeof (crypto as any).randomUUID === 'function'
                            ? (crypto as any).randomUUID()
                            : `${Date.now()}-${Math.random().toString(16).slice(2)}`

                    // Meta-Felder bereinigen/neu setzen
                    const {
                        id: _oldId,
                        date: _oldDate,
                        createdAt: _cA,
                        updatedAt: _uA,
                        monthKey: _mK,
                        ...rest
                    } = expense as any

                    const newExpense: Expense = {
                        ...rest,
                        id: newId,
                        date: this.getFirstDayOfMonth(options.toMonthKey),
                        // @ts-ignore – nur setzen, wenn dein Typ das Feld kennt
                        monthKey: options.toMonthKey,
                        // @ts-ignore – optional
                        createdAt: new Date().toISOString(),
                        // @ts-ignore – optional
                        updatedAt: new Date().toISOString(),
                        isRecurring: true,
                    }

                    await expenseService.addExpense(newExpense, groupId)
                    transferred++
                    console.log(`✅ Wiederkehrende Ausgabe übertragen: ${expense.name}`)
                }
            } catch (error) {
                console.error(`❌ Expense-Transfer Fehler für ${ET_LABEL[type]}:`, error)
            }
        }

        return transferred
    }

    private static async checkExistingData(
        userId: string,
        monthKey: string,
        expenseTypes?: ExpenseType[]
    ): Promise<boolean> {
        const types = expenseTypes ?? ALL_TYPES

        for (const type of types) {
            try {
                const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID

                // Budget vorhanden?
                const budgetService = await getBudgetService(type)
                const existingBudget = await budgetService.getBudget(
                    type,
                    monthKey,
                    userId,
                    groupId
                )
                if (existingBudget > 0) return true

                // Bereits wiederkehrende Ausgaben vorhanden?
                const expenseService = await getExpenseService(type)
                const existingExpenses = await expenseService.getExpenses(
                    userId,
                    type,
                    monthKey,
                    groupId
                )
                const hasRecurring = existingExpenses.some(e => e.isRecurring === true)
                if (hasRecurring) return true
            } catch (error) {
                console.warn(`⚠️ checkExistingData-Fehler für ${ET_LABEL[type]}:`, error)
            }
        }

        return false
    }

    static getFirstDayOfMonth(monthKey: string): string {
        return `${monthKey}-01`
    }

    static getPreviousMonthKey(monthKey: string): string {
        const [year, month] = monthKey.split('-').map(Number)
        const date = new Date(year, month - 2) // month - 1 - 1 (0-basiert)
        const prevYear = date.getFullYear()
        const prevMonth = (date.getMonth() + 1).toString().padStart(2, '0')
        return `${prevYear}-${prevMonth}`
    }

    static getNextMonthKey(monthKey: string): string {
        const [year, month] = monthKey.split('-').map(Number)
        const date = new Date(year, month) // month - 1 + 1
        const nextYear = date.getFullYear()
        const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0')
        return `${nextYear}-${nextMonth}`
    }

    static async autoTransferForCurrentMonth(
        userId: string,
        currentMonthKey: string,
        options?: Partial<RecurringTransferOptions>
    ): Promise<TransferResult | null> {
        console.log('🔄 Auto-Transfer-Prüfung für Monat:', currentMonthKey)

        // Kein vorheriger "hasData"-Abbruch hier – die Logik steckt in transferRecurringItems/checkExistingData
        const previousMonthKey = this.getPreviousMonthKey(currentMonthKey)

        console.log('📅 Starte Auto-Transfer:', { from: previousMonthKey, to: currentMonthKey })

        return await this.transferRecurringItems({
            userId,
            fromMonthKey: previousMonthKey,
            toMonthKey: currentMonthKey,
            transferBudgets: true,
            transferExpenses: true,
            ...options,
        })
    }

    static async autoTransferOnAppStart(userId: string): Promise<TransferResult | null> {
        const today = new Date()
        const currentMonthKey = today.toISOString().slice(0, 7)

        const transferKey = `auto-transfer-${userId}-${currentMonthKey}`
        const alreadyTransferred =
            typeof localStorage !== 'undefined' ? localStorage.getItem(transferKey) : null
        if (alreadyTransferred) {
            console.log('✅ Auto-Transfer für diesen Monat bereits erfolgt')
            return null
        }

        console.log('🚀 App-Start Auto-Transfer für aktuellen Monat')
        const result = await this.autoTransferForCurrentMonth(userId, currentMonthKey)

        if (result && typeof localStorage !== 'undefined') {
            localStorage.setItem(transferKey, new Date().toISOString())
        }

        return result
    }

    static async manualTransfer(
        userId: string,
        targetMonthKey: string,
        options?: Partial<RecurringTransferOptions>
    ): Promise<TransferResult> {
        const fromMonthKey = this.getPreviousMonthKey(targetMonthKey)

        return await this.transferRecurringItems({
            userId,
            fromMonthKey,
            toMonthKey: targetMonthKey,
            transferBudgets: true,
            transferExpenses: true,
            ...options,
        })
    }
}
