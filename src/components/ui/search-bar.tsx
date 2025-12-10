'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export default function SearchBar({
    value,
    onChange,
    placeholder = "Tìm kiếm...",
    className = ""
}: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
            </span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    )
}