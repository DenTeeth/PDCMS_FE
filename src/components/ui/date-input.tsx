"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateInputProps {
    id?: string
    value?: string // Format: 'yyyy-MM-dd'
    onChange?: (e: { target: { value: string } }) => void
    min?: string
    max?: string
    disabled?: boolean
    className?: string
    placeholder?: string
    required?: boolean
    name?: string
}

/**
 * DateInput - A custom date picker component that replaces native input[type="date"]
 * 
 * Usage: Replace <Input type="date" value={date} onChange={handleChange} />
 * with: <DateInput value={date} onChange={handleChange} />
 * 
 * The onChange event mimics the native input event structure for easy migration
 */
function DateInput({
    id,
    value,
    onChange,
    min,
    max,
    disabled = false,
    className,
    placeholder = "dd/mm/yyyy",
    required,
    name,
}: DateInputProps) {
    const [open, setOpen] = React.useState(false)

    // Parse the value string to Date object - memoized for performance
    const selectedDate = React.useMemo(() => {
        if (!value) return undefined
        const parsed = parse(value, 'yyyy-MM-dd', new Date())
        return isValid(parsed) ? parsed : undefined
    }, [value])

    // Parse min/max dates - memoized for performance
    const minDate = React.useMemo(() => {
        if (!min) return undefined
        const parsed = parse(min, 'yyyy-MM-dd', new Date())
        return isValid(parsed) ? parsed : undefined
    }, [min])

    const maxDate = React.useMemo(() => {
        if (!max) return undefined
        const parsed = parse(max, 'yyyy-MM-dd', new Date())
        return isValid(parsed) ? parsed : undefined
    }, [max])

    // Memoized disabled function for performance
    const disabledDays = React.useCallback((date: Date) => {
        if (minDate && date < minDate) return true
        if (maxDate && date > maxDate) return true
        return false
    }, [minDate, maxDate])

    const handleSelect = React.useCallback((date: Date | undefined) => {
        if (date && onChange) {
            const formattedDate = format(date, 'yyyy-MM-dd')
            onChange({ target: { value: formattedDate } })
        } else if (!date && onChange) {
            onChange({ target: { value: '' } })
        }
        setOpen(false)
    }, [onChange])

    const handleClear = React.useCallback(() => {
        if (onChange) {
            onChange({ target: { value: '' } })
        }
        setOpen(false)
    }, [onChange])

    const handleToday = React.useCallback(() => {
        if (onChange) {
            const today = format(new Date(), 'yyyy-MM-dd')
            onChange({ target: { value: today } })
        }
        setOpen(false)
    }, [onChange])

    // Display format: dd/MM/yyyy - memoized for performance
    const displayValue = React.useMemo(() => {
        return selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: vi }) : ''
    }, [selectedDate])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "h-9 rounded-md border-gray-300 bg-white px-3",
                        "hover:bg-gray-50 hover:border-gray-400",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                        !selectedDate && "text-muted-foreground",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {displayValue ? (
                        <span>{displayValue}</span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-lg border shadow-lg" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    disabled={disabledDays}
                    initialFocus
                    defaultMonth={selectedDate || new Date()}
                />
                <div className="flex items-center justify-between p-3 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Xóa
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToday}
                        className="text-primary hover:text-primary/80 font-medium"
                    >
                        Hôm nay
                    </Button>
                </div>
            </PopoverContent>
            {/* Hidden input for form compatibility */}
            <input
                type="hidden"
                name={name}
                value={value || ''}
                required={required}
            />
        </Popover>
    )
}

export { DateInput }
