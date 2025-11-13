import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import ja from 'date-fns/locale/ja'
import { supabase } from '../lib/supabase'
import ValueWithUnit from '../components/common/ValueWithUnit'

const STORES = ['TEPPEN', '201', '202']

const StaffPerformance = () => {
  const [staffs, setStaffs] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [selectedStore, setSelectedStore] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [performanceData, setPerformanceData] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadStaffs()
  }, [])

  useEffect(() => {
    if (selectedStaffId) {
      loadPerformanceData()
    }
  }, [selectedStaffId, selectedStore, selectedYear, selectedMonth])

  const loadStaffs = async () => {
    try {
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

  const loadPerformanceData = async () => {
    if (!selectedStaffId) return

    setIsLoading(true)
    try {
      const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'yyyy-MM-dd')

      let query = supabase
        .from('staff_daily_results')
        .select('*')
        .eq('staff_id', selectedStaffId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (selectedStore) {
        query = query.eq('store_id', selectedStore)
      }

      const { data, error } = await query

      if (!error && data) {
        setPerformanceData(data)
        
        // サマリーを計算
        const uniqueDates = new Set(data.map(d => d.date)).size
        const totalGroups = data.reduce((sum, d) => sum + (d.groups || 0), 0)
        const totalCustomers = data.reduce((sum, d) => sum + (d.customers || 0), 0)
        const totalSales = data.reduce((sum, d) => sum + (d.sales_amount || 0), 0)
        const totalCredit = data.reduce((sum, d) => sum + (d.credit_amount || 0), 0)
        const totalShisha = data.reduce((sum, d) => sum + (d.shisha_count || 0), 0)
        const totalBaseSalary = data.reduce((sum, d) => sum + (d.base_salary || 0), 0)
        const totalChampagneDeduction = data.reduce((sum, d) => sum + (d.champagne_deduction || 0), 0)
        const totalFractionCut = data.reduce((sum, d) => sum + (d.fraction_cut || 0), 0)
        const totalPaidSalary = data.reduce((sum, d) => sum + (d.paid_salary || 0), 0)
        const dailyPaid = uniqueDates > 0 ? Math.floor(totalPaidSalary / uniqueDates) : 0

        const summaryData = {
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
        setSummary(summaryData)
      } else {
        setPerformanceData([])
        setSummary(null)
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
      setPerformanceData([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getStaffName = (staffId) => {
    const staff = staffs.find(s => s.id === staffId)
    return staff ? staff.name : `ID: ${staffId}`
  }

  const handleQuickMonth = (type) => {
    const today = new Date()
    switch (type) {
      case 'thisMonth':
        setSelectedYear(today.getFullYear())
        setSelectedMonth(today.getMonth() + 1)
        break
      case 'lastMonth':
        const lastMonth = subMonths(today, 1)
        setSelectedYear(lastMonth.getFullYear())
        setSelectedMonth(lastMonth.getMonth() + 1)
        break
      default:
        break
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const SummaryItem = ({ label, value, highlight = false, colSpan = 1 }) => (
     <div
      className={`flex justify-between items-center px-3 py-2 rounded-md border ${
        colSpan === 2 ? 'col-span-2' : ''
      } ${highlight ? 'shadow-md' : ''}`}
      style={{
        backgroundColor: highlight ? 'var(--surface-highlight)' : 'var(--surface)',
        borderColor: highlight ? 'var(--border-highlight)' : 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? '' : 'text-gray-900'}`}
        style={highlight ? { color: '#FCAF17' } : {}}
      >
        {value}
      </span>
    </div>
  )

  const showShishaSummary = !selectedStore || selectedStore !== 'TEPPEN'

  return (
    <div className="space-y-6 text-primary">
      <div className="bg-surface rounded-lg shadow border border-default transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3 rounded-t-lg"
          style={{ backgroundColor: '#00001C' }}
        >
          <h2 className="text-xl font-bold" style={{ color: '#FCAF17' }}>個人成績</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* スタッフ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              スタッフ
            </label>
            <select
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            >
              <option value="">選択してください</option>
              {staffs.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          {/* 店舗選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              店舗（全店舗の場合は空欄）
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            >
              <option value="">全店舗</option>
              {STORES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          {/* 年月選択 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                月
              </label>
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

          {/* クイック選択ボタン */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              クイック選択
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickMonth('thisMonth')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                style={{ backgroundColor: '#FCAF17', color: '#00001C' }}
              >
                今月
              </button>
              <button
                onClick={() => handleQuickMonth('lastMonth')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                style={{ backgroundColor: '#FCAF17', color: '#00001C' }}
              >
                先月
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* サマリー表示 */}
      {summary && selectedStaffId && (
        <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: '#00001C' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>
              {getStaffName(selectedStaffId)} の成績サマリー（{selectedYear}年{selectedMonth}月）
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <SummaryItem
              label="合計組数人数"
              value={
                <span className="inline-flex items-baseline justify-end gap-3">
                  <ValueWithUnit value={summary.totalGroups} unit="組" align="center" />
                  <ValueWithUnit value={summary.totalCustomers} unit="人" align="center" />
                </span>
              }
            />
            <SummaryItem
              label="シーシャ販売数"
              value={showShishaSummary ? <ValueWithUnit value={summary.totalShisha} unit="本" /> : '-'}
            />
            <SummaryItem
              label="出勤日数"
              value={<ValueWithUnit value={summary.workDays} unit="日" />}
            />
            <SummaryItem
              label="合計売上額"
              value={
                <span className="inline-flex items-baseline justify-end gap-2 text-right">
                  <ValueWithUnit value={summary.totalSales} unit="円" />
                  <span className="text-xs text-gray-600">
                    （内クレカ決済{summary.totalCredit.toLocaleString()}円）
                  </span>
                </span>
              }
            />
            <SummaryItem
              label="日給額"
              value={<ValueWithUnit value={summary.dailyPaid} unit="円" />}
            />
            <SummaryItem
              label="給与端数支給額"
              value={<ValueWithUnit value={summary.totalFractionCut} unit="円" />}
            />
            <SummaryItem
              label="シャンパン合計天引額"
              value={<ValueWithUnit value={summary.totalChampagneDeduction} unit="円" />}
            />
            <SummaryItem
              label="合計給与額"
              value={<ValueWithUnit value={summary.totalBaseSalary} unit="円" />}
            />
          </div>
        </div>
      )}

      {/* 詳細データテーブル */}
      {selectedStaffId && (
        <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: '#00001C' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>詳細データ</h3>
          </div>
          <div className="p-4">
            {isLoading ? (
            <p className="text-center text-gray-500 py-4">読み込み中...</p>
          ) : performanceData.length === 0 ? (
            <p className="text-center text-gray-500 py-4">データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse overflow-hidden rounded-lg">
                <thead>
                  <tr style={{ backgroundColor: '#FCAF17', color: '#00001C' }}>
                    <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">
                      日付
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">
                      店舗
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">組数</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">人数</th>
                    {selectedStore !== 'TEPPEN' && (
                      <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">
                        <div className="flex flex-col items-center text-xs font-semibold leading-tight">
                          <span>シーシャ</span>
                          <span>販売数</span>
                        </div>
                      </th>
                    )}
                    <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">売上額</th>
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
                    <th className="px-3 py-2 text-center text-sm font-semibold border-yellow-200 whitespace-nowrap">端数切捨額</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold border-yellow-200 whitespace-nowrap">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((data, index) => {
                    const paidAmount = data.paid_salary ?? ((data.base_salary || 0) - (data.champagne_deduction || 0))
                    return (
                      <tr
                        key={data.id || index}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900 text-center border-r border-gray-200">
                          {format(new Date(data.date + 'T00:00:00'), 'M/d(E)', { locale: ja })}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-center border-r border-gray-200">
                          {data.store_id}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.groups || 0} unit="組" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.customers || 0} unit="人" />
                        </td>
                        {selectedStore !== 'TEPPEN' && (
                          <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                            <ValueWithUnit value={data.shisha_count || 0} unit="本" />
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.sales_amount || 0} unit="円" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.credit_amount || 0} unit="円" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.base_salary || 0} unit="円" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.champagne_deduction || 0} unit="円" />
                        </td>
                        <td
                          className="px-3 py-2 text-sm text-right font-semibold border-r border-gray-200 whitespace-nowrap"
                          style={{ color: paidAmount >= 0 ? '#FCAF17' : '#dc2626' }}
                        >
                          <ValueWithUnit
                            value={paidAmount}
                            unit="円"
                            showSign
                            valueClassName={paidAmount >= 0 ? 'text-[#FCAF17]' : 'text-red-600'}
                            unitClassName={paidAmount >= 0 ? 'text-xs text-[#FCAF17]' : 'text-xs text-red-600'}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                          <ValueWithUnit value={data.fraction_cut || 0} unit="円" />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-center border-gray-200 whitespace-pre-wrap">
                          {data.sales_memo || data.salary_memo || data.memo || '-'}
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
    </div>
  )
}

export default StaffPerformance
