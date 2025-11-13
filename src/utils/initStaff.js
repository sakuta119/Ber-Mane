import { supabase } from '../lib/supabase'

// 初期スタッフデータの登録
export const initStaff = async () => {
  try {
    // 既存のスタッフを確認（かんなという名前で）
    const { data: existingStaff, error: checkError } = await supabase
      .from('staffs')
      .select('*')
      .eq('name', 'かんな')
      .eq('is_active', true)
      .limit(1)
      .single()

    // 既に存在する場合は登録しない
    if (existingStaff && !checkError) {
      console.log('Staff already exists:', existingStaff)
      return existingStaff
    }

    // スタッフを登録（IDは自動採番されるため指定しない）
    const { data, error } = await supabase
      .from('staffs')
      .insert({
        name: 'かんな',
        store_ids: ['TEPPEN', '201', '202'],
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error initializing staff:', error)
      return null
    }

    console.log('Staff initialized:', data)
    return data
  } catch (error) {
    console.error('Error in initStaff:', error)
    return null
  }
}

