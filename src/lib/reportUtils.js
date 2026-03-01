export const buildExpenseTotalsByDateStore = (dailyExpenses) => (
  (dailyExpenses || []).reduce((acc, expense) => {
    const key = `${expense.date}-${expense.store_id}`
    acc[key] = (acc[key] || 0) + (expense.amount || 0)
    return acc
  }, {})
)

export const filterReportsWithData = (reports, expenseTotalsByReport) => (
  (reports || []).filter((report) => {
    const expenseValue = expenseTotalsByReport?.[`${report.date}-${report.store_id}`] || 0
    const hasNumbers = (report.total_sales_amount || 0) > 0
      || (report.credit_amount || 0) > 0
      || (report.total_groups || 0) > 0
      || (report.total_customers || 0) > 0
      || (report.total_shisha || 0) > 0
      || (report.total_salary_amount || 0) > 0
      || expenseValue > 0
    const hasMemo = (report.memo && report.memo.trim().length > 0)
      || (report.opinion && report.opinion.trim().length > 0)
    return hasNumbers || hasMemo
  })
)

export const summarizeReports = (reports, expenseTotalsByReport) => {
  if (!reports || reports.length === 0) {
    return {
      totalSales: 0,
      totalCredit: 0,
      totalExpense: 0,
      totalSalary: 0,
      totalGroups: 0,
      totalCustomers: 0,
      totalShisha: 0,
      totalBalance: 0,
      daysCount: 0
    }
  }

  const totals = reports.reduce(
    (acc, report) => {
      const expenseValue = expenseTotalsByReport?.[`${report.date}-${report.store_id}`] || 0
      acc.totalSales += report.total_sales_amount || 0
      acc.totalCredit += report.credit_amount || 0
      acc.totalExpense += expenseValue
      acc.totalSalary += report.total_salary_amount || 0
      acc.totalGroups += report.total_groups || 0
      acc.totalCustomers += report.total_customers || 0
      acc.totalShisha += report.total_shisha || 0
      acc.totalBalance += (report.total_sales_amount || 0) - (expenseValue + (report.total_salary_amount || 0))
      acc.uniqueDates.add(report.date)
      return acc
    },
    {
      totalSales: 0,
      totalCredit: 0,
      totalExpense: 0,
      totalSalary: 0,
      totalGroups: 0,
      totalCustomers: 0,
      totalShisha: 0,
      totalBalance: 0,
      uniqueDates: new Set()
    }
  )

  return {
    totalSales: totals.totalSales,
    totalCredit: totals.totalCredit,
    totalExpense: totals.totalExpense,
    totalSalary: totals.totalSalary,
    totalGroups: totals.totalGroups,
    totalCustomers: totals.totalCustomers,
    totalShisha: totals.totalShisha,
    totalBalance: totals.totalBalance,
    daysCount: totals.uniqueDates.size
  }
}

export const aggregateStaffResultsByStaffId = (data) => {
  const aggregatedMap = (data || []).reduce((acc, current) => {
    const key = current.staff_id
    if (!acc[key]) {
      acc[key] = {
        id: key,
        staff_id: key,
        sales_amount: 0,
        credit_amount: 0,
        shisha_count: 0,
        groups: 0,
        customers: 0,
        base_salary: 0,
        champagne_deduction: 0,
        paid_salary: 0,
        fraction_cut: 0
      }
    }

    acc[key].sales_amount += current.sales_amount || 0
    acc[key].credit_amount += current.credit_amount || 0
    acc[key].shisha_count += current.shisha_count || 0
    acc[key].groups += current.groups || 0
    acc[key].customers += current.customers || 0
    acc[key].base_salary += current.base_salary || 0
    acc[key].champagne_deduction += current.champagne_deduction || 0
    acc[key].paid_salary += current.paid_salary || 0
    acc[key].fraction_cut += current.fraction_cut || 0

    return acc
  }, {})

  return Object.values(aggregatedMap).sort((a, b) => a.staff_id - b.staff_id)
}

export const aggregateStaffResultsByDateStore = (data) => (
  (data || []).reduce((acc, current) => {
    const key = `${current.date}-${current.store_id}`
    if (!acc[key]) {
      acc[key] = {
        date: current.date,
        store_id: current.store_id,
        groups: 0,
        customers: 0,
        sales_amount: 0,
        credit_amount: 0,
        shisha_count: 0,
        base_salary: 0,
        champagne_deduction: 0,
        paid_salary: 0
      }
    }

    acc[key].groups += current.groups || 0
    acc[key].customers += current.customers || 0
    acc[key].sales_amount += current.sales_amount || 0
    acc[key].credit_amount += current.credit_amount || 0
    acc[key].shisha_count += current.shisha_count || 0
    acc[key].base_salary += current.base_salary || 0
    acc[key].champagne_deduction += current.champagne_deduction || 0
    acc[key].paid_salary += (current.base_salary || 0) - (current.champagne_deduction || 0)

    return acc
  }, {})
)

export const summarizeStaffPerformance = (data) => {
  const uniqueDates = new Set((data || []).map(d => d.date)).size
  const totalGroups = (data || []).reduce((sum, d) => sum + (d.groups || 0), 0)
  const totalCustomers = (data || []).reduce((sum, d) => sum + (d.customers || 0), 0)
  const totalSales = (data || []).reduce((sum, d) => sum + (d.sales_amount || 0), 0)
  const totalCredit = (data || []).reduce((sum, d) => sum + (d.credit_amount || 0), 0)
  const totalShisha = (data || []).reduce((sum, d) => sum + (d.shisha_count || 0), 0)
  const totalBaseSalary = (data || []).reduce((sum, d) => sum + (d.base_salary || 0), 0)
  const totalChampagneDeduction = (data || []).reduce((sum, d) => sum + (d.champagne_deduction || 0), 0)
  const totalFractionCut = (data || []).reduce((sum, d) => sum + (d.fraction_cut || 0), 0)
  const totalPaidSalary = (data || []).reduce((sum, d) => sum + (d.paid_salary || 0), 0)
  const dailyPaid = uniqueDates > 0 ? Math.floor(totalPaidSalary / uniqueDates) : 0

  return {
    workDays: uniqueDates,
    totalGroups,
    totalCustomers,
    totalSales,
    totalCredit,
    totalShisha,
    totalBaseSalary,
    totalChampagneDeduction,
    totalFractionCut,
    totalPaidSalary,
    dailyPaid
  }
}
