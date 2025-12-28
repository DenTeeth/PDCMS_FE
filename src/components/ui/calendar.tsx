"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            locale={vi}
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                // Layout
                months: "relative flex flex-col sm:flex-row gap-4",
                month: "w-full",
                month_caption: "flex justify-center items-center h-10 relative mb-2",
                caption_label: "text-sm font-semibold",
                // Navigation - đặt trong month_caption
                nav: "flex items-center justify-between absolute inset-x-0 top-0 h-10",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 hover:bg-primary/10 hover:text-primary transition-colors z-10"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 hover:bg-primary/10 hover:text-primary transition-colors z-10"
                ),
                // Week days header
                weekdays: "flex w-full",
                weekday: "text-muted-foreground w-9 font-medium text-[0.75rem] text-center",
                // Calendar grid
                weeks: "w-full",
                week: "flex w-full mt-1",
                day: "h-9 w-9 p-0 text-center text-sm relative",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal hover:bg-primary/10 hover:text-primary transition-colors",
                    "aria-selected:opacity-100"
                ),
                // States
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold rounded-md",
                today: "bg-accent text-accent-foreground font-semibold rounded-md",
                outside: "text-muted-foreground/50 aria-selected:bg-primary/10 aria-selected:text-primary/70",
                disabled: "text-muted-foreground/30 cursor-not-allowed",
                hidden: "invisible",
                // Range - màu đậm hơn để dễ nhìn
                range_start: "rounded-l-md bg-primary text-primary-foreground font-semibold",
                range_end: "rounded-r-md bg-primary text-primary-foreground font-semibold",
                range_middle: "bg-primary/30 text-primary font-medium rounded-none",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === "left" ?
                        <ChevronLeft className="h-4 w-4" /> :
                        <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
