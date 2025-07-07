import { MultiBudgetProvider } from '@/context/multi-budget-context'
import HomePage from './home-page.tsx' // ✅ exakt so schreiben

export default function Page() {
    return (
        <MultiBudgetProvider>
            <HomePage />
        </MultiBudgetProvider>
    )
}
