import ValueWithUnit from '../common/ValueWithUnit'

const StaffResultsTable = ({
  staffResults,
  staffs,
  store,
  allowMemoInput = false,
  memoValues = {},
  onMemoChange = () => {},
  onDelete = null
}) => {
  const getStaffName = (staffId) => {
    const staff = staffs.find((s) => s.id === staffId)
    return staff ? staff.name : `ID: ${staffId}`
  }

  if (!staffResults || staffResults.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#00001C' }}>
          <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>スタッフ実績</h3>
        </div>
        <div className="p-4">
          <p className="text-center text-gray-500 py-4">データがありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#00001C' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>スタッフ実績</h3>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse overflow-hidden rounded-lg">
          <thead>
            <tr style={{ backgroundColor: '#FCAF17', color: '#00001C' }}>
              <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">スタッフ名</th>
              <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">組数</th>
              <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">人数</th>
              {store !== 'TEPPEN' && (
                <th className="px-3 py-2 text-center border-r border-yellow-200 whitespace-nowrap">
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
              <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200 whitespace-nowrap">備考</th>
              {onDelete && (
                <th className="px-3 py-2 text-center text-sm font-semibold border-yellow-200 whitespace-nowrap">操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {staffResults.map((result, index) => (
              <tr
                key={result.id || index}
                className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}
              >
                <td className="px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-200">
                  <span className="block text-center">{getStaffName(result.staff_id)}</span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                  <ValueWithUnit value={result.groups ?? 0} unit="組" />
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                  <ValueWithUnit value={result.customers ?? 0} unit="人" />
                </td>
                {store !== 'TEPPEN' && (
                  <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                    <ValueWithUnit value={result.shisha_count || 0} unit="本" />
                  </td>
                )}
                <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                  <ValueWithUnit value={result.sales_amount || 0} unit="円" />
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                  <ValueWithUnit value={result.credit_amount || 0} unit="円" />
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                  <ValueWithUnit value={result.base_salary || 0} unit="円" />
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200 whitespace-nowrap">
                  <ValueWithUnit value={result.champagne_deduction || 0} unit="円" />
                </td>
                <td
                  className="px-3 py-2 text-sm font-medium text-right border-r border-gray-200 whitespace-nowrap"
                >
                  <ValueWithUnit
                    value={result.paid_salary || 0}
                    unit="円"
                    valueClassName={(result.paid_salary || 0) < 0 ? 'text-red-600' : 'text-[#FCAF17]'}
                  />
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 text-center whitespace-pre-wrap min-w-[220px] border-r border-gray-200">
                  {allowMemoInput ? (
                    <textarea
                      value={memoValues[result.staff_id] || ''}
                      onChange={(e) => onMemoChange(result.staff_id, e.target.value)}
                      rows={2}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bar-accent"
                      placeholder="備考を入力..."
                    />
                  ) : (
                    result.sales_memo || result.salary_memo || '-'
                  )}
                </td>
                {onDelete && (
                  <td className="px-3 py-2 text-center border-gray-200">
                    <button
                      onClick={() => onDelete(result.id, result.staff_id)}
                      className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                      title="このスタッフの実績データを削除"
                    >
                      削除
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StaffResultsTable

