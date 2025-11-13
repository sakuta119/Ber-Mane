import { useState, useEffect, useMemo } from 'react'
import { format, endOfMonth, subMonths } from 'date-fns'
import ja from 'date-fns/locale/ja'
import { supabase } from '../lib/supabase'
import StaffResultsTable from '../components/daily/StaffResultsTable'
import ValueWithUnit from '../components/common/ValueWithUnit'

const STORES = ['TEPPEN', '201', '202']
const ALL_STORES_OPTION = 'ALL'
const HAS_MONTHLY_OPINIONS_TABLE = import.meta.env.VITE_ENABLE_MONTHLY_OPINIONS === 'true'
const FIXED_EXPENSE_FIELDS = [
  { key: 'rent', label: '家賃' },
  { key: 'karaoke', label: 'カラオケ' },
  { key: 'wifi', label: 'Wifi' },
  { key: 'oshibori', label: 'おしぼり' },
  { key: 'pestControl', label: '害虫駆除' }
]

const createEmptyFixedExpense = () => FIXED_EXPENSE_FIELDS.reduce((acc, field) => {
  acc[field.key] = ''
  return acc
}, {})

const createInitialFixedExpenses = () => STORES.reduce((acc, store) => {
  acc[store] = createEmptyFixedExpense()
  return acc
}, {})

const createInitialMonthlyExpenses = () => STORES.reduce((acc, store) => {
  acc[store] = []
  return acc
}, {})

