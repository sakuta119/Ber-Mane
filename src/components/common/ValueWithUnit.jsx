import React from 'react'

const ValueWithUnit = ({
  value,
  unit = '',
  showSign = false,
  align = 'right',
  valueClassName = '',
  unitClassName = 'text-gray-500',
  className = ''
}) => {
  const isNumber = typeof value === 'number'
  const numericValue = isNumber ? value : Number(value)
  const shouldShowSign = showSign && !Number.isNaN(numericValue) && numericValue !== 0

  const formattedValue = Number.isNaN(numericValue)
    ? (value ?? '')
    : numericValue.toLocaleString()

  const signPrefix = shouldShowSign
    ? numericValue > 0
      ? '+'
      : ''
    : ''

  const alignmentClass =
    align === 'center'
      ? 'justify-center text-center'
      : align === 'left'
        ? 'justify-start text-left'
        : 'justify-end text-right'

  return (
    <span className={`inline-flex items-baseline gap-1 ${alignmentClass} ${className}`}>
      <span className={`font-semibold ${valueClassName}`}>
        {`${signPrefix}${formattedValue}`}
      </span>
      {unit ? <span className={`text-xs ${unitClassName}`}>{unit}</span> : null}
    </span>
  )
}

export default ValueWithUnit

