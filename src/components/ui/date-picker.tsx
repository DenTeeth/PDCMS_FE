"use client"

import * as React from "react"
import { format } from "date-fns"
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

// Single Date Picker
interface DatePickerProps {
    date?: Date
    onDateChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    minDate?: Date
    maxDate?: Date
}

function DatePicker({
    date,
    onDateChange,
    placeholder = "Chọn ngày",
    disabled = false,
    className,
    minDate,
    maxDate,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "h-11 rounded-xl border-gray-200 bg-gray-50/50 px-4",
                        "hover:bg-gray-100/80 hover:border-gray-300",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white",
                        "data-[state=open]:bg-white data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                        !date && "text-gray-400",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {date ? (
                        <span className="text-gray-700">
                            {format(date, "dd/MM/yyyy", { locale: vi })}
                        </span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl border-gray-200 shadow-lg" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                        onDateChange?.(newDate)
                        setOpen(false)
                    }}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true
                        if (maxDate && date > maxDate) return true
                        return false
                    }}
                    initialFocus
                />
                <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Hủy
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setOpen(false)}
                    >
                        OK
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

// Date Range Picker
interface DateRangePickerProps {
    dateRange?: DateRange
    onDateRangeChange?: (range: DateRange | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    minDate?: Date
    maxDate?: Date
    numberOfMonths?: number
}

function DateRangePicker({
    dateRange,
    onDateRangeChange,
    placeholder = "Chọn khoảng ngày",
    disabled = false,
    className,
    minDate,
    maxDate,
    numberOfMonths = 1,
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false)

    const formatDateRange = () => {
        if (!dateRange?.from) return placeholder
        if (!dateRange.to) {
            return format(dateRange.from, "dd/MM/yyyy", { locale: vi })
        }
        return `${format(dateRange.from, "dd/MM/yyyy", { locale: vi })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: vi })}`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "h-11 rounded-xl border-gray-200 bg-gray-50/50 px-4",
                        "hover:bg-gray-100/80 hover:border-gray-300",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white",
                        "data-[state=open]:bg-white data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                        !dateRange?.from && "text-gray-400",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    <span className={dateRange?.from ? "text-gray-700" : ""}>
                        {formatDateRange()}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 rounded-xl border-gray-200 shadow-lg"
                align="start"
            >
                <div className="p-4 border-b border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        Chọn khoảng ngày
                    </p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                        {formatDateRange()}
                    </p>
                </div>
                <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    numberOfMonths={numberOfMonths}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true
                        if (maxDate && date > maxDate) return true
                        return false
                    }}
                    initialFocus
                />
                <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onDateRangeChange?.(undefined)
                            setOpen(false)
                        }}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Hủy
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setOpen(false)}
                    >
                        OK
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

// Week Picker
interface WeekPickerProps {
    selectedWeek?: { from: Date; to: Date }
    onWeekChange?: (week: { from: Date; to: Date } | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

function WeekPicker({
    selectedWeek,
    onWeekChange,
    placeholder = "Chọn tuần",
    disabled = false,
    className,
}: WeekPickerProps) {
    const [open, setOpen] = React.useState(false)

    const getWeekNumber = (date: Date) => {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
    }

    const formatWeek = () => {
        if (!selectedWeek?.from) return placeholder
        const weekNum = getWeekNumber(selectedWeek.from)
        return `Tuần ${weekNum} (${format(selectedWeek.from, "dd/MM", { locale: vi })} - ${format(selectedWeek.to, "dd/MM", { locale: vi })})`
    }

    const handleDayClick = (day: Date) => {
        // Get start of week (Monday)
        const dayOfWeek = day.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(day)
        monday.setDate(day.getDate() + diff)
        monday.setHours(0, 0, 0, 0)

        // Get end of week (Sunday)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        sunday.setHours(23, 59, 59, 999)

        onWeekChange?.({ from: monday, to: sunday })
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "h-11 rounded-xl border-gray-200 bg-gray-50/50 px-4",
                        "hover:bg-gray-100/80 hover:border-gray-300",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white",
                        "data-[state=open]:bg-white data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                        !selectedWeek && "text-gray-400",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    <span className={selectedWeek ? "text-gray-700" : ""}>
                        {formatWeek()}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl border-gray-200 shadow-lg" align="start">
                <div className="p-4 border-b border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        Chọn tuần
                    </p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                        {formatWeek()}
                    </p>
                </div>
                <Calendar
                    mode="range"
                    selected={selectedWeek ? { from: selectedWeek.from, to: selectedWeek.to } : undefined}
                    onDayClick={handleDayClick}
                    showWeekNumber
                    initialFocus
                    classNames={{
                        week: "flex w-full hover:bg-primary/5 rounded-lg transition-colors cursor-pointer",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}

export { DatePicker, DateRangePicker, WeekPicker }