function SummaryItem({ label, value, highlight = false }) {
  return (
    <div
      className={`flex justify-between items-center px-3 py-2 rounded-md border ${highlight ? 'shadow-md' : ''}`}
      style={{
        backgroundColor: highlight ? 'var(--surface-highlight)' : 'var(--surface)',
        borderColor: highlight ? 'var(--border-highlight)' : 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span
        className="text-sm font-semibold"
        style={highlight ? { color: 'var(--accent)' } : { color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

const MonthlyReport = () => {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedStore, setSelectedStore] = useState(ALL_STORES_OPTION)
  const [reports, setReports] = useState([])
  const [staffs, setStaffs] = useState([])
  const [staffMonthlyResults, setStaffMonthlyResults] = useState([])
  const [dailyStaffSummaries, setDailyStaffSummaries] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fixedExpensesByStore, setFixedExpensesByStore] = useState(() => createInitialFixedExpenses())
  const [monthlyExpensesByStore, setMonthlyExpensesByStore] = useState(() => createInitialMonthlyExpenses())
  const [expenseSuggestions, setExpenseSuggestions] = useState([])
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [monthlyOpinions, setMonthlyOpinions] = useState('')
  const [staffMemoInputs, setStaffMemoInputs] = useState({})
  const [savedStaffMemos, setSavedStaffMemos] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    loadStaffs()
    loadExpenseSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadMonthlyReports()
    loadMonthlyStaffResults()
    loadDailyExpenses()
    if (HAS_MONTHLY_OPINIONS_TABLE) {
      loadMonthlyOpinions()
    } else {
      setMonthlyOpinions('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedStore])

  useEffect(() => {
    loadMonthlyFixedExpenses()
    loadMonthlyManualExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    loadMonthlyStaffMemos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedStore])

  useEffect(() => {
    setStaffMemoInputs(() => {
      const updated = {}
      staffMonthlyResults.forEach(result => {
        updated[result.staff_id] = savedStaffMemos[result.staff_id] ?? ''
      })
      return updated
    })
  }, [staffMonthlyResults, savedStaffMemos])

  const loadMonthlyReports = async () => {
    setIsLoading(true)
    setError('')
    try {
      const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'yyyy-MM-dd')

      let query = supabase
        .from('daily_reports')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (selectedStore !== ALL_STORES_OPTION) {
        query = query.eq('store_id', selectedStore)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('store_id', { ascending: true })

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error('Error loading monthly reports:', err)
      setReports([])
      setError('月報データの取得に失敗しました。通信環境や設定をご確認ください。')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMonthlyStaffResults = async () => {
    try {
      const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'yyyy-MM-dd')

      let query = supabase
        .from('staff_daily_results')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (selectedStore !== ALL_STORES_OPTION) {
        query = query.eq('store_id', selectedStore)
      }

      const { data, error } = await query

      if (error) throw error

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

      const aggregatedResults = Object.values(aggregatedMap).sort((a, b) => a.staff_id - b.staff_id)
      setStaffMonthlyResults(aggregatedResults)

      const dailyMap = (data || []).reduce((acc, current) => {
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

      setDailyStaffSummaries(dailyMap)
    } catch (err) {
      console.error('Error loading monthly staff results:', err)
      setStaffMonthlyResults([])
      setDailyStaffSummaries({})
    }
  }

  const loadStaffs = async () => {
    try {
      const { data, error } = await supabase
        .from('staffs')
        .select('*')
        .eq('is_active', true)
        .order('id')

      if (error) throw error
      setStaffs(data || [])
    } catch (err) {
      console.error('Error loading staffs:', err)
      setStaffs([])
    }
  }

  const loadExpenseSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      const uniqueNames = [...new Set((data || []).map(item => item.name).filter(Boolean))]
      setExpenseSuggestions(uniqueNames)
    } catch (err) {
      console.error('Error loading expense suggestions:', err)
      setExpenseSuggestions([])
    }
  }

  const loadDailyExpenses = async () => {
    try {
      const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'yyyy-MM-dd')

      let query = supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (selectedStore !== ALL_STORES_OPTION) {
        query = query.eq('store_id', selectedStore)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('store_id', { ascending: true })

      if (error) throw error
      setDailyExpenses(data || [])
    } catch (err) {
      console.error('Error loading daily expenses:', err)
      setDailyExpenses([])
    }
  }

  const loadMonthlyOpinions = async () => {
    if (!HAS_MONTHLY_OPINIONS_TABLE) {
      setMonthlyOpinions('')
      return
    }

    try {
      const { data, error } = await supabase
        .from('monthly_opinions')
        .select('opinion')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('store_id', selectedStore)
        .single()

      if (error) {
        if (!['PGRST116', 'PGRST205'].includes(error.code)) throw error
        setMonthlyOpinions('')
        return
      }

      setMonthlyOpinions(data?.opinion || '')
    } catch (err) {
      console.error('Error loading monthly opinions:', err)
      setMonthlyOpinions('')
    }
  }

  const loadMonthlyFixedExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_fixed_expenses')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)

      if (error) throw error

      const next = createInitialFixedExpenses()
      ;(data || []).forEach(item => {
        if (!STORES.includes(item.store_id)) return
        next[item.store_id] = {
          rent: item.rent != null ? item.rent.toString() : '',
          karaoke: item.karaoke != null ? item.karaoke.toString() : '',
          wifi: item.wifi != null ? item.wifi.toString() : '',
          oshibori: item.oshibori != null ? item.oshibori.toString() : '',
          pestControl: item.pest_control != null ? item.pest_control.toString() : ''
        }
      })

      setFixedExpensesByStore(next)
    } catch (err) {
      console.error('Error loading monthly fixed expenses:', err)
      setFixedExpensesByStore(createInitialFixedExpenses())
    }
  }

  const loadMonthlyManualExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_manual_expenses')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .order('store_id', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      const grouped = createInitialMonthlyExpenses()
      ;(data || []).forEach(item => {
        if (!grouped[item.store_id]) {
          grouped[item.store_id] = []
        }
        grouped[item.store_id].push({
          id: item.id,
          name: item.name || '',
          amount: item.amount != null ? item.amount.toString() : '',
          note: item.note || '',
          store: item.store_id
        })
      })

      setMonthlyExpensesByStore(grouped)
    } catch (err) {
      console.error('Error loading monthly manual expenses:', err)
      setMonthlyExpensesByStore(createInitialMonthlyExpenses())
    }
  }

  const loadMonthlyStaffMemos = async () => {
    try {
      const targetStore = selectedStore === ALL_STORES_OPTION ? 'ALL' : selectedStore
      const { data, error } = await supabase
        .from('monthly_staff_memos')
        .select('staff_id, memo')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('store_id', targetStore)

      if (error) throw error

      const memoMap = {}
      ;(data || []).forEach(item => {
        memoMap[item.staff_id] = item.memo || ''
      })

      setSavedStaffMemos(memoMap)
    } catch (err) {
      console.error('Error loading monthly staff memos:', err)
      setSavedStaffMemos({})
    }
  }

  const summary = useMemo(() => {
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
        acc.totalSales += report.total_sales_amount || 0
        acc.totalCredit += report.credit_amount || 0
        acc.totalExpense += report.total_expense_amount || 0
        acc.totalSalary += report.total_salary_amount || 0
        acc.totalGroups += report.total_groups || 0
        acc.totalCustomers += report.total_customers || 0
        acc.totalShisha += report.total_shisha || 0
        acc.totalBalance += (report.total_sales_amount || 0) - ((report.total_expense_amount || 0) + (report.total_salary_amount || 0))
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
  }, [reports])

  const isAllStores = selectedStore === ALL_STORES_OPTION

  const currentFixedExpenses = useMemo(() => {
    if (isAllStores) {
      return FIXED_EXPENSE_FIELDS.reduce((acc, field) => {
        acc[field.key] = STORES.reduce((sum, store) => sum + (parseFloat(fixedExpensesByStore[store][field.key]) || 0), 0)
        return acc
      }, {})
    }
    return fixedExpensesByStore[selectedStore] || createEmptyFixedExpense()
  }, [fixedExpensesByStore, isAllStores, selectedStore])

  const aggregatedDailyExpenses = useMemo(() => {
    const map = {}
    dailyExpenses.forEach(expense => {
      const name = expense.name?.trim() || '未分類'
      const storeId = expense.store_id
      const key = isAllStores ? `${name}-${storeId}` : name
      if (!map[key]) {
        map[key] = { name, amount: 0, notes: new Set(), store: storeId }
      }
      map[key].amount += expense.amount || 0
      if (expense.note && expense.note.trim()) {
        map[key].notes.add(expense.note.trim())
      }
    })
    return Object.values(map).map(item => ({
      name: item.name,
      amount: item.amount,
      notes: Array.from(item.notes).join(' / '),
      store: item.store
    }))
  }, [dailyExpenses, isAllStores])

  const fixedExpenseTotal = useMemo(() => (
    FIXED_EXPENSE_FIELDS.reduce((sum, field) => {
      const value = isAllStores
        ? currentFixedExpenses[field.key]
        : parseFloat(currentFixedExpenses[field.key]) || 0
      return sum + (Number(value) || 0)
    }, 0)
  ), [currentFixedExpenses, isAllStores])

  const manualExpenseEntries = useMemo(() => {
    if (isAllStores) {
      return STORES.flatMap(store =>
        (monthlyExpensesByStore[store] || []).map(item => ({
          ...item,
          store: item.store || store
        }))
      )
    }
    return (monthlyExpensesByStore[selectedStore] || []).map(item => ({
      ...item,
      store: item.store || selectedStore
    }))
  }, [isAllStores, monthlyExpensesByStore, selectedStore])

  const manualExpenseTotal = useMemo(() => {
    return manualExpenseEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  }, [manualExpenseEntries])

  const dailyExpenseTotal = useMemo(() => (
    aggregatedDailyExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  ), [aggregatedDailyExpenses])

  const totalExpenseAmount = fixedExpenseTotal + manualExpenseTotal + dailyExpenseTotal

  const summaryItems = useMemo(() => {
    const showShisha = isAllStores || selectedStore === '201' || selectedStore === '202'
    return [
      {
        label: '合計組数',
        value: (
          <span className="inline-flex items-baseline justify-end gap-3">
            <ValueWithUnit value={summary.totalGroups} unit="組" align="center" />
            <ValueWithUnit value={summary.totalCustomers} unit="人" align="center" />
          </span>
        )
      },
      {
        label: 'シーシャ販売数',
        value: showShisha
          ? <ValueWithUnit value={summary.totalShisha} unit="本" />
          : <span className="text-sm text-muted">-</span>
      },
      {
        label: '売上合計',
        value: (
          <span className="flex flex-col items-end gap-1 text-right">
            <ValueWithUnit value={summary.totalSales} unit="円" />
            <span className="inline-flex items-baseline gap-1 text-xs text-muted">
              <span>内クレカ決済</span>
              <ValueWithUnit
                value={summary.totalCredit}
                unit="円"
                valueClassName="text-xs text-muted font-medium"
                unitClassName="text-[10px] text-muted"
                className="text-xs text-muted"
              />
            </span>
          </span>
        )
      },
      {
        label: '支出合計',
        value: (
          <span className="flex flex-col items-end gap-1 text-right">
            <ValueWithUnit value={summary.totalExpense + summary.totalSalary} unit="円" />
            <span className="inline-flex items-baseline gap-1 text-xs text-muted">
              <span>内人件費額</span>
              <ValueWithUnit
                value={summary.totalSalary}
                unit="円"
                valueClassName="text-xs text-muted font-medium"
                unitClassName="text-[10px] text-muted"
                className="text-xs text-muted"
              />
            </span>
          </span>
        )
      },
      {
        label: '収支合計',
        value: (
          <ValueWithUnit
            value={summary.totalBalance}
            unit="円"
            showSign
            valueClassName={summary.totalBalance >= 0 ? 'text-accent' : 'text-red-600'}
          />
        ),
        highlight: true
      }
    ]
  }, [summary, selectedStore, isAllStores])

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => today.getFullYear() - i), [today])
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleQuickSelect = (type) => {
    switch (type) {
      case 'thisMonth': {
        const now = new Date()
        setSelectedYear(now.getFullYear())
        setSelectedMonth(now.getMonth() + 1)
        break
      }
      case 'lastMonth': {
        const last = subMonths(new Date(), 1)
        setSelectedYear(last.getFullYear())
        setSelectedMonth(last.getMonth() + 1)
        break
      }
      default:
        break
    }
  }

  const handleAddMonthlyExpense = () => {
    const targetStore = isAllStores ? STORES[0] : selectedStore
    setMonthlyExpensesByStore(prev => ({
      ...prev,
      [targetStore]: [
        ...(prev[targetStore] || []),
        { id: `local-${Date.now()}`, name: '', amount: '', note: '', store: targetStore }
      ]
    }))
  }

  const handleMonthlyExpenseChange = (storeContext, id, field, value) => {
    setMonthlyExpensesByStore(prev => {
      const updated = { ...prev }
      const currentList = [...(updated[storeContext] || [])]
      const index = currentList.findIndex(exp => exp.id === id)
      if (index === -1) return prev

      const entry = { ...currentList[index], store: currentList[index].store || storeContext }

      if (field === 'store') {
        const newStore = value
        if (!updated[newStore]) updated[newStore] = []
        currentList.splice(index, 1)
        entry.store = newStore
        updated[storeContext] = currentList
        updated[newStore] = [...updated[newStore], entry]
        return updated
      }

      entry[field] = value
      currentList[index] = entry
      updated[storeContext] = currentList
      return updated
    })
  }

  const handleMonthlyExpenseRemove = (storeContext, id) => {
    setMonthlyExpensesByStore(prev => ({
      ...prev,
      [storeContext]: (prev[storeContext] || []).filter(exp => exp.id !== id)
    }))
  }

  const handleFixedExpenseChange = (store, key, value) => {
    setFixedExpensesByStore(prev => ({
      ...prev,
      [store]: {
        ...prev[store],
        [key]: value
      }
    }))
  }

  const getSaveButtonLabel = () => {
    if (isSaving) return '保存中...'
    if (saveStatus === '保存完了') return '保存完了'
    if (saveStatus === '保存エラー') return '保存エラー'
    return '保存'
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('保存中...')

    try {
      // 固定費を保存
      const fixedPayloads = STORES.map(store => {
        const fixed = fixedExpensesByStore[store] || createEmptyFixedExpense()
        return {
          year: selectedYear,
          month: selectedMonth,
          store_id: store,
          rent: parseInt(fixed.rent, 10) || 0,
          karaoke: parseInt(fixed.karaoke, 10) || 0,
          wifi: parseInt(fixed.wifi, 10) || 0,
          oshibori: parseInt(fixed.oshibori, 10) || 0,
          pest_control: parseInt(fixed.pestControl, 10) || 0
        }
      })

      for (const payload of fixedPayloads) {
        const { error } = await supabase
          .from('monthly_fixed_expenses')
          .upsert(payload, { onConflict: 'year,month,store_id' })

        if (error) {
          throw error
        }
      }

      // 追加経費を保存（既存データを削除して再挿入）
      const { error: deleteManualError } = await supabase
        .from('monthly_manual_expenses')
        .delete()
        .eq('year', selectedYear)
        .eq('month', selectedMonth)

      if (deleteManualError) throw deleteManualError

      const manualPayloads = []
      STORES.forEach(store => {
        (monthlyExpensesByStore[store] || []).forEach(expense => {
          const trimmedName = expense.name?.trim() || ''
          const trimmedNote = expense.note?.trim() || ''
          const amountValue = parseInt(expense.amount, 10)
          const normalizedAmount = Number.isNaN(amountValue) ? 0 : amountValue

          if (!trimmedName && normalizedAmount === 0 && !trimmedNote) {
            return
          }

          manualPayloads.push({
            year: selectedYear,
            month: selectedMonth,
            store_id: store,
            name: trimmedName || '未分類',
            amount: normalizedAmount,
            note: trimmedNote || null
          })
        })
      })

      if (manualPayloads.length > 0) {
        const { error: insertManualError } = await supabase
          .from('monthly_manual_expenses')
          .insert(manualPayloads)

        if (insertManualError) throw insertManualError
      }

      // スタッフメモを保存
      const memoStore = selectedStore === ALL_STORES_OPTION ? 'ALL' : selectedStore

      const { error: deleteMemoError } = await supabase
        .from('monthly_staff_memos')
        .delete()
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('store_id', memoStore)

      if (deleteMemoError) throw deleteMemoError

      const memoPayloads = Object.entries(staffMemoInputs)
        .map(([staffId, memo]) => ({
          year: selectedYear,
          month: selectedMonth,
          store_id: memoStore,
          staff_id: Number(staffId),
          memo: (memo || '').trim()
        }))
        .filter(item => !Number.isNaN(item.staff_id) && item.memo !== '')

      if (memoPayloads.length > 0) {
        const { error: insertMemoError } = await supabase
          .from('monthly_staff_memos')
          .insert(memoPayloads)

        if (insertMemoError) throw insertMemoError
      }

      await Promise.all([
        loadMonthlyFixedExpenses(),
        loadMonthlyManualExpenses(),
        loadMonthlyStaffMemos()
      ])

      setSaveStatus('保存完了')
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (err) {
      console.error('Error saving monthly report:', err)
      setSaveStatus('保存エラー')
      setTimeout(() => setSaveStatus(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 text-primary">
      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h2 className="text-xl font-bold text-accent">月報</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">店舗</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            >
              <option value={ALL_STORES_OPTION}>全店舗</option>
              {STORES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">月</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">クイック選択</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickSelect('thisMonth')}
                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors text-[var(--header-bg)]"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                今月
              </button>
              <button
                onClick={() => handleQuickSelect('lastMonth')}
                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors text-[var(--header-bg)]"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                先月
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h3 className="text-lg font-semibold text-accent">
            {selectedYear}年{selectedMonth}月 サマリー（{selectedStore === ALL_STORES_OPTION ? '全店舗' : selectedStore}）
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {summaryItems.map((item, index) => (
            <SummaryItem
              key={`${item.label}-${index}`}
              label={item.label}
              value={item.value}
              highlight={item.highlight}
            />
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h3 className="text-lg font-semibold text-accent">経費</h3>
          <button
            onClick={handleAddMonthlyExpense}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-opacity-90 text-[var(--header-bg)]"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + 追加
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {isAllStores ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-lg">
                    <thead>
                <tr style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}>
                        <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 w-32">項目</th>
                        {STORES.map(store => (
                          <th key={`fixed-head-${store}`} className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">{store}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FIXED_EXPENSE_FIELDS.map(field => {
                        const perStore = STORES.map(store => Number(fixedExpensesByStore[store][field.key]) || 0)
                        return (
                          <tr key={`fixed-row-${field.key}`} className="border-b border-gray-200">
                            <td className="px-3 py-2 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center w-32">{field.label}</td>
                            {perStore.map((amount, idx) => (
                            <td key={`${field.key}-${STORES[idx]}`} className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200 text-right">
                              <ValueWithUnit value={amount} unit="円" />
                            </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
              </div>
            ) : (
              FIXED_EXPENSE_FIELDS.map(field => (
                <div key={field.key} className="border border-default rounded-md px-4 py-3 bg-surface-alt transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{field.label}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={currentFixedExpenses[field.key]}
                      onChange={(e) => handleFixedExpenseChange(selectedStore, field.key, e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {manualExpenseEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-4">右上の追加ボタンから登録してください。</p>
          ) : (
            <div className="space-y-3">
              {manualExpenseEntries.map(expense => (
                <div key={expense.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {isAllStores && (
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">店舗</label>
                      <select
                        value={expense.store}
                        onChange={(e) => handleMonthlyExpenseChange(expense.store, expense.id, 'store', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
                      >
                        {STORES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={isAllStores ? 'md:col-span-3' : 'md:col-span-4'}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">項目</label>
                    <input
                      type="text"
                      list="monthly-expense-suggestions"
                      value={expense.name}
                      onChange={(e) => handleMonthlyExpenseChange(expense.store, expense.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
                      placeholder="経費項目を入力..."
                    />
                  </div>
                  <div className={isAllStores ? 'md:col-span-3' : 'md:col-span-3'}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={expense.amount}
                      onChange={(e) => handleMonthlyExpenseChange(expense.store, expense.id, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
                      placeholder="0"
                    />
                  </div>
                  <div className={isAllStores ? 'md:col-span-3' : 'md:col-span-3'}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                    <input
                      type="text"
                      value={expense.note || ''}
                      onChange={(e) => handleMonthlyExpenseChange(expense.store, expense.id, 'note', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
                      placeholder="備考を入力..."
                    />
                  </div>
                  <div className="md:col-span-1 flex md:justify-end">
                    <button
                      onClick={() => handleMonthlyExpenseRemove(expense.store, expense.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <datalist id="monthly-expense-suggestions">
            {expenseSuggestions.map((name, index) => (
              <option key={index} value={name} />
            ))}
          </datalist>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">日報登録済み経費一覧</h4>
            {aggregatedDailyExpenses.length === 0 ? (
              <p className="text-center text-gray-500 py-4">対象期間の経費データはありません。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-lg">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">項目</th>
                      {isAllStores && (
                        <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">店舗</th>
                      )}
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">金額</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-yellow-200">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedDailyExpenses.map((expense, index) => (
                      <tr
                        key={`${expense.name}-${index}`}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900 text-center border-r border-gray-200">{expense.name}</td>
                        {isAllStores && (
                          <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">{expense.store || '-'}</td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                          <ValueWithUnit value={Number(expense.amount) || 0} unit="円" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">{expense.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-700">合計額:</span>
            <ValueWithUnit
              value={totalExpenseAmount}
              unit="円"
              valueClassName="text-lg font-bold text-accent"
              unitClassName="text-xs text-accent"
            />
          </div>
        </div>
      </div>

      {selectedStore !== ALL_STORES_OPTION && (
        <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h3 className="text-lg font-semibold text-accent">日別内訳</h3>
          </div>
          <div className="p-4">
            {isLoading ? (
              <p className="text-center text-gray-500 py-4">読み込み中...</p>
            ) : error ? (
              <p className="text-center text-red-500 py-4">{error}</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-gray-500 py-4">データがありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse overflow-hidden rounded-lg">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">日付</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">組数</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">人数</th>
                      {selectedStore === 'TEPPEN' ? null : (
                        <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">
                          <div className="flex flex-col items-center text-xs font-semibold leading-tight">
                            <span>シーシャ</span>
                            <span>販売数</span>
                          </div>
                        </th>
                      )}
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">売上額</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">
                        <div className="flex flex-col items-center text-xs font-semibold leading-tight">
                          <span>内クレカ</span>
                          <span>決済</span>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">給与額</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">
                        <div className="flex flex-col items-center text-xs font-semibold leading-tight">
                          <span>シャンパン</span>
                          <span>天引額</span>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">差引支給額</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-yellow-200 whitespace-nowrap">所感</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => {
                      const key = `${report.date}-${report.store_id}`
                      const dayStaffSummary = dailyStaffSummaries[key] || {}
                      const dateLabel = format(new Date(report.date + 'T00:00:00'), 'M/d(E)', { locale: ja })
                      const groupsValue = dayStaffSummary.groups ?? report.total_groups ?? 0
                      const customersValue = dayStaffSummary.customers ?? report.total_customers ?? 0
                      const shishaValue = dayStaffSummary.shisha_count ?? report.total_shisha ?? 0
                      const salesValue = dayStaffSummary.sales_amount ?? report.total_sales_amount ?? 0
                      const creditValue = dayStaffSummary.credit_amount ?? report.credit_amount ?? 0
                      const salaryValue = dayStaffSummary.base_salary ?? report.total_salary_amount ?? 0
                      const deductionValue = dayStaffSummary.champagne_deduction ?? 0
                      const paidValue = dayStaffSummary.paid_salary ?? (salaryValue - deductionValue)

                      return (
                      <tr
                        key={`${report.date}-${report.store_id}-${index}`}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}
                      >
                          <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">{dateLabel}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={groupsValue} unit="組" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={customersValue} unit="人" />
                          </td>
                          {selectedStore === 'TEPPEN' ? null : (
                            <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                              <ValueWithUnit value={shishaValue} unit="本" />
                            </td>
                          )}
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={salesValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={creditValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={salaryValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={deductionValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit
                              value={paidValue}
                              unit="円"
                              showSign
                              valueClassName={paidValue >= 0 ? 'text-[#FCAF17]' : 'text-red-600'}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center whitespace-pre-wrap">
                            {report.opinion || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <StaffResultsTable
        staffResults={staffMonthlyResults.map(result => ({
          ...result,
          paid_salary: (result.base_salary || 0) - (result.champagne_deduction || 0),
          memo: staffMemoInputs[result.staff_id] || ''
        }))}
        staffs={staffs}
        store={selectedStore === ALL_STORES_OPTION ? 'ALL' : selectedStore}
        allowMemoInput
        memoValues={staffMemoInputs}
        onMemoChange={(staffId, value) =>
          setStaffMemoInputs(prev => ({
            ...prev,
            [staffId]: value
          }))
        }
      />

      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h3 className="text-lg font-semibold text-accent">所感</h3>
        </div>
        <div className="p-4">
          <textarea
            value={monthlyOpinions}
            onChange={(e) => setMonthlyOpinions(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="この月の所感を入力してください"
          />
        </div>
      </div>

    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-default p-4 shadow-lg transition-colors">
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90"
        style={{
          backgroundColor: saveStatus === '保存エラー' ? '#dc2626' : 'var(--accent)',
          color: saveStatus === '保存エラー' ? '#ffffff' : 'var(--header-bg)'
        }}
      >
        {getSaveButtonLabel()}
      </button>
    </div>
    </div>
  )
}

export default MonthlyReport
