// src/services/CapacitorSqliteExpenseService.ts
import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { sqliteConnection } from './SqliteConnectionService'
import { DB_NAME } from './DatabaseConfigService'
import { waitForSQLiteReady } from '@/services/SqliteReadinessService'
import type { IExpenseService } from './ExpenseServiceInterface'
import  { Expense, ExpenseType } from '@/types'
import { BaseExpenseService } from './BaseExpenseService'

export class CapacitorSqliteExpenseService
    extends BaseExpenseService
    implements IExpenseService
{
    private db: SQLiteDBConnection | null = null
    private initPromise?: Promise<void>

    /**
     * Initialisiert die lokale SQLite-Datenbank einmalig.
     * Führt bei Bedarf Migration durch (z. B. Hinzufügen der Spalte "userId").
     */
    async initDb(): Promise<void> {
        if (this.initPromise) return this.initPromise

        this.initPromise = (async () => {
            console.log('[expense] waitForSQLiteReady …')
            await waitForSQLiteReady()
            await new Promise(r => setTimeout(r, 150))
            console.log('[expense] native ready')

            const { result: exists } = await sqliteConnection.isConnection(DB_NAME, false)
            this.db = exists
                ? await sqliteConnection.retrieveConnection(DB_NAME, false)
                : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false)

            await this.db.open()

            // 🧱 Tabelle "Expenses" mit aktuellem Schema anlegen (falls noch nicht vorhanden)
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS Expenses (
                                                        id          TEXT PRIMARY KEY,
                                                        userId      TEXT,            -- NEU: statt createdByUserId
                                                        groupId     TEXT,
                                                        name        TEXT,
                                                        amount      REAL,
                                                        date        TEXT,
                                                        icon        TEXT,
                                                        category    TEXT,
                                                        type        TEXT,
                                                        isRecurring INTEGER,
                                                        isBalanced  INTEGER,
                                                        distribution TEXT
                );
            `)

            // 🛠️ Migration: Falls Spalte "userId" noch nicht existierte, nachträglich ergänzen
            try {
                await this.db.execute('ALTER TABLE Expenses ADD COLUMN userId TEXT')
            } catch (e) {
                console.log(
                    '[expense] Spalte "userId" evtl. schon vorhanden:',
                    (e as Error).message
                )
            }

            console.log('[expense] Tabelle "Expenses" bereit')
        })()

        return this.initPromise
    }

    /** Lädt alle Ausgaben für den gegebenen Monat/Nutzer/Scope */
    async getExpenses(userId: string, scope: string, monthKey: string): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')

        // 🔍 DEBUG: Log input parameters
        console.log('[getExpenses] DEBUG - Input params:', {
            userId,
            scope,
            scopeLength: scope?.length,
            scopeType: typeof scope,
            monthKey,
        })

        let query: string
        let params: any[]

        // Nutze den 'type' in der Datenbank für die Filterung
        query = `SELECT * FROM Expenses 
                 WHERE userId = ? 
                 AND type = ?
                 AND substr(date,1,7) = ?`
        params = [userId, scope, monthKey]
        console.log('[getExpenses] DEBUG - Using TYPE-based query with scope:', scope)

        console.log('[getExpenses] DEBUG - Query:', query)
        console.log('[getExpenses] DEBUG - Params:', params)

        const { values } = await this.db.query(query, params)

        console.log('[getExpenses] DEBUG - Raw results:', values?.length ?? 0, 'items')
        if (values && values.length > 0) {
            console.log('[getExpenses] DEBUG - First row:', values[0])
        }

        return (values ?? []).map(row => ({
            ...row,
            createdByUserId: row.userId, // 🧠 Mapping von DB zu App-Modell
            isBalanced: !!row.isBalanced,
            isRecurring: !!row.isRecurring,
            distribution: row.distribution ? JSON.parse(row.distribution) : undefined,
            icon: { name: row.icon } as any, // ⚠️ Typischerweise wird Icon durch extra Mapping ersetzt
        })) as Expense[]
    }

    /** Speichert oder aktualisiert eine Ausgabe */
    async saveExpense(expense: Expense): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')

        // 🔍 DEBUG: Log what we're saving
        console.log('[saveExpense] DEBUG - Saving expense:', {
            id: expense.id,
            userId: expense.createdByUserId,
            groupId: expense.groupId,
            groupIdLength: expense.groupId?.length,
            type: expense.type,
            date: expense.date,
            amount: expense.amount,
        })

        await this.db.run(
            `INSERT OR REPLACE INTO Expenses
       (id, userId, groupId, name, amount, date, icon, category, type, isRecurring, isBalanced, distribution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                expense.id,
                expense.createdByUserId, // 🧠 Mapping von App-Modell zu DB
                expense.groupId ?? '',
                expense.name,
                expense.amount,
                expense.date,
                expense.icon?.name ?? '',
                expense.category ?? '',
                expense.type,
                expense.isRecurring ? 1 : 0,
                expense.isBalanced ? 1 : 0,
                expense.distribution ? JSON.stringify(expense.distribution) : null,
            ]
        )

        console.log('[saveExpense] DEBUG - Save completed')
    }

    /** Löscht eine Ausgabe nach ID */
    async deleteExpense(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')
        await this.db.run(`DELETE FROM Expenses WHERE id = ?`, [id])
    }

    /** Gibt ALLE Ausgaben zurück – ohne Filter */
    async getAllExpenses(): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')
        const { values } = await this.db.query(`SELECT * FROM Expenses`)

        // 🔍 DEBUG: Log all expenses
        console.log('[getAllExpenses] DEBUG - Total expenses in DB:', values?.length ?? 0)
        if (values && values.length > 0) {
            console.log('[getAllExpenses] DEBUG - Sample expense:', {
                id: values[0].id,
                userId: values[0].userId,
                groupId: values[0].groupId,
                groupIdLength: values[0].groupId?.length,
                type: values[0].type,
                date: values[0].date,
            })
        }

        return (values ?? []).map(row => ({
            ...row,
            createdByUserId: row.userId, // Mapping wie oben
            isBalanced: !!row.isBalanced,
            isRecurring: !!row.isRecurring,
            distribution: row.distribution ? JSON.parse(row.distribution) : undefined,
            icon: { name: row.icon } as any,
        })) as Expense[]
    }

    /** Fügt eine neue Ausgabe hinzu */
    async addExpense(expense: Expense): Promise<void> {
        return this.saveExpense(expense)
    }

    /** Aktualisiert eine bestehende Ausgabe */
    async updateExpense(expense: Expense): Promise<void> {
        return this.saveExpense(expense)
    }

    protected getDefaultType(): ExpenseType {
        return ExpenseType.Personal
    }
}

export const capacitorSqliteExpenseService = new CapacitorSqliteExpenseService()
