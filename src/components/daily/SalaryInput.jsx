import ValueWithUnit from '../common/ValueWithUnit'

const SalaryInput = ({ data, onChange, store, salesAmount, calculatedSalary, paidSalary, staffs, selectedStaffId, onStaffChange, onNextStaff, memoValue, onMemoChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    })
  }

  // 端数切捨ては給与額（シャンパン天引額を引く前）の下三桁のみ
  const fractionCut = calculatedSalary % 1000

  return (
    <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#00001C' }}
      >
        <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>給与</h3>
      </div>
      
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            スタッフ
          </label>
          <select
            value={selectedStaffId || ''}
            onChange={(e) => onStaffChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
          >
            <option value="">選択してください</option>
            {staffs
              .filter(staff => !staff.store_ids || staff.store_ids.length === 0 || staff.store_ids.includes(store))
              .map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
          </select>
        </div>
        {store === '202' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              給与額（手動入力）
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={data.baseSalary}
              onChange={(e) => handleChange('baseSalary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
              placeholder="0"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              給与額（自動算出：売上の45%）
            </label>
            <div className="px-3 py-2 bg-surface-alt border border-default rounded-md transition-colors">
              <ValueWithUnit value={calculatedSalary} unit="円" />
            </div>
            <p className="text-xs text-muted mt-1">
              売上: {salesAmount.toLocaleString()}円 × 45%
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            シャンパン天引額
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={data.champagneDeduction}
            onChange={(e) => handleChange('champagneDeduction', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="0"
          />
        </div>

        <div className="p-3 rounded-md border transition-colors" style={{ backgroundColor: 'var(--surface-highlight)', borderColor: 'var(--border-highlight)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">差引支給額</span>
            <ValueWithUnit
              value={paidSalary}
              unit="円"
              valueClassName="text-lg font-bold text-[#FCAF17]"
              unitClassName="text-xs text-[#FCAF17]"
              showSign
            />
          </div>
          {fractionCut > 0 && (
            <p className="text-xs text-muted">
              端数切り捨て: {fractionCut.toLocaleString()}円
            </p>
          )}
        </div>

        {typeof memoValue !== 'undefined' && onMemoChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              value={memoValue}
              onChange={(e) => onMemoChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
              placeholder="備考を入力..."
            />
          </div>
        )}

        {onNextStaff && (
          <div className="pt-2">
            <button
              onClick={onNextStaff}
              className="w-full py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
              style={{ backgroundColor: '#FCAF17', color: '#00001C' }}
            >
              次のスタッフを入力
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalaryInput

