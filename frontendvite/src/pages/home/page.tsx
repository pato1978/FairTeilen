import { MultiBudgetProvider } from '@/context/multi-budget-context'
import { NotificationProvider } from '@/context/notification-context'
import HomePage from './home-page.tsx' // ✅ exakt so schreiben

export default function Page() {
    return (
        <MultiBudgetProvider>
            <NotificationProvider>
                <HomePage />
            </NotificationProvider>
        </MultiBudgetProvider>
    )
}
