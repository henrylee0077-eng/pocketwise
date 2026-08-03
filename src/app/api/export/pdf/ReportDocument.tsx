import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import type { CategoryBreakdownEntry, ReportSummary } from "@/lib/reports";
import type { TransactionWithTags } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#78716c", marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  summaryBox: { flexGrow: 1, marginRight: 8, padding: 10, backgroundColor: "#f5f5f4", borderRadius: 6 },
  summaryLabel: { fontSize: 8, color: "#78716c", marginBottom: 2 },
  summaryValue: { fontSize: 13, fontWeight: 700 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e7e5e4", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1c1917", paddingVertical: 4 },
  colDate: { width: "12%" },
  colType: { width: "12%" },
  colCategory: { width: "22%" },
  colMerchant: { width: "24%" },
  colAmount: { width: "15%", textAlign: "right" },
  headerCell: { fontWeight: 700, fontSize: 9 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
});

export function ReportDocument({
  start,
  end,
  summary,
  expenseBreakdown,
  categoryNames,
  transactions,
  currency,
}: {
  start: string;
  end: string;
  summary: ReportSummary;
  expenseBreakdown: CategoryBreakdownEntry[];
  categoryNames: Map<string, string>;
  transactions: TransactionWithTags[];
  currency: string;
}) {
  const formatRM = (n: number) => formatCurrency(Math.abs(n), currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PocketWise Report</Text>
        <Text style={styles.subtitle}>{start} to {end}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValue}>{formatRM(summary.totalIncome)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={styles.summaryValue}>{formatRM(summary.totalExpense)}</Text>
          </View>
          <View style={[styles.summaryBox, { marginRight: 0 }]}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={styles.summaryValue}>{summary.net < 0 ? "-" : ""}{formatRM(summary.net)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Top Expense Categories</Text>
        {expenseBreakdown.slice(0, 8).map((entry) => (
          <View key={entry.categoryId} style={styles.breakdownRow}>
            <Text>{categoryNames.get(entry.categoryId) ?? "—"}</Text>
            <Text>{formatRM(entry.total)} ({entry.percent.toFixed(0)}%)</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Transactions ({transactions.length})</Text>
        <View style={styles.headerRow}>
          <Text style={[styles.colDate, styles.headerCell]}>Date</Text>
          <Text style={[styles.colType, styles.headerCell]}>Type</Text>
          <Text style={[styles.colCategory, styles.headerCell]}>Category</Text>
          <Text style={[styles.colMerchant, styles.headerCell]}>Merchant</Text>
          <Text style={[styles.colAmount, styles.headerCell]}>Amount</Text>
        </View>
        {transactions.map((t) => (
          <View key={t.id} style={styles.row}>
            <Text style={styles.colDate}>{t.expense_date}</Text>
            <Text style={styles.colType}>{t.type}</Text>
            <Text style={styles.colCategory}>
              {t.category_id ? (categoryNames.get(t.category_id) ?? "—") : "—"}
            </Text>
            <Text style={styles.colMerchant}>{t.merchant ?? ""}</Text>
            <Text style={styles.colAmount}>{formatRM(Number(t.amount))}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
