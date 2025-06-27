/**
 * 入力フィールドコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5.3.2 編集フィールド
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - TaskList: タスク編集でのインライン入力
 * - ProjectEditor: プロジェクト設定フォーム
 * - FocusMode: フォーカス設定フォーム
 * 
 * 実装要件:
 * - フォーカス時の青い枠線効果
 * - バリデーションエラー表示対応
 * - 各種input type対応（text, email, password, date等）
 */

import { forwardRef } from 'react'

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'date' | 'month' | 'number'
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
  error?: string
  label?: string
  id?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  className = '',
  error,
  label,
  id,
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
  const errorClasses = error ? 'border-red-500' : 'border-gray-300'
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        required={required}
        className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input