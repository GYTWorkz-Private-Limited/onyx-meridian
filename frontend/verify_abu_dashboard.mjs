import { BU_LIST } from "./src/data/enterprise-data.ts";
import {
  abuCostSeries, abuValueSeries, abuRevenueSnapshot, abuStockSnapshot,
  abuTaskCounts, abuDeptPerf, abuExecInsights, abuAlerts, abuCompliance, abuExpenses,
} from "./src/data/abu-dashboard-data.ts";

for (const bu of BU_LIST) {
  console.log(`\n=== ${bu.name} (${bu.id}) ===`);
  console.log("Health:", bu.health, "Compliance:", abuCompliance(bu.id));
  console.log("Revenue snapshot:", abuRevenueSnapshot(bu.id));
  console.log("Stock:", abuStockSnapshot(bu.id));
  console.log("Expenses:", abuExpenses(bu.id));
  console.log("Tasks:", abuTaskCounts(bu.id));
  console.log("Dept perf:", abuDeptPerf(bu.id));
  console.log("Cost series (first 3 days):", abuCostSeries(bu.id).slice(0, 3));
  console.log("Value series (first 3 days):", abuValueSeries(bu.id).slice(0, 3));
  console.log("Insights count:", abuExecInsights(bu.id).length);
  console.log("Alerts count:", abuAlerts(bu.id).length);
}
