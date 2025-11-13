const SalesInput = ({ data, onChange, store, staffs, selectedStaffId, onStaffChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    })
  }

  return (
    <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#00001C' }}
      >
        <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>売上</h3>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            組数
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={data.groups}
            onChange={(e) => handleChange('groups', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            人数
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={data.customers}
            onChange={(e) => handleChange('customers', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="0"
          />
        </div>

        {store !== 'TEPPEN' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              シーシャ販売数
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={data.shishaCount}
              onChange={(e) => handleChange('shishaCount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
              placeholder="0"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            売上金額
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={data.salesAmount}
            onChange={(e) => handleChange('salesAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            内クレカ決済
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={data.creditAmount}
            onChange={(e) => handleChange('creditAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bar-accent"
            placeholder="0"
          />
        </div>

      </div>
    </div>
  )
}

export default SalesInput

