import { useState, useEffect, useMemo } from 'react'
import { format, startOfYear, endOfYear, subYears } from 'date-fns'
import ja from 'date-fns/locale/ja'
import { supabase } from '../lib/supabase'
import StaffResultsTable from '../components/daily/StaffResultsTable'
import ValueWithUnit from '../components/common/ValueWithUnit'

const STORES = ['TEPPEN', '201', '202']
const ALL_STORES_OPTION = 'ALL'
const HAS_YEARLY_OPINIONS_TABLE = import.meta.env.VITE_ENABLE_YEARLY_OPINIONS === 'true'
const FIXED_EXPENSE_FIELDS = [
  { key: 'rent', label: '家賃' },
  { key: 'karaoke', label: 'カラオケ' },
  { key: 'wifi', label: 'Wifi' },
  { key: 'oshibori', label: 'おしぼり' },
  { key: 'pestControl', label: '害虫駆除' }
]

const createZeroFixedExpense = () => FIXED_EXPENSE_FIELDS.reduce((acc, field) => {
  acc[field.key] = 0
  return acc
}, {})

const createInitialFixedTotals = () => STORES.reduce((acc, store) => {
  acc[store] = createZeroFixedExpense()
  return acc
}, {})

const createInitialManualAggregates = () => STORES.reduce((acc, store) => {
  acc[store] = []
  return acc
}, {})

