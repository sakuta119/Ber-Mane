import { format } from 'date-fns'
import ja from 'date-fns/locale/ja'
import ValueWithUnit from '../common/ValueWithUnit'

const DailySummary = ({ data }) => {
  // 日付を正しくパースしてフォーマット
  const dateObj = typeof data.date === 'string' ? new Date(data.date + 'T00:00:00') : new Date(data.date)
  const dateStr = format(dateObj, 'yyyy/M/d', { locale: ja })
  const dayOfWeek = format(dateObj, 'EEE', { locale: ja })
  const formattedDate = `${dateStr}(${dayOfWeek})`
  const balanceColor = data.balance >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#00001C' }}
      >
        <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>日報サマリー</h3>
      </div>
      
      <div className="space-y-3 p-4">
        <div className="py-2 border-b border-gray-200 text-left">
          <span className="text-sm font-semibold text-gray-900">{formattedDate}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">売上合計額</span>
          <ValueWithUnit value={data.totalSales} unit="円" valueClassName="text-sm font-semibold text-gray-900" />
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200 pl-4">
          <span className="text-sm text-gray-600">内クレカ決済</span>
          <ValueWithUnit value={data.creditAmount} unit="円" valueClassName="text-sm text-gray-900" />
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">支出合計額</span>
          <ValueWithUnit
            value={data.totalExpense + data.totalSalary}
            unit="円"
            valueClassName="text-sm font-semibold text-gray-900"
          />
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200 pl-4">
          <span className="text-sm text-gray-600">内人件費額</span>
          <ValueWithUnit value={data.totalSalary} unit="円" valueClassName="text-sm text-gray-900" />
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">合計組数</span>
          <span className="text-sm text-gray-900">
            <span className="inline-flex items-baseline gap-2">
              <ValueWithUnit value={data.totalGroups} unit="組" align="center" valueClassName="text-sm text-gray-900" />
              <ValueWithUnit value={data.totalCustomers} unit="人" align="center" valueClassName="text-sm text-gray-900" />
            </span>
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-700">収支額</span>
          <ValueWithUnit
            value={data.balance}
            unit="円"
            showSign
            valueClassName={`text-lg font-bold ${data.balance >= 0 ? 'text-[#FCAF17]' : 'text-red-600'}`}
            unitClassName={`text-xs ${data.balance >= 0 ? 'text-[#FCAF17]' : 'text-red-600'}`}
          />
        </div>
      </div>
    </div>
  )
}

export default DailySummary

