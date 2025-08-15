// src/services/ExpenseServiceFactory.ts
import { Capacitor } from '@capacitor/core'
import { capacitorSqliteExpenseService } from './CapacitorSqliteExpenseService'
import { sqlJsExpenseService } from './SqlJsExpenseService'
import { BackendExpenseService } from './BackendExpenseService'
import type { ExpenseScope, IExpenseService } from './ExpenseServiceInterface'

/**
 * Factory for creating expense service instances
 */
export class ExpenseServiceFactory {
    /**
     * Service instances
     */
    private static readonly backendService = new BackendExpenseService();
    private static readonly localService = Capacitor.isNativePlatform?.()
        ? capacitorSqliteExpenseService
        : sqlJsExpenseService;

    private static readonly services: Record<ExpenseScope, IExpenseService> = {
        personal: ExpenseServiceFactory.localService,
        shared: ExpenseServiceFactory.backendService,
        child: ExpenseServiceFactory.backendService,
    };

    /**
     * Initialize the local database
     */
    static {
        (async () => {
            if (Capacitor.isNativePlatform?.()) {
                await capacitorSqliteExpenseService.initDb?.()
            } else {
                await sqlJsExpenseService.initDb?.()
            }
        })();
    }

    /**
     * Returns the appropriate expense service for the given scope
     * 
     * @param scope The expense scope
     * @returns The appropriate expense service
     */
    public static getExpenseService(scope: ExpenseScope = 'personal'): IExpenseService {
        return ExpenseServiceFactory.services[scope];
    }
}

// For backward compatibility
export const getExpenseService = ExpenseServiceFactory.getExpenseService;