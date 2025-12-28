"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangeInputProps {
    id?: string
    value?: { from?: string; to?: string } // Format: 'yyyy-MM-dd'
    onChange?: (value: { from?: string; to?: string }) => void
    min?: string
    max?: string
    disabled?: boolean
    className?: string
    placeholder?: string
    numberOfMonths?: number
}

/**
 * DateRangeInput - A custom date range picker component
 * 
 * Usage: <DateRangeInput value={{ from: startDate, to: endDate }} onChange={handleChange} />
 */
function DateRangeInput({
    id,
    value,
    onChange,
    min,
    max,
    disabled = false,
    className,
    placeholder = "Chọn khoảng ngày",
    numberOfMonths = 2,
}: DateRangeInputProps) {
    const [open, setOpen] = React.useState(false)

    // Parse the value strings to DateRange object
    const selectedRange = React.useMemo((): DateRange | undefined => {
        if (!value?.from) return undefined
        const fromDate = parse(value.from, 'yyyy-MM-dd', new Date())
        const toDate = value.to ? parse(value.to, 'yyyy-MM-dd', new Date()) : undefined
        return {
            from: isValid(fromDate) ? fromDate : undefined,
            to: toDate && isValid(toDate) ? toDate : undefined,
        }
    }, [value])

    // Parse min/max dates
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

    const handleSelect = (range: DateRange | undefined) => {
        if (onChange) {
            if (range?.from) {
                onChange({
                    from: format(range.from, 'yyyy-MM-dd'),
                    to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
                })
            } else {
                onChange({ from: undefined, to: undefined })
            }
        }
    }

    const handleClear = () => {
        if (onChange) {
            onChange({ from: undefined, to: undefined })
        }
        setOpen(false)
    }

    // Display format
    const displayValue = React.useMemo(() => {
        if (!selectedRange?.from) return ''
        const fromStr = format(selectedRange.from, 'dd/MM/yyyy', { locale: vi })
        if (!selectedRange.to) return fromStr
        const toStr = format(selectedRange.to, 'dd/MM/yyyy', { locale: vi })
        return `${fromStr} - ${toStr}`
    }, [selectedRange])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "h-11 rounded-xl border-gray-200 bg-gray-50/50 px-4",
                        "hover:bg-gray-100/80 hover:border-gray-300",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white",
                        "data-[state=open]:bg-white data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                        !selectedRange?.from && "text-gray-400",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {displayValue ? (
                        <span className="text-gray-700">{displayValue}</span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl border-gray-200 shadow-lg" align="start">
                <Calendar
                    mode="range"
                    selected={selectedRange}
                    onSelect={handleSelect}
                    numberOfMonths={numberOfMonths}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true
                        if (maxDate && date > maxDate) return true
                        return false
                    }}
                    initialFocus
                    defaultMonth={selectedRange?.from || new Date()}
                />
                <div className="flex items-center justify-between p-3 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Xóa
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        className="text-primary hover:text-primary/80"
                    >
                        Đóng
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export { DateRangeInput }
