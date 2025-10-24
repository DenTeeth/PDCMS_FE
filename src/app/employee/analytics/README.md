# Analytics Dashboard - Manager Role

Comprehensive analytics dashboard for dental clinic management with KPI tracking, performance analytics, service analytics, financial reports, and appointment analytics.

## 📍 Location
- **Path**: `/employee/analytics`
- **Files**: `src/app/employee/analytics/`

## 🎯 Features Overview

### 1. Dashboard Tab
**KPI Cards** (4 cards with trend indicators):
- ✅ Total Patients (This Month) - with % change
- ✅ Total Revenue (This Month) - with % change  
- ✅ Total Appointments (This Month) - with % change
- ✅ Employee Count - with % change

**Charts**:
- ✅ Revenue Trend (Line chart - Last 12 months)
- ✅ Appointments by Status (Pie chart)
- ✅ Top Services (Bar chart)
- ✅ Patient Acquisition (Line chart - New vs Returning)

**Filters**:
- ✅ Date Range Filter (This Week, This Month, Last 3 Months, Custom)

### 2. Performance Analytics Tab
**Employee Performance Table**:
- ✅ Columns: Employee Name, Role, Appointments Handled, Revenue Generated, Rating
- ✅ Filter by date range
- ✅ Filter by role
- ✅ Sort by any column (clickable headers)
- ✅ Search by name or ID

**Charts**:
- ✅ Top Performers (Bar chart - Top 10 by revenue)
- ✅ Performance metrics displayed in table

### 3. Service Analytics Tab
**Features**:
- ✅ Most Used Services (Bar chart)
- ✅ Revenue by Service (Pie chart)
- ✅ Service Analytics Table with:
  - Service name
  - Usage count
  - Revenue
  - Utilization rate (progress bar)
  - Average price per service

### 4. Income & Expenses Tab
**Features**:
- ✅ Summary Cards: Total Income, Total Expenses, Net Profit
- ✅ Income vs Expenses Chart (Line chart over time)
- ✅ Expense Breakdown by Category (Pie chart)
- ✅ Category Details with progress bars
- ✅ Net Profit Calculation
- ✅ Export Report button

### 5. Appointment Analytics Tab
**Metrics Cards**:
- ✅ Total Appointments
- ✅ Completed Count
- ✅ Cancellation Rate
- ✅ No-Show Rate

**Charts**:
- ✅ Appointment Volume (Line chart)
- ✅ Peak Hours/Days (Heatmap) - Shows appointment density by day and hour
- ✅ Visual legend for heatmap intensity

## 🎨 Components Structure

```
src/app/employee/analytics/
├── page.tsx (Main dashboard with 5 tabs)
├── components/
    ├── KPICard.tsx (Reusable KPI card with trend indicator)
    ├── DashboardCharts.tsx (Revenue, Status, Services, Acquisition charts)
    ├── EmployeePerformanceTable.tsx (Filterable, sortable table + chart)
    ├── ServiceAnalyticsCharts.tsx (Service usage & revenue charts)
    ├── IncomeExpenseCharts.tsx (Financial charts with export)
    └── AppointmentAnalyticsCharts.tsx (Volume, metrics, heatmap)
```

## 📊 Chart Types Used

- **Line Charts**: Revenue trend, Patient acquisition, Appointment volume, Income vs Expenses
- **Bar Charts**: Top services, Top performers, Most used services
- **Pie Charts**: Appointment status, Service revenue, Expense categories
- **Heatmap**: Peak hours/days (custom implementation)
- **Progress Bars**: Utilization rates, Category percentages

## 🔧 Technologies

- **Charts**: Recharts library
- **UI**: Shadcn/ui components (Card, Button, Select, Tabs, Input)
- **Icons**: Font Awesome
- **Styling**: Tailwind CSS
- **Toast**: Sonner

## 📝 Data Source

Currently using **mock data** with automatic fallback. When backend is ready:
1. Uncomment API calls in `loadData()` function
2. Remove mock data generator
3. Service functions are ready in `src/services/analyticsService.ts`

## 🎯 Definition of Done (DoD) ✅

- ✅ Dashboard comprehensive with all 5 tabs
- ✅ All charts rendering correctly with Recharts
- ✅ Filters working (date range, role, search)
- ✅ Data accurate with mock data
- ✅ Export functionality implemented (ready for backend)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states implemented
- ✅ Sort functionality on tables
- ✅ Search functionality
- ✅ KPI cards with trend indicators
- ✅ Heatmap visualization for peak hours
- ✅ Color-coded metrics (green/red/blue)

## 🚀 Usage

Navigate to: `http://localhost:3000/employee/analytics`

Or access via sidebar: **Analytics** menu item

## 📱 Responsive Features

- Grid layouts adapt to screen size (1/2/4 columns)
- Charts use ResponsiveContainer
- Tables scroll horizontally on mobile
- Filters stack vertically on mobile
- Heatmap scrollable on small screens

## 🔮 Future Enhancements

- Real-time data updates
- Date range picker for custom range
- Export to PDF/Excel
- Drill-down capabilities on charts
- Employee comparison view
- Predictive analytics
- Goal setting & tracking
- Email report scheduling
