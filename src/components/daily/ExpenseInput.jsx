import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import ValueWithUnit from '../common/ValueWithUnit'

const ExpenseInput = ({
  expenses,
  onChange,
  onSave,
  savedExpenses,
  isAllStores,
  onEditSavedExpense = () => {}
}) => {
  const [expenseSuggestions, setExpenseSuggestions] = useState([])
  const [saveState, setSaveState] = useState('idle') // idle | saving | success | error

  const currentButtonLabel = useMemo(() => {
    switch (saveState) {
      case 'saving':
        return '登録中...'
      case 'success':
        return '登録完了'
      case 'error':
        return '保存エラー'
      default:
        return '経費を登録'
    }
  }, [saveState])

  useEffect(() => {
    loadExpenseSuggestions()
  }, [])

  const loadExpenseSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        const uniqueNames = [...new Set(data.map(exp => exp.name).filter(Boolean))]
        setExpenseSuggestions(uniqueNames)
      }
    } catch (error) {
      console.error('Error loading expense suggestions:', error)
    }
  }

  const handleAddExpense = () => {
    onChange([...expenses, { id: null, name: '', amount: '', note: '' }])
  }

  const handleRemoveExpense = (index) => {
    onChange(expenses.filter((_, i) => i !== index))
  }

  const handleChange = (index, field, value) => {
    const updated = [...expenses]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    onChange(updated)
  }

  return (
<div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
      <div
        className="flex justify-between items-center px-4 py-3"
        style={{ backgroundColor: 'var(--header-bg)' }}
      >
        <h3 className="text-lg font-semibold text-accent">経費</h3>
        <button
          onClick={handleAddExpense}
          className="px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}
        >
          + 追加
        </button>
      </div>

      <div className="space-y-4 p-4">
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            追加ボタンから登録してください。
          </p>
        ) : (
          expenses.map((expense, index) => {
            const fieldId = `expense-amount-${expense.id || `temp-${index}`}`
            return (
              <div key={expense.id || index} className="border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      適用
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list={`expense-suggestions-${index}`}
                        value={expense.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="経費名を入力..."
                      />
                      <datalist id={`expense-suggestions-${index}`}>
                        {expenseSuggestions.map((suggestion, i) => (
                          <option key={i} value={suggestion} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      金額
                    </label>
                    <input
                      id={fieldId}
                      type="number"
                      inputMode="numeric"
                      value={expense.amount}
                      onChange={(e) => handleChange(index, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      備考
                    </label>
                    <input
                      type="text"
                      value={expense.note}
                      onChange={(e) => handleChange(index, 'note', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="備考を入力..."
                      autoComplete="off"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveExpense(index)}
                  className="ml-3 px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          )
          })
        )}
      </div>

      {expenses.length > 0 && onSave && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={async () => {
              setSaveState('saving')
              try {
                const result = await onSave()
                if (result === false) {
                  setSaveState('error')
                  setTimeout(() => setSaveState('idle'), 3000)
                } else {
                  setSaveState('success')
                  setTimeout(() => setSaveState('idle'), 2000)
                }
              } catch (error) {
                setSaveState('error')
                setTimeout(() => setSaveState('idle'), 3000)
              }
            }}
            disabled={saveState === 'saving'}
            className="w-full py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}
          >
            {currentButtonLabel}
          </button>
        </div>
      )}
      {savedExpenses && savedExpenses.length > 0 && (
        <div className="mt-6 px-4 pb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">登録済み経費一覧</h4>
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
                  <th className="px-3 py-2 text-center text-sm font-semibold border-r border-yellow-200">備考</th>
                  <th
                    className="px-3 py-2 text-center text-sm font-semibold"
                    style={{ borderTopRightRadius: '0.5rem' }}
                  >
                    <span className="sr-only">編集</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {savedExpenses.map((expense, index) => (
                  <tr
                    key={`${expense.name}-${index}`}
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
                      {expense.note || '-'}
                    </td>
                    <td className="px-3 py-2 text-center align-middle" style={{ width: '5rem' }}>
                      <button
                        onClick={() => onEditSavedExpense(expense)}
                        className="px-3 py-1 text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseInput

