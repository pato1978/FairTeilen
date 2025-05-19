import { BudgetPageInner } from "../budget-page-inner"

export function SharedPageInner() {
  return (
      <BudgetPageInner
          title="Gemeinsam"
          budgetTitle="Monatliche Ausgaben"
          scopeFlags={{ isPersonal: false, isShared: true, isChild: false }}
      />
  )
}