function SummaryItem({ label, value, highlight = false }) {
  return (
    <div
      className={`flex justify-between items-start px-3 py-2 rounded-md border ${highlight ? 'shadow-md' : ''}`}
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

const YearlyReport = () => {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedStore, setSelectedStore] = useState(ALL_STORES_OPTION)
  const [reports, setReports] = useState([])
  const [staffs, setStaffs] = useState([])
  const [staffYearlyResults, setStaffYearlyResults] = useState([])
  const [dailyStaffSummaries, setDailyStaffSummaries] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fixedTotalsByStore, setFixedTotalsByStore] = useState(() => createInitialFixedTotals())
  const [manualAggregatedByStore, setManualAggregatedByStore] = useState(() => createInitialManualAggregates())
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [yearlyOpinions, setYearlyOpinions] = useState('')
  const [staffMemoInputs, setStaffMemoInputs] = useState({})
  const [savedStaffMemos, setSavedStaffMemos] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    loadStaffs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadYearlyReports()
    loadYearlyStaffResults()
    loadDailyExpenses()
    if (HAS_YEARLY_OPINIONS_TABLE) {
      loadYearlyOpinions()
    } else {
      setYearlyOpinions('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedStore])

  useEffect(() => {
    loadYearlyFixedExpenses()
    loadYearlyManualExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  useEffect(() => {
    loadYearlyStaffMemos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedStore])

  useEffect(() => {
    setStaffMemoInputs(() => {
      const updated = {}
      staffYearlyResults.forEach(result => {
        updated[result.staff_id] = savedStaffMemos[result.staff_id] ?? ''
      })
      return updated
    })
  }, [staffYearlyResults, savedStaffMemos])

  const loadYearlyReports = async () => {
    setIsLoading(true)
    setError('')
    try {
      const startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')
      const endDate = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')

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
      console.error('Error loading yearly reports:', err)
      setReports([])
      setError('年報データの取得に失敗しました。通信環境や設定をご確認ください。')
    } finally {
      setIsLoading(false)
    }
  }

  const loadYearlyStaffResults = async () => {
    try {
      const startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')
      const endDate = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')

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

      // 各スタッフの勤務日数を計算（組数が入力されている日数をカウント）
      const workDaysMap = {}
      const aggregatedMap = (data || []).reduce((acc, current) => {
        const key = current.staff_id
        
        // 勤務日数のカウント（組数が入力されている日）
        if (!workDaysMap[key]) {
          workDaysMap[key] = new Set()
        }
        const groupsValue = current.groups != null ? Number(current.groups) : 0
        if (groupsValue > 0 || current.groups != null) {
          workDaysMap[key].add(current.date)
        }
        
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
            fraction_cut: 0,
            work_days: 0
          }
        }

        acc[key].sales_amount += current.sales_amount || 0
        acc[key].credit_amount += current.credit_amount || 0
        acc[key].shisha_count += current.shisha_count || 0
        acc[key].groups += Number(current.groups) || 0
        acc[key].customers += Number(current.customers) || 0
        acc[key].base_salary += current.base_salary || 0
        acc[key].champagne_deduction += current.champagne_deduction || 0
        acc[key].paid_salary += current.paid_salary || 0
        acc[key].fraction_cut += current.fraction_cut || 0

        return acc
      }, {})

      // 勤務日数を設定
      Object.keys(aggregatedMap).forEach(staffId => {
        aggregatedMap[staffId].work_days = workDaysMap[staffId]?.size || 0
      })

      const aggregatedResults = Object.values(aggregatedMap).sort((a, b) => a.staff_id - b.staff_id)
      setStaffYearlyResults(aggregatedResults)

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
      console.error('Error loading yearly staff results:', err)
      setStaffYearlyResults([])
      setDailyStaffSummaries({})
    }
  }

  const loadStaffs = async () => {
    try {
      // スタッフ一覧を取得（削除済みスタッフも含む。実績データの表示に必要）
      const { data, error } = await supabase
        .from('staffs')
        .select('*')
        .order('id')

      if (error) throw error
      
      // 重複を除去（同じ名前のスタッフが複数ある場合、IDが大きいものを優先）
      if (data && data.length > 0) {
        const uniqueStaffs = []
        const nameMap = new Map()
        
        // IDの降順でソートして、同じ名前の場合は最初に見つかったもの（IDが大きいもの）を優先
        const sortedData = [...data].sort((a, b) => b.id - a.id)
        
        for (const staff of sortedData) {
          if (!nameMap.has(staff.name)) {
            nameMap.set(staff.name, true)
            uniqueStaffs.push(staff)
          }
        }
        
        // IDの昇順でソートし直す
        uniqueStaffs.sort((a, b) => a.id - b.id)
        
        setStaffs(uniqueStaffs)
      } else {
        setStaffs([])
      }
    } catch (err) {
      console.error('Error loading staffs:', err)
      setStaffs([])
    }
  }

  const loadDailyExpenses = async () => {
    try {
      const startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')
      const endDate = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd')

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

  const loadYearlyOpinions = async () => {
    if (!HAS_YEARLY_OPINIONS_TABLE) {
      setYearlyOpinions('')
      return
    }

    try {
      const { data, error } = await supabase
        .from('yearly_opinions')
        .select('opinion')
        .eq('year', selectedYear)
        .eq('store_id', selectedStore)
        .single()

      if (error) {
        if (!['PGRST116', 'PGRST205'].includes(error.code)) throw error
        setYearlyOpinions('')
        return
      }

      setYearlyOpinions(data?.opinion || '')
    } catch (err) {
      console.error('Error loading yearly opinions:', err)
      setYearlyOpinions('')
    }
  }

  const loadYearlyFixedExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_fixed_expenses')
        .select('*')
        .eq('year', selectedYear)

      if (error) throw error

      const next = createInitialFixedTotals()
      ;(data || []).forEach(item => {
        if (!STORES.includes(item.store_id)) return
        const fixed = next[item.store_id]
        fixed.rent += item.rent || 0
        fixed.karaoke += item.karaoke || 0
        fixed.wifi += item.wifi || 0
        fixed.oshibori += item.oshibori || 0
        fixed.pestControl += item.pest_control || 0
      })

      setFixedTotalsByStore(next)
    } catch (err) {
      console.error('Error loading yearly fixed expenses:', err)
      setFixedTotalsByStore(createInitialFixedTotals())
    }
  }

  const loadYearlyManualExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_manual_expenses')
        .select('*')
        .eq('year', selectedYear)

      if (error) throw error

      const aggregated = createInitialManualAggregates()
      const storeMaps = STORES.reduce((acc, store) => {
        acc[store] = {}
        return acc
      }, {})

      ;(data || []).forEach(item => {
        const store = item.store_id
        if (!STORES.includes(store)) return
        const key = item.name?.trim() || '未分類'
        if (!storeMaps[store][key]) {
          storeMaps[store][key] = {
            name: key,
            amount: 0,
            notes: new Set()
          }
        }
        storeMaps[store][key].amount += item.amount || 0
        if (item.note && item.note.trim()) {
          storeMaps[store][key].notes.add(item.note.trim())
        }
      })

      STORES.forEach(store => {
        const entries = storeMaps[store]
        aggregated[store] = Object.values(entries).map(entry => ({
          name: entry.name,
          amount: entry.amount,
          notes: Array.from(entry.notes).join(' / ')
        }))
      })

      setManualAggregatedByStore(aggregated)
    } catch (err) {
      console.error('Error loading yearly manual expenses:', err)
      setManualAggregatedByStore(createInitialManualAggregates())
    }
  }

  const loadYearlyStaffMemos = async () => {
    try {
      const targetStore = selectedStore === ALL_STORES_OPTION ? 'ALL' : selectedStore
      const { data, error } = await supabase
        .from('yearly_staff_memos')
        .select('staff_id, memo')
        .eq('year', selectedYear)
        .eq('store_id', targetStore)

      if (error) throw error

      const memoMap = {}
      ;(data || []).forEach(item => {
        memoMap[item.staff_id] = item.memo || ''
      })

      setSavedStaffMemos(memoMap)
    } catch (err) {
      console.error('Error loading yearly staff memos:', err)
      setSavedStaffMemos({})
    }
  }

  const summary = useMemo(() => {
    // 日報データから経費と日付を計算
    const reportTotals = (reports || []).reduce(
      (acc, report) => {
        acc.totalExpense += report.total_expense_amount || 0
        acc.uniqueDates.add(report.date)
        return acc
      },
      {
        totalExpense: 0,
        uniqueDates: new Set()
      }
    )

    // スタッフ実績から売上、クレカ決済、給与、組数、人数、シーシャ販売数を計算（これが最も正確）
    const staffTotals = (staffYearlyResults || []).reduce(
      (acc, result) => {
        acc.totalSales += result.sales_amount || 0
        acc.totalCredit += result.credit_amount || 0
        acc.totalSalary += result.base_salary || 0
        acc.totalGroups += Number(result.groups) || 0
        acc.totalCustomers += Number(result.customers) || 0
        acc.totalShisha += result.shisha_count || 0
        return acc
      },
      {
        totalSales: 0,
        totalCredit: 0,
        totalSalary: 0,
        totalGroups: 0,
        totalCustomers: 0,
        totalShisha: 0
      }
    )

    const totalBalance = staffTotals.totalSales - (reportTotals.totalExpense + staffTotals.totalSalary)

    return {
      totalSales: staffTotals.totalSales,
      totalCredit: staffTotals.totalCredit,
      totalExpense: reportTotals.totalExpense,
      totalSalary: staffTotals.totalSalary,
      totalGroups: staffTotals.totalGroups,
      totalCustomers: staffTotals.totalCustomers,
      totalShisha: staffTotals.totalShisha,
      totalBalance: totalBalance,
      daysCount: reportTotals.uniqueDates.size
    }
  }, [reports, staffYearlyResults])

  const isAllStores = selectedStore === ALL_STORES_OPTION

  const currentFixedExpenses = useMemo(() => {
    if (isAllStores) {
      return FIXED_EXPENSE_FIELDS.reduce((acc, field) => {
        acc[field.key] = STORES.reduce((sum, store) => sum + (fixedTotalsByStore[store][field.key] || 0), 0)
        return acc
      }, {})
    }
    return fixedTotalsByStore[selectedStore] || createZeroFixedExpense()
  }, [fixedTotalsByStore, isAllStores, selectedStore])

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
        (manualAggregatedByStore[store] || []).map(item => ({
          ...item,
          store
        }))
      )
    }
    return (manualAggregatedByStore[selectedStore] || []).map(item => ({
      ...item,
      store: selectedStore
    }))
  }, [isAllStores, manualAggregatedByStore, selectedStore])

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
        label: '売上合計額',
        value: (
          <div className="flex flex-col items-end text-right space-y-1">
            <ValueWithUnit
              value={summary.totalSales}
              unit="円"
              valueClassName="text-sm font-semibold text-gray-900"
              unitClassName="text-[10px] text-gray-500"
              align="right"
            />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>内クレカ決済額</span>
              <ValueWithUnit
                value={summary.totalCredit}
                unit="円"
                valueClassName="text-xs text-gray-500 font-medium"
                unitClassName="text-[10px] text-gray-400"
                align="right"
              />
            </div>
          </div>
        )
      },
      {
        label: '支出合計額',
        value: (
          <div className="flex flex-col items-end text-right space-y-1">
            <ValueWithUnit
              value={summary.totalExpense + summary.totalSalary}
              unit="円"
              valueClassName="text-sm font-semibold text-gray-900"
              unitClassName="text-[10px] text-gray-500"
              align="right"
            />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>内人件費額</span>
              <ValueWithUnit
                value={summary.totalSalary}
                unit="円"
                valueClassName="text-xs text-gray-500 font-medium"
                unitClassName="text-[10px] text-gray-400"
                align="right"
              />
            </div>
          </div>
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
  }, [summary, isAllStores, selectedStore])

  const years = useMemo(() => Array.from({ length: 7 }, (_, i) => today.getFullYear() - i), [today])

  const handleQuickSelect = (type) => {
    switch (type) {
      case 'thisYear': {
        const now = new Date()
        setSelectedYear(now.getFullYear())
        break
      }
      case 'lastYear': {
        const last = subYears(new Date(), 1)
        setSelectedYear(last.getFullYear())
        break
      }
      default:
        break
    }
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
      const memoStore = selectedStore === ALL_STORES_OPTION ? 'ALL' : selectedStore

      const { error: deleteMemoError } = await supabase
        .from('yearly_staff_memos')
        .delete()
        .eq('year', selectedYear)
        .eq('store_id', memoStore)

      if (deleteMemoError) throw deleteMemoError

      const memoPayloads = Object.entries(staffMemoInputs)
        .map(([staffId, memo]) => ({
          year: selectedYear,
          store_id: memoStore,
          staff_id: Number(staffId),
          memo: (memo || '').trim()
        }))
        .filter(item => !Number.isNaN(item.staff_id) && item.memo !== '')

      if (memoPayloads.length > 0) {
        const { error: insertMemoError } = await supabase
          .from('yearly_staff_memos')
          .insert(memoPayloads)

        if (insertMemoError) throw insertMemoError
      }

      await Promise.all([
        loadYearlyStaffMemos()
      ])

      setSaveStatus('保存完了')
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (err) {
      console.error('Error saving yearly report:', err)
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
          <h2 className="text-xl font-bold text-accent">年報</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">クイック選択</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickSelect('thisYear')}
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors text-[var(--header-bg)]"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  今年
                </button>
                <button
                  onClick={() => handleQuickSelect('lastYear')}
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors text-[var(--header-bg)]"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  昨年
                </button>
              </div>
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
            {selectedYear}年 サマリー（{isAllStores ? '全店舗' : selectedStore}）
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
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {isAllStores ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-lg">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}>
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">項目</th>
                      {STORES.map(store => (
                        <th key={`fixed-head-${store}`} className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">{store}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FIXED_EXPENSE_FIELDS.map(field => {
                      const perStore = STORES.map(store => Number(fixedTotalsByStore[store][field.key]) || 0)
                      return (
                        <tr key={`fixed-row-${field.key}`} className="border-b border-gray-200">
                          <td className="px-3 py-2 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center">{field.label}</td>
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
                    <ValueWithUnit value={currentFixedExpenses[field.key] || 0} unit="円" />
                  </div>
                </div>
              ))
            )}
          </div>

          {manualExpenseEntries.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">月報登録済み経費一覧</h4>
              <div className="bg-surface border border-default rounded-lg overflow-hidden transition-colors">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}>
                      <th
                        className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200"
                        style={{ borderTopLeftRadius: '0.5rem' }}
                      >
                        項目
                      </th>
                      {isAllStores && (
                        <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">店舗</th>
                      )}
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">金額</th>
                      <th
                        className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200"
                        style={{ borderTopRightRadius: '0.5rem' }}
                      >
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualExpenseEntries.map((expense, index) => (
                      <tr
                        key={`${expense.store}-${expense.name}-${index}`}
                        className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900 text-center border-r border-gray-200">{expense.name}</td>
                        {isAllStores && (
                          <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">{expense.store || '-'}</td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                          <ValueWithUnit value={Number(expense.amount) || 0} unit="円" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-center whitespace-pre-wrap border-r border-gray-200">
                          {expense.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
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
                        <td className="px-3 py-2 text-sm text-gray-700 text-center">{expense.notes || '-'}</td>
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
              <div>
                <div className="overflow-x-auto" style={{ position: 'relative' }}>
                  <table className="w-full min-w-[960px] border-collapse" style={{ position: 'relative' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}>
                      <th className="px-2 py-2 text-center text-sm font-semibold border-r border-yellow-200 sticky left-0 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.1)]" style={{ backgroundColor: 'var(--accent)', minWidth: '90px', maxWidth: '90px', width: '90px' }}>日付</th>
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
                      <th className="px-3 py-2 text-center text-sm font-semibold border-yellow-200 whitespace-nowrap">差引支給額</th>
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
                          <td className="px-2 py-2 text-sm text-gray-900 border-r border-gray-200 sticky left-0 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.1)] text-center" style={{ backgroundColor: index % 2 === 0 ? 'var(--surface)' : 'var(--surface-alt)', minWidth: '90px', maxWidth: '90px', width: '90px' }}>{dateLabel}</td>
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
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-yellow-200">
                            <ValueWithUnit value={creditValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={salaryValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">
                            <ValueWithUnit value={deductionValue} unit="円" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right">
                            <ValueWithUnit
                              value={paidValue}
                              unit="円"
                              showSign
                              valueClassName={paidValue >= 0 ? 'text-[#FCAF17]' : 'text-red-600'}
                              unitClassName={paidValue >= 0 ? 'text-xs text-[#FCAF17]' : 'text-xs text-red-600'}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <StaffResultsTable
        staffResults={staffYearlyResults.map(result => ({
          ...result,
          paid_salary: (result.base_salary || 0) - (result.champagne_deduction || 0),
          memo: staffMemoInputs[result.staff_id] || ''
        }))}
        staffs={staffs}
        store={isAllStores ? 'ALL' : selectedStore}
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
          style={{ backgroundColor: '#00001C' }}
        >
          <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>所感</h3>
        </div>
        <div className="p-4">
          <textarea
            value={yearlyOpinions}
            onChange={(e) => setYearlyOpinions(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="この年の所感を入力してください"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-default p-4 shadow-lg transition-colors z-50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90"
          style={{
            backgroundColor: saveStatus === '保存エラー' ? '#dc2626' : '#FCAF17',
            color: '#00001C'
          }}
        >
          {getSaveButtonLabel()}
        </button>
      </div>
    </div>
  )
}

export default YearlyReport

