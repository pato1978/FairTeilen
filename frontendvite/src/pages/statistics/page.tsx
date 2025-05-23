"use client"

import { ArrowRight } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageHeader } from "@/components/layout/page-header"
import { MonthSelector } from "@/components/layout/month-selector"
import { useMonth } from "@/context/month-context"
import type { FinancialData } from "@/types"

export default function StatisticsPage() {
  const { currentDate } = useMonth()

  // Sample financial data
  const financialData: FinancialData = {
    totalSharedExpenses: 620, // Nur gemeinsame Ausgaben
    userAllocation: {
      user1: {
        name: "Partner 1",
        total: 310, // Hälfte der gemeinsamen Ausgaben
        sharedContribution: 420, // Tatsächlich bezahlter Anteil
        balance: 110, // Positiv bedeutet, dass ihnen Geld zusteht
      },
      user2: {
        name: "Partner 2",
        total: 310, // Hälfte der gemeinsamen Ausgaben
        sharedContribution: 200, // Tatsächlich bezahlter Anteil
        balance: -110, // Negativ bedeutet, dass sie Geld schulden
      },
    },
  }

  // Component for the expense allocation card
  const ExpenseAllocationCard = ({ user, otherUser }) => {
    const isOwing = user.balance < 0
    const balanceAmount = Math.abs(user.balance).toFixed(2)

    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-lg mb-3">{user.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Bezahlte gemeinsame Ausgaben:</span>
            <span className="font-medium">€{user.sharedContribution.toFixed(2)}</span>
          </div>

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sollte bezahlen (50%):</span>
              <span className="font-medium">€{user.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center font-semibold">
              <span className={isOwing ? "text-red-600" : "text-green-600"}>{isOwing ? "Schuldet:" : "Bekommt:"}</span>
              <span className={isOwing ? "text-red-600" : "text-green-600"}>€{balanceAmount}</span>
            </div>

            {isOwing && (
              <div className="mt-2 bg-blue-50 p-2 rounded-md flex items-center justify-between">
                <span className="text-sm text-blue-700">Überweise an {otherUser.name}:</span>
                <span className="font-semibold text-blue-700">€{balanceAmount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Component for the expense summary
  const ExpenseSummary = ({ data }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-lg mb-3">Gemeinsame Ausgabenübersicht</h3>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Gesamt</div>
            <div className="text-xl font-bold text-black">€{data.totalSharedExpenses.toFixed(2)}</div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Pro Person (50%)</div>
            <div className="text-xl font-bold text-black">€{(data.totalSharedExpenses / 2).toFixed(2)}</div>
          </div>
        </div>
      </div>
    )
  }

  // Component for the fair split calculation
  const FairSplitCalculation = ({ data }) => {
    const user1 = data.userAllocation.user1
    const user2 = data.userAllocation.user2
    const transferAmount = Math.abs(user1.balance).toFixed(2)
    const fromUser = user1.balance < 0 ? user1.name : user2.name
    const toUser = user1.balance < 0 ? user2.name : user1.name

    return (
      <div className="bg-blue-50 rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-lg mb-3 text-black text-center">Aufteilung der Ausgaben</h3>

        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Gemeinsame Ausgaben:</span>
            <span className="font-medium">€{data.totalSharedExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pro Person (50%):</span>
            <span className="font-medium">€{(data.totalSharedExpenses / 2).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="font-medium">{user1.name}</div>
            <div className="text-sm text-gray-600">Bezahlt: €{user1.sharedContribution.toFixed(2)}</div>
          </div>

          <div className="flex flex-col items-center">
            <ArrowRight className="h-5 w-5 text-black mb-1" />
            <div className="text-xs text-black font-medium">Ausgleich</div>
          </div>

          <div className="text-center">
            <div className="font-medium">{user2.name}</div>
            <div className="text-sm text-gray-600">Bezahlt: €{user2.sharedContribution.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-blue-100 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center text-blue-700 font-medium mb-1">Ausgleichszahlung</div>
          <div className="flex items-center justify-center">
            <span className="font-bold text-blue-700">{fromUser}</span>
            <ArrowRight className="h-4 w-4 text-blue-700 mx-2" />
            <span className="font-bold text-blue-700">{toUser}</span>
          </div>
          <div className="text-center font-bold text-blue-700 text-xl mt-1">€{transferAmount}</div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout showAddButton={false}>
      {/* Container Layout Area */}
      <div className="page-header-container">
        <PageHeader title="Gemeinsame Ausgaben" />
        <MonthSelector />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pb-6 mt-8 overflow-y-auto h-[calc(100vh-14rem)]">
        {/* Expense Summary */}
        <ExpenseSummary data={financialData} />

        {/* Fair Split Calculation */}
        <FairSplitCalculation data={financialData} />
      </main>
    </PageLayout>
  )
}
