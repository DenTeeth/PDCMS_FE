'use client'

import { forwardRef, useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface SelectOption {
    value: string
    label: string
    description?: string
    icon?: React.ReactNode
}

interface SelectProps {
    options: SelectOption[]
    label?: string
    error?: string
    className?: string
    value?: string
    onChange: (value: string) => void
    disabled?: boolean
    required?: boolean
    name?: string
    placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ options, label, error, className = '', onChange, value, ...props }, ref) => {
        const [isOpen, setIsOpen] = useState(false)
        const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
            options.find(opt => opt.value === value) || null
        )

        useEffect(() => {
            const option = options.find(opt => opt.value === value)
            if (option) {
                setSelectedOption(option)
            }
        }, [value, options])

        const handleSelect = (option: SelectOption) => {
            setSelectedOption(option)
            onChange(option.value)
            setIsOpen(false)
        }

        return (
            <div className="relative">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <button
                        type="button"
                        disabled={props.disabled}
                        className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left border shadow-sm transition-all duration-200 ease-in-out
                            ${error ? 'border-red-300' : 'border-gray-300'}
                            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                            ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-blue-400'}
                            ${className}`}
                        onClick={() => !props.disabled && setIsOpen(!isOpen)}
                    >
                        <span className="flex items-center">
                            {selectedOption?.icon && (
                                <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>
                            )}
                            <span className={`block truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
                                {selectedOption?.label || props.placeholder || 'Select an option'}
                            </span>
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown
                                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </span>
                    </button>

                    {isOpen && (
                        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm transform opacity-100 scale-100 transition ease-out duration-200">
                            {options.map((option) => (
                                <li
                                    key={option.value}
                                    className={`relative cursor-pointer select-none py-2.5 pl-3 pr-9 transition-colors duration-200
                                        ${selectedOption?.value === option.value
                                            ? 'bg-blue-50/80 text-blue-600'
                                            : 'text-gray-900 hover:bg-blue-50/50'
                                        }`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <div className="flex items-center">
                                        {option.icon && (
                                            <span className="mr-3 flex-shrink-0">
                                                {option.icon}
                                            </span>
                                        )}
                                        <div>
                                            <span className={`block truncate font-medium ${selectedOption?.value === option.value
                                                    ? 'text-blue-600'
                                                    : 'text-gray-900'
                                                }`}>
                                                {option.label}
                                            </span>
                                            {option.description && (
                                                <span className="block truncate text-sm text-gray-500">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                        {selectedOption?.value === option.value && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                                <Check className="h-5 w-5" />
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        )
    }
)

Select.displayName = 'Select'

export default Select