import { BudgetPageInner } from "../budget-page-inner"

export function PersonalPageInner() {
  return (
      <BudgetPageInner
          title="Persönlich"
          budgetTitle="Monatliche Ausgaben"
          scopeFlags={{ isPersonal: true, isShared: false, isChild: false }}
      />
  )
}
