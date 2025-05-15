import { MultiBudgetProvider } from "@/context/multi-budget-context"
import { HomePage } from "./home/home-page" // ✅ exakt so schreiben

export default function Page() {
    return (
        <MultiBudgetProvider>
            <HomePage />
        </MultiBudgetProvider>
    )
}
