// src/services/CapacitorSqliteExpenseService.ts
import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { sqliteConnection } from './sqliteConnection'
import { DB_NAME } from './dbName'
import { waitForSQLiteReady } from '@/services/wait-sqlite-ready'
import type { IExpenseService } from './IExpenseService'
import type { Expense } from '@/types'

export class CapacitorSqliteExpenseService implements IExpenseService {
    private db: SQLiteDBConnection | null = null
    private initPromise?: Promise<void>

    /**
     * Initialisiert die lokale SQLite-Datenbank einmalig.
     * Führt bei Bedarf Migration durch (z. B. Hinzufügen der Spalte "userId").
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

    /** Lädt alle Ausgaben für den gegebenen Monat/Nutzer/Scope (Scope ignoriert, da ExpenseType verwendet wird) */
    async getExpenses(userId: string, groupId: string, monthKey: string): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')

        // 🔍 Scope wird ignoriert – nur type wird verwendet
        const { values } = await this.db.query(
            `SELECT * FROM Expenses
             WHERE userId = ? AND groupId = ? AND substr(date,1,7) = ?`,
            [userId, groupId, monthKey]
        )

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
}

export const capacitorSqliteExpenseService = new CapacitorSqliteExpenseService()
