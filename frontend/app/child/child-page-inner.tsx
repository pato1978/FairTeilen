import { BudgetPageInner } from "../budget-page-inner"

export function ChildPageInner() {
  return (
      <BudgetPageInner
          title="Kind"
          budgetTitle="Jährliche Ausgaben"
          scopeFlags={{ isPersonal: false, isShared: false, isChild: true }}
      />
  )
}
