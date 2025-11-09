"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface MonthPickerProps {
    value: string; // 'YYYY-MM' or 'ALL'
    onChange: (value: string) => void;
    availableMonths: string[]; // Array of 'YYYY-MM' strings
    placeholder?: string;
}

export function MonthPicker({
    value,
    onChange,
    availableMonths,
    placeholder = "Chọn tháng"
}: MonthPickerProps) {
    const [open, setOpen] = React.useState(false)
    const today = new Date()

    const [currentYear, setCurrentYear] = React.useState(() => {
        if (value !== 'ALL' && value) {
            return parseInt(value.split('-')[0])
        }
        return today.getFullYear()
    })

    // Allow navigating through years (current year to 3 years ahead)
    const minYear = today.getFullYear()
    const maxYear = today.getFullYear() + 3

    const canGoPrevYear = currentYear > minYear
    const canGoNextYear = currentYear < maxYear

    const getMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split('-')
        return `Tháng ${parseInt(month)}/${year}`
    }

    const getMonthShort = (monthNum: number) => {
        const date = new Date(2000, monthNum - 1, 1)
        return format(date, 'MMM', { locale: vi })
    }

    const selectedMonth = value !== 'ALL' ? getMonthName(value) : null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full max-w-xs justify-start text-left font-normal",
                        !selectedMonth && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth || placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                    {/* Year Navigation */}
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentYear(prev => prev - 1)}
                            disabled={!canGoPrevYear}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="font-semibold">
                            {currentYear}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentYear(prev => prev + 1)}
                            disabled={!canGoNextYear}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* All Option */}
                    <div className="mb-2">
                        <Button
                            variant={value === 'ALL' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => {
                                onChange('ALL')
                                setOpen(false)
                            }}
                        >
                            Tất cả các tháng
                        </Button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                            const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`
                            const isAvailable = availableMonths.includes(monthStr)
                            const isSelected = value === monthStr
                            // Only disable months that have completely passed
                            const selectedDate = new Date(currentYear, month - 1, 1)
                            const todayStart = new Date(today.getFullYear(), today.getMonth(), 1)
                            const isPast = selectedDate < todayStart

                            return (
                                <Button
                                    key={month}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className={cn(
                                        "h-9",
                                        isPast && "opacity-30 cursor-not-allowed",
                                        isAvailable && !isPast && !isSelected && "border-purple-300 bg-purple-50 hover:bg-purple-100"
                                    )}
                                    onClick={() => {
                                        if (!isPast) {
                                            onChange(monthStr)
                                            setOpen(false)
                                        }
                                    }}
                                    disabled={isPast}
                                >
                                    T{month}
                                </Button>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onChange('ALL')
                                setOpen(false)
                            }}
                        >
                            Xóa
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const today = new Date()
                                const currentMonth = format(today, 'yyyy-MM')
                                if (availableMonths.includes(currentMonth)) {
                                    onChange(currentMonth)
                                    setCurrentYear(today.getFullYear())
                                }
                                setOpen(false)
                            }}
                        >
                            Hôm nay
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
