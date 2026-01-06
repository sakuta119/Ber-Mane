import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import ja from 'date-fns/locale/ja'
import SalesInput from '../components/daily/SalesInput'
import SalaryInput from '../components/daily/SalaryInput'
import ExpenseInput from '../components/daily/ExpenseInput'
import DailySummary from '../components/daily/DailySummary'
import StaffResultsTable from '../components/daily/StaffResultsTable'
import { supabase } from '../lib/supabase'

const STORES = ['TEPPEN', '201', '202']

const DailyReport = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedStore, setSelectedStore] = useState(STORES[0])
  const [salesData, setSalesData] = useState({
    groups: '',
    customers: '',
    salesAmount: '',
    creditAmount: '',
    shishaCount: ''
  })
  const [salaryData, setSalaryData] = useState({
    baseSalary: '',
    champagneDeduction: ''
  })
  const [expenses, setExpenses] = useState([])
  const [savedExpensesDisplay, setSavedExpensesDisplay] = useState([])
  const [opinion, setOpinion] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [combinedMemo, setCombinedMemo] = useState('')
  const [staffs, setStaffs] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [staffInputs, setStaffInputs] = useState([]) // 複数スタッフの入力データ
  const [staffResults, setStaffResults] = useState([]) // スタッフの日次実績データ
  const [dailyReportData, setDailyReportData] = useState(null) // 日報データ（グループ数、顧客数など）

  const mapExpensesForDisplay = (items) => (
    items.map(exp => ({
      id: exp.id,
      name: exp.name?.trim() || '未分類',
      amount: exp.amount || 0,
      note: exp.note || '',
      store: exp.store_id
    }))
  )

  // スタッフデータの読み込みと初期化
  useEffect(() => {
    loadStaffs()
  }, [])

  // 日報データの読み込み
  useEffect(() => {
    loadDailyReport()
    loadStaffResults()
  }, [selectedDate, selectedStore])

  // スタッフ選択時に、そのスタッフのデータを読み込む
  useEffect(() => {
    if (selectedStaffId) {
      loadStaffData(selectedStaffId)
    }
  }, [selectedStaffId, selectedDate, selectedStore])

  const loadStaffs = async () => {
    try {
      // 初期スタッフを登録
      // スタッフ一覧を取得
      const { data, error } = await supabase
        .from('staffs')
        .select('*')
        .eq('is_active', true)
        .order('id')

      if (!error && data) {
        setStaffs(data)
        if (data.length > 0 && !selectedStaffId) {
          setSelectedStaffId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading staffs:', error)
    }
  }

  const loadDailyReport = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('date', selectedDate)
        .eq('store_id', selectedStore)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily report:', error)
        return
      }

      if (data) {
        setDailyReportData(data)
        setSalesData({
          groups: data.total_groups?.toString() || '',
          customers: data.total_customers?.toString() || '',
          salesAmount: data.total_sales_amount?.toString() || '',
          creditAmount: data.credit_amount?.toString() || '',
          shishaCount: data.total_shisha?.toString() || ''
        })
        setSalaryData({
          baseSalary: data.total_salary_amount?.toString() || '',
          champagneDeduction: ''
        })
        setCombinedMemo(data.memo || '')
        setOpinion(data.opinion || '')
      } else {
        // データが存在しない場合は、すべての入力フィールドをリセット
        setDailyReportData(null)
        setSalesData({
          groups: '',
          customers: '',
          salesAmount: '',
          creditAmount: '',
          shishaCount: ''
        })
        setSalaryData({
          baseSalary: '',
          champagneDeduction: ''
        })
        setCombinedMemo('')
        setOpinion('')
      }

      // 経費データの読み込み
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('date', selectedDate)
        .eq('store_id', selectedStore)

      if (!expenseError && expenseData) {
        setExpenses([])
        setSavedExpensesDisplay(mapExpensesForDisplay(expenseData))
      } else {
        // 経費データが存在しない場合は空配列にリセット
        setExpenses([])
        setSavedExpensesDisplay([])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadStaffResults = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_daily_results')
        .select('*')
        .eq('date', selectedDate)
        .eq('store_id', selectedStore)
        .order('staff_id')

      if (!error && data) {
        console.log('Loaded staff results:', data) // デバッグ用
        setStaffResults(data)
      } else {
        // データが存在しない場合やエラーの場合は空配列にリセット
        setStaffResults([])
        if (error) {
          console.error('Error loading staff results:', error)
        }
      }
    } catch (error) {
      console.error('Error loading staff results:', error)
      setStaffResults([])
    }
  }

  const loadStaffData = async (staffId) => {
    try {
      const { data, error } = await supabase
        .from('staff_daily_results')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', selectedDate)
        .eq('store_id', selectedStore)
        .maybeSingle()

      if (!error && data) {
        // スタッフのデータが存在する場合は、入力フィールドに反映
        setSalesData({
          groups: data.groups?.toString() || '',
          customers: data.customers?.toString() || '',
          salesAmount: data.sales_amount?.toString() || '',
          creditAmount: data.credit_amount?.toString() || '',
          shishaCount: data.shisha_count?.toString() || ''
        })
        setSalaryData({
          baseSalary: data.base_salary?.toString() || '',
          champagneDeduction: data.champagne_deduction?.toString() || ''
        })
        setCombinedMemo(data.sales_memo || data.salary_memo || '')
      } else {
        // データが存在しない場合は、入力フィールドをリセット
        setSalesData({
          groups: '',
          customers: '',
          salesAmount: '',
          creditAmount: '',
          shishaCount: ''
        })
        setSalaryData({
          baseSalary: '',
          champagneDeduction: ''
        })
        setCombinedMemo('')
      }
    } catch (error) {
      console.error('Error loading staff data:', error)
      // エラーの場合もリセット
      setSalesData({
        groups: '',
        customers: '',
        salesAmount: '',
        creditAmount: '',
        shishaCount: ''
      })
      setSalaryData({
        baseSalary: '',
        champagneDeduction: ''
      })
    }
  }

  // 自動算出値（売上の45%）
  const calculateAutoSalary = () => {
    if (selectedStore === '202') {
      return 0
    }
    const sales = parseFloat(salesData.salesAmount) || 0
    return Math.floor(sales * 0.45)
  }

  // 実際に使用する給与額（手動入力があればそれを、なければ自動算出値）
  const calculateSalary = () => {
    const manualSalary = parseFloat(salaryData.baseSalary)
    if (manualSalary && manualSalary > 0) {
      return manualSalary
    }
    return calculateAutoSalary()
  }

  const calculatePaidSalary = () => {
    // 給与額を取得（202店舗は手動入力、TEPPEN・201は売上の45%）
    const base = calculateSalary()
    // シャンパン天引額を引く
    const deduction = parseFloat(salaryData.champagneDeduction) || 0
    const afterDeduction = base - deduction
    // 末尾3桁を切り捨て（202店舗でも同じロジック）
    return Math.floor(afterDeduction / 1000) * 1000
  }

  const handleNextStaff = async () => {
    // 現在のスタッフのデータを保存
    if (selectedStaffId) {
      await handleSave()
    }
    
    // 次のスタッフを選択（現在選択されているスタッフの次、または最初のスタッフ）
    let nextStaffId = null
    if (staffs.length > 0) {
      const filteredStaffs = staffs.filter(staff => 
        !staff.store_ids || staff.store_ids.length === 0 || staff.store_ids.includes(selectedStore)
      )
      if (filteredStaffs.length > 0) {
        const currentIndex = selectedStaffId 
          ? filteredStaffs.findIndex(s => s.id === selectedStaffId)
          : -1
        const nextIndex = currentIndex >= 0 && currentIndex < filteredStaffs.length - 1 
          ? currentIndex + 1 
          : 0
        nextStaffId = filteredStaffs[nextIndex].id
      }
    }
    
    // 入力データをリセット
    setSalesData({
      groups: '',
      customers: '',
      salesAmount: '',
      creditAmount: '',
      shishaCount: ''
    })
    setSalaryData({
      baseSalary: '',
      champagneDeduction: ''
    })
    setCombinedMemo('')
    
    // 次のスタッフを選択（入力フィールドをリセットした後に設定）
    if (nextStaffId) {
      setSelectedStaffId(nextStaffId)
    } else {
      setSelectedStaffId(null)
    }
    
    // 売上入力セクションまでスクロール
    setTimeout(() => {
      const salesInputElement = document.getElementById('sales-input-section')
      if (salesInputElement) {
        salesInputElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleDeleteStaffResult = async (resultId, staffId) => {
    if (!window.confirm(`スタッフ「${staffs.find(s => s.id === staffId)?.name || `ID: ${staffId}`}」の実績データを削除しますか？`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('staff_daily_results')
        .delete()
        .eq('id', resultId)

      if (error) {
        console.error('Error deleting staff result:', error)
        alert('削除に失敗しました')
        return
      }

      // スタッフ実績データを再読み込み
      await loadStaffResults()
      setStatusMessage('スタッフ実績を削除しました')
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting staff result:', error)
      alert('削除に失敗しました')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('保存中...')

    try {
      // 経費データの保存
      const expensePromises = expenses.map(expense => {
        if (expense.id) {
          return supabase
            .from('expenses')
            .update({
              name: expense.name,
              amount: parseFloat(expense.amount) || 0,
              note: expense.note
            })
            .eq('id', expense.id)
        } else {
          return supabase
            .from('expenses')
            .insert({
              date: selectedDate,
              store_id: selectedStore,
              name: expense.name,
              amount: parseFloat(expense.amount) || 0,
              note: expense.note
            })
        }
      })

      await Promise.all(expensePromises)

      // スタッフの日次実績を保存（スタッフが選択されている AND 何か値が入力されている場合のみ）
      if (selectedStaffId) {
        const salesAmount = parseFloat(salesData.salesAmount) || 0
        const creditAmount = parseFloat(salesData.creditAmount) || 0
        const shishaCount = parseFloat(salesData.shishaCount) || 0
        const groups = parseFloat(salesData.groups) || 0
        const customers = parseFloat(salesData.customers) || 0
        const baseSalary = calculateSalary()

        // 何か値が入力されているかチェック（0も有効な値として扱う、全てが未入力の場合は保存しない）
        const hasInput = (salesData.salesAmount !== '' && salesData.salesAmount !== null && salesData.salesAmount !== undefined) ||
                        (salesData.creditAmount !== '' && salesData.creditAmount !== null && salesData.creditAmount !== undefined) ||
                        (salesData.shishaCount !== '' && salesData.shishaCount !== null && salesData.shishaCount !== undefined) ||
                        (salesData.groups !== '' && salesData.groups !== null && salesData.groups !== undefined) ||
                        (salesData.customers !== '' && salesData.customers !== null && salesData.customers !== undefined) ||
                        (salaryData.baseSalary !== '' && salaryData.baseSalary !== null && salaryData.baseSalary !== undefined) ||
                        (salaryData.champagneDeduction !== '' && salaryData.champagneDeduction !== null && salaryData.champagneDeduction !== undefined) ||
                        (combinedMemo && combinedMemo.trim().length > 0) ||
                        // 給与が自動算出されている場合（売上が入力されている場合）
                        (selectedStore !== '202' && salesAmount > 0)

        if (hasInput) {
          const deduction = parseFloat(salaryData.champagneDeduction) || 0
          const paidSalary = calculatePaidSalary()
          // 端数切捨ては給与額（シャンパン天引額を引く前）の下三桁のみ
          const fractionCut = baseSalary % 1000

          const { error: staffResultError } = await supabase
            .from('staff_daily_results')
            .upsert({
              staff_id: selectedStaffId,
              store_id: selectedStore,
              date: selectedDate,
              sales_amount: salesAmount,
              credit_amount: creditAmount,
              shisha_count: shishaCount,
              groups: groups,
              customers: customers,
              base_salary: baseSalary,
              champagne_deduction: deduction,
              paid_salary: paidSalary,
              fraction_cut: fractionCut,
              sales_memo: combinedMemo || '',
              salary_memo: combinedMemo || ''
            }, {
              onConflict: 'staff_id,store_id,date'
            })

          if (staffResultError) {
            console.error('Error saving staff daily results:', staffResultError)
            throw staffResultError
          }
        }
      }

      // スタッフ実績データを再読み込み（全スタッフの合計を計算するため）
      // 直接クエリを実行して最新データを取得
      const { data: allStaffResultsData, error: staffResultsError } = await supabase
        .from('staff_daily_results')
        .select('*')
        .eq('date', selectedDate)
        .eq('store_id', selectedStore)
        .order('staff_id')

      if (staffResultsError) {
        console.error('Error loading staff results for summary:', staffResultsError)
      }

      // 全スタッフの合計値を計算
      const allStaffResults = allStaffResultsData ? [...allStaffResultsData] : [...staffResults]
      
      // 現在入力中のスタッフのデータが既に保存済みかチェック（データが入力されている場合のみ）
      if (selectedStaffId) {
        const salesAmount = parseFloat(salesData.salesAmount) || 0
        const creditAmount = parseFloat(salesData.creditAmount) || 0
        const shishaCount = parseFloat(salesData.shishaCount) || 0
        const groups = parseFloat(salesData.groups) || 0
        const customers = parseFloat(salesData.customers) || 0
        const baseSalary = calculateSalary()

        // 何か値が入力されているかチェック（0も有効な値として扱う、全てが未入力の場合は保存しない）
        const hasInput = (salesData.salesAmount !== '' && salesData.salesAmount !== null && salesData.salesAmount !== undefined) ||
                        (salesData.creditAmount !== '' && salesData.creditAmount !== null && salesData.creditAmount !== undefined) ||
                        (salesData.shishaCount !== '' && salesData.shishaCount !== null && salesData.shishaCount !== undefined) ||
                        (salesData.groups !== '' && salesData.groups !== null && salesData.groups !== undefined) ||
                        (salesData.customers !== '' && salesData.customers !== null && salesData.customers !== undefined) ||
                        (salaryData.baseSalary !== '' && salaryData.baseSalary !== null && salaryData.baseSalary !== undefined) ||
                        (salaryData.champagneDeduction !== '' && salaryData.champagneDeduction !== null && salaryData.champagneDeduction !== undefined) ||
                        (combinedMemo && combinedMemo.trim().length > 0) ||
                        // 給与が自動算出されている場合（売上が入力されている場合）
                        (selectedStore !== '202' && salesAmount > 0)

        if (hasInput) {
          const currentStaffResult = allStaffResults.find(r => r.staff_id === selectedStaffId)
          if (!currentStaffResult) {
            // まだ保存されていない場合は、現在の入力値を含める
            allStaffResults.push({
              staff_id: selectedStaffId,
              sales_amount: salesAmount,
              credit_amount: creditAmount,
              shisha_count: shishaCount,
              groups: groups,
              customers: customers,
              base_salary: baseSalary,
              champagne_deduction: parseFloat(salaryData.champagneDeduction) || 0
            })
          } else {
            // 既に保存済みの場合は、現在の入力値で更新
            const index = allStaffResults.findIndex(r => r.staff_id === selectedStaffId)
            if (index >= 0) {
              allStaffResults[index] = {
                ...allStaffResults[index],
                sales_amount: salesAmount,
                credit_amount: creditAmount,
                shisha_count: shishaCount,
                groups: groups,
                customers: customers,
                base_salary: baseSalary,
                champagne_deduction: parseFloat(salaryData.champagneDeduction) || 0
              }
            }
          }
        }
      }

      // 全スタッフの合計を計算
      const totalSales = allStaffResults.reduce((sum, result) => sum + (result.sales_amount || 0), 0)
      const totalCredit = allStaffResults.reduce((sum, result) => sum + (result.credit_amount || 0), 0)
      const totalSalary = allStaffResults.reduce((sum, result) => sum + (result.base_salary || 0), 0)
      const totalGroups = allStaffResults.reduce((sum, result) => sum + (Number(result.groups) || 0), 0)
      const totalCustomers = allStaffResults.reduce((sum, result) => sum + (Number(result.customers) || 0), 0)
      const totalShisha = allStaffResults.reduce((sum, result) => sum + (result.shisha_count || 0), 0)
      const totalExpense = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
      const savedExpenseTotal = savedExpensesDisplay.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
      const totalExpenseAmount = totalExpense + savedExpenseTotal

      // 日報データの保存（全スタッフの合計値を保存）
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .upsert({
          date: selectedDate,
          store_id: selectedStore,
          total_sales_amount: totalSales,
          credit_amount: totalCredit,
          total_groups: totalGroups,
          total_customers: totalCustomers,
          total_shisha: totalShisha,
          total_salary_amount: totalSalary,
          total_expense_amount: totalExpenseAmount,
          memo: combinedMemo,
          opinion: opinion
        }, {
          onConflict: 'date,store_id'
        })
        .select()
        .maybeSingle()

      if (reportError) {
        console.error('Error saving daily report:', reportError)
        console.error('Save data:', {
          date: selectedDate,
          store_id: selectedStore,
          total_sales_amount: totalSales,
          credit_amount: totalCredit,
          total_groups: totalGroups,
          total_customers: totalCustomers,
          total_shisha: totalShisha,
          total_salary_amount: totalSalary,
          total_expense_amount: totalExpenseAmount
        })
        throw reportError
      }

      if (reportData) {
        console.log('Daily report saved successfully:', reportData)
      } else {
        console.warn('Daily report save returned no data')
      }

      setSaveStatus('保存完了')
      setTimeout(() => setSaveStatus(''), 2000)
      
      // スタッフ実績データを再読み込み（表示を更新するため）
      await loadStaffResults()
      
      // スタッフが選択されていない場合、次のスタッフを自動選択
      if (!selectedStaffId && staffs.length > 0) {
        const filteredStaffs = staffs.filter(staff => 
          !staff.store_ids || staff.store_ids.length === 0 || staff.store_ids.includes(selectedStore)
        )
        if (filteredStaffs.length > 0) {
          setSelectedStaffId(filteredStaffs[0].id)
        }
      }
    } catch (error) {
      console.error('Error saving daily report:', error)
      setSaveStatus('保存エラー')
      setTimeout(() => setSaveStatus(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditSavedExpense = (savedExpense) => {
    if (!savedExpense || !savedExpense.id) return

    setSavedExpensesDisplay((prev) => prev.filter((exp) => exp.id !== savedExpense.id))
    setExpenses((prev) => {
      const exists = prev.some((exp) => exp.id === savedExpense.id)
      if (exists) return prev
      return [
        ...prev,
        {
          id: savedExpense.id,
          name: savedExpense.name,
          amount: savedExpense.amount?.toString() || '',
          note: savedExpense.note || ''
        }
      ]
    })

    setTimeout(() => {
      const element = document.getElementById(`expense-amount-${savedExpense.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }, 0)
  }

  // サマリーデータを計算（保存済みの全スタッフデータから合計を計算）
  const summaryData = useMemo(() => {
    // スタッフ実績から合計を計算
    const totalSales = staffResults.reduce((sum, result) => sum + (result.sales_amount || 0), 0)
    const totalCredit = staffResults.reduce((sum, result) => sum + (result.credit_amount || 0), 0)
    const totalSalary = staffResults.reduce((sum, result) => sum + (result.base_salary || 0), 0)
    const totalGroups = staffResults.reduce((sum, result) => sum + (result.groups || 0), 0)
    const totalCustomers = staffResults.reduce((sum, result) => sum + (result.customers || 0), 0)
    const editingExpenseTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    const savedExpenseTotal = savedExpensesDisplay.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    const totalExpense = editingExpenseTotal + savedExpenseTotal
    
    // 現在入力中のデータも含める（まだ保存されていない場合）
    const currentSales = parseFloat(salesData.salesAmount) || 0
    const currentCredit = parseFloat(salesData.creditAmount) || 0
    const currentSalary = calculateSalary()
    const currentGroups = parseFloat(salesData.groups) || 0
    const currentCustomers = parseFloat(salesData.customers) || 0
    
    // 現在入力中のスタッフのデータが既に保存されているかチェック
    const currentStaffResult = staffResults.find(r => r.staff_id === selectedStaffId)
    const finalTotalSales = currentStaffResult 
      ? totalSales 
      : totalSales + currentSales
    const finalTotalCredit = currentStaffResult 
      ? totalCredit 
      : totalCredit + currentCredit
    const finalTotalSalary = currentStaffResult 
      ? totalSalary 
      : totalSalary + currentSalary
    const finalTotalGroups = currentStaffResult 
      ? totalGroups 
      : totalGroups + currentGroups
    const finalTotalCustomers = currentStaffResult 
      ? totalCustomers 
      : totalCustomers + currentCustomers
    
    const balance = finalTotalSales - (totalExpense + finalTotalSalary)
    
    return {
      date: selectedDate,
      totalSales: finalTotalSales,
      creditAmount: finalTotalCredit,
      totalExpense: totalExpense,
      totalSalary: finalTotalSalary,
      totalGroups: finalTotalGroups,
      totalCustomers: finalTotalCustomers,
      balance: balance
    }
  }, [
    staffResults,
    expenses,
    savedExpensesDisplay,
    salesData,
    selectedStaffId,
    selectedDate,
    selectedStore,
    salaryData
  ])

  return (
    <div className="space-y-6 text-primary">
      <div className="bg-surface rounded-lg shadow border border-default transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3 rounded-t-lg"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h2 className="text-xl font-bold text-accent">日報</h2>
        </div>
        <div className="p-4">
 
        {/* 日付・店舗選択 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付
            </label>
            <div className="relative">
              <input
                type="date"
                id="date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
              <div className="flex items-center">
                <div
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-surface cursor-pointer hover:border-bar-accent transition-colors"
                  onClick={() => {
                    const dateInput = document.getElementById('date-input')
                    if (dateInput) {
                      dateInput.showPicker?.() || dateInput.click()
                    }
                  }}
                >
                  {(() => {
                    const dateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()
                    const dateStr = format(dateObj, 'yyyy/M/d', { locale: ja })
                    const dayOfWeek = format(dateObj, 'EEE', { locale: ja })
                    return `${dateStr}(${dayOfWeek})`
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const dateInput = document.getElementById('date-input')
                    if (dateInput) {
                      dateInput.showPicker?.() || dateInput.click()
                    }
                  }}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-[#FCAF17] hover:bg-[#ffcc5c] transition-colors cursor-pointer flex items-center justify-center"
                  style={{ borderLeft: 'none' }}
                  title="カレンダーを開く"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1F2937"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <rect x="3.75" y="4.5" width="16.5" height="16.5" rx="2.25" />
                    <path d="M8 3v3" />
                    <path d="M16 3v3" />
                    <path d="M3.75 9.75h16.5" />
                    <path d="M9.75 13.5h4.5" />
                    <path d="M9 17.25h6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              店舗
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            >
              {STORES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>
        </div>
        </div>
      </div>

      {/* 売上入力 */}
      <div id="sales-input-section">
      <SalesInput
        data={salesData}
        onChange={setSalesData}
        store={selectedStore}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onStaffChange={setSelectedStaffId}
      />
      </div>

      {/* 給与入力 */}
      <SalaryInput
        data={salaryData}
        onChange={setSalaryData}
        store={selectedStore}
        salesAmount={parseFloat(salesData.salesAmount) || 0}
        calculatedSalary={calculateAutoSalary()}
        paidSalary={calculatePaidSalary()}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onStaffChange={setSelectedStaffId}
        onNextStaff={handleNextStaff}
        memoValue={combinedMemo}
        onMemoChange={setCombinedMemo}
      />

      {/* 経費入力 */}
      <ExpenseInput
        expenses={expenses}
        onChange={setExpenses}
        onSave={async () => {
          try {
            const totalExpense = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
            
            // 経費データの保存
            const expensePromises = expenses.map(expense => {
              if (expense.id) {
                return supabase
                  .from('expenses')
                  .update({
                    name: expense.name,
                    amount: parseFloat(expense.amount) || 0,
                    note: expense.note
                  })
                  .eq('id', expense.id)
              } else {
                return supabase
                  .from('expenses')
                  .insert({
                    date: selectedDate,
                    store_id: selectedStore,
                    name: expense.name,
                    amount: parseFloat(expense.amount) || 0,
                    note: expense.note
                  })
              }
            })

            await Promise.all(expensePromises)

            // 日報データの経費合計を更新
            const { data: reportData } = await supabase
              .from('daily_reports')
              .select('*')
              .eq('date', selectedDate)
              .eq('store_id', selectedStore)
              .maybeSingle()

            if (reportData) {
              await supabase
                .from('daily_reports')
                .update({
                  total_expense_amount: totalExpense
                })
                .eq('id', reportData.id)
            }

            // 経費データを再読み込み
            const { data: expenseData, error: expenseError } = await supabase
              .from('expenses')
              .select('*')
              .eq('date', selectedDate)
              .eq('store_id', selectedStore)

            if (!expenseError && expenseData) {
              setExpenses([])
              setSavedExpensesDisplay(mapExpensesForDisplay(expenseData))
            } else {
              setExpenses([])
              setSavedExpensesDisplay([])
            }

            return true
          } catch (error) {
            console.error('Error saving expenses:', error)
            setStatusMessage('経費の登録エラー')
            setTimeout(() => setStatusMessage(''), 3000)
            return false
          }
        }}
        savedExpenses={savedExpensesDisplay}
        isAllStores={false}
        onEditSavedExpense={handleEditSavedExpense}
      />

      {/* 所感入力 */}
      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: '#00001C' }}
        >
          <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>所感</h3>
        </div>
        <div className="p-4">
          <textarea
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            onBlur={handleSave}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="オーナーコメントを入力..."
          />
        </div>
      </div>

      {/* サマリー表示 */}
      <DailySummary data={summaryData} />

      {/* スタッフ実績テーブル */}
      <StaffResultsTable
        staffResults={staffResults}
        staffs={staffs}
        store={selectedStore}
        onDelete={handleDeleteStaffResult}
      />

      {/* 保存ボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-default p-4 shadow-lg transition-colors">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90"
          style={{
            backgroundColor: saveStatus === '保存エラー' ? '#dc2626' : '#FCAF17',
            color: '#00001C'
          }}
        >
          {isSaving ? '保存中...' : (saveStatus || '保存')}
        </button>
        {statusMessage && (
          <p className="text-center text-sm mt-2 text-gray-600">{statusMessage}</p>
        )}
      </div>
    </div>
  )
}

export default DailyReport

