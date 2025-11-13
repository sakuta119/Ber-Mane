import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STORES = ['TEPPEN', '201', '202']

const StaffRegistration = () => {
  const [staffs, setStaffs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    store_ids: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [loadingDots, setLoadingDots] = useState(0)

  useEffect(() => {
    loadStaffs()
  }, [])

  const loadStaffs = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('staffs')
        .select('*')
        .eq('is_active', true)
        .order('id')

      if (!error && data) {
        setStaffs(data)
      }
    } catch (error) {
      console.error('Error loading staffs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStoreToggle = (storeId) => {
    setFormData(prev => {
      const currentStores = prev.store_ids || []
      const newStores = currentStores.includes(storeId)
        ? currentStores.filter(id => id !== storeId)
        : [...currentStores, storeId]
      return {
        ...prev,
        store_ids: newStores
      }
    })
  }

  const handleEdit = (staff) => {
    setEditingId(staff.id)
    setFormData({
      id: staff.id?.toString() || '',
      name: staff.name || '',
      store_ids: staff.store_ids || []
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      id: '',
      name: '',
      store_ids: []
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSaveStatus('名前は必須です')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    setIsSaving(true)
    setSaveStatus('')
    setLoadingDots(0)
    
    // ローディングアニメーション開始
    const dotInterval = setInterval(() => {
      setLoadingDots(prev => (prev + 1) % 4)
    }, 500)

    try {
      const staffData = {
        name: formData.name.trim(),
        store_ids: formData.store_ids.length > 0 ? formData.store_ids : [],
        is_active: true
      }

      if (editingId) {
        // 更新（ID変更の場合は削除して再作成）
        if (formData.id && parseInt(formData.id) !== editingId) {
          const newId = parseInt(formData.id)
          
          // 新しいIDが既に存在するか確認
          const { data: existingStaff } = await supabase
            .from('staffs')
            .select('id')
            .eq('id', newId)
            .single()
          
          if (existingStaff) {
            throw new Error(`ID ${newId} は既に使用されています`)
          }
          
          // 古いIDのデータを削除
          const { error: deleteError } = await supabase
            .from('staffs')
            .delete()
            .eq('id', editingId)
          
          if (deleteError) throw deleteError
          
          // 新しいIDでデータを挿入
          const { data, error } = await supabase
            .from('staffs')
            .insert({
              id: newId,
              ...staffData
            })
            .select()
          
          if (error) {
            console.error('Update error:', error)
            throw new Error(`更新エラー: ${error.message}`)
          }
        } else {
          // ID変更なしの通常更新
          const { data, error } = await supabase
            .from('staffs')
            .update(staffData)
            .eq('id', editingId)
            .select()

          if (error) {
            console.error('Update error:', error)
            throw new Error(`更新エラー: ${error.message}`)
          }
        }
      } else {
        // 新規登録
        console.log('Inserting staff data:', staffData)
        const { data, error } = await supabase
          .from('staffs')
          .insert(staffData)
          .select()

        if (error) {
          console.error('Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(`登録エラー: ${error.message || 'データの保存に失敗しました'}`)
        }
        
        if (!data || data.length === 0) {
          throw new Error('登録エラー: データが返されませんでした')
        }
        
        console.log('Staff inserted successfully:', data)
      }

      // スタッフ一覧を再読み込み
      await loadStaffs()
      
      // フォームをリセット
      handleCancel()
    } catch (error) {
      console.error('Error saving staff:', error)
      let errorMessage = '保存エラーが発生しました'
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'ネットワークエラー: Supabaseへの接続に失敗しました。.envファイルの設定を確認してください。'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSaveStatus(errorMessage)
      setTimeout(() => setSaveStatus(''), 5000)
    } finally {
      clearInterval(dotInterval)
      setIsSaving(false)
      setLoadingDots(0)
    }
  }

  const handleDelete = async (staffId) => {
    if (!confirm('この従業員を削除しますか？')) {
      return
    }

    try {
      // 論理削除
      const { error } = await supabase
        .from('staffs')
        .update({ is_active: false })
        .eq('id', staffId)

      if (error) throw error

      // スタッフ一覧を再読み込み
      await loadStaffs()
    } catch (error) {
      console.error('Error deleting staff:', error)
      setSaveStatus('削除エラー')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  return (
    <div className="space-y-6 text-primary">
      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          <h2 className="text-xl font-bold text-accent">従業員登録</h2>
        </div>

        <div className="space-y-4 p-4">
          {editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bar-accent"
                placeholder="IDを入力"
              />
              <p className="text-xs text-gray-500 mt-1">
                編集時のみIDを変更できます。既存のIDと重複しないようにしてください。
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bar-accent"
              placeholder="従業員名を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属店舗
            </label>
            <div className="grid grid-cols-3 gap-3">
              {STORES.map(store => {
                const isSelected = formData.store_ids.includes(store)
                return (
                  <button
                    key={store}
                    type="button"
                    onClick={() => handleStoreToggle(store)}
                    className={`py-3 px-4 rounded-lg text-base font-medium transition-all border ${
                      isSelected ? 'shadow-md transform scale-105 border-[var(--accent)]' : 'border-default hover:border-[var(--accent)]'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }
                        : { backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }
                    }
                  >
                    {store}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 rounded-lg text-base font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors shadow-md"
              style={{ backgroundColor: '#FCAF17', color: '#00001C' }}
            >
              {isSaving ? (
                <span>
                  登録中{'.'.repeat(loadingDots)}
                </span>
              ) : (
                editingId ? '更新' : '登録'
              )}
            </button>
            {editingId && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-4 bg-gray-300 text-gray-700 rounded-lg text-base font-medium hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
            )}
          </div>

          {saveStatus && (
            <div className={`text-center text-sm p-3 rounded-lg ${
              saveStatus.includes('エラー') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <p style={{ color: saveStatus.includes('エラー') ? '#ef4444' : '#00001C' }}>
                {saveStatus}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 従業員一覧 */}
      <div className="bg-surface rounded-lg shadow border border-default overflow-hidden transition-colors">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: '#00001C' }}
        >
          <h3 className="text-lg font-semibold" style={{ color: '#FCAF17' }}>従業員一覧</h3>
        </div>

        <div className="p-4">
          {isLoading ? (
          <p className="text-center text-gray-500 py-4">読み込み中...</p>
        ) : staffs.length === 0 ? (
          <p className="text-center text-gray-500 py-4">登録されている従業員はいません</p>
        ) : (
          <div className="space-y-3">
            {staffs.map(staff => (
              <div
                key={staff.id}
                className="p-5 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-base text-gray-900">ID: {staff.id}</span>
                      <span className="font-bold text-lg text-gray-900">{staff.name}</span>
                    </div>
                    <div className="text-base text-gray-600">
                      {staff.store_ids && staff.store_ids.length > 0 && (
                        <div className="font-medium">所属店舗: {staff.store_ids.join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => handleEdit(staff)}
                      className="px-5 py-3 bg-blue-500 text-white rounded-lg text-base font-medium hover:bg-blue-600 transition-colors shadow-md"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id)}
                      className="px-5 py-3 bg-red-500 text-white rounded-lg text-base font-medium hover:bg-red-600 transition-colors shadow-md"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default StaffRegistration

