import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { IncomeExpenseData, ExpenseCategory } from '@/types/analytics';

const COLORS = [
    '#FF6B6B', // Bright Red
    '#4ECDC4', // Turquoise
    '#FFE66D', // Bright Yellow
    '#95E1D3', // Mint Green
    '#A8E6CF', // Light Green
    '#FF8B94', // Pink
    '#C7CEEA', // Lavender
    '#FFDAC1', // Peach
];

interface IncomeExpenseChartsProps {
    data: IncomeExpenseData[];
    expenseCategories: ExpenseCategory[];
    onExport: () => void;
}

export default function IncomeExpenseCharts({
    data,
    expenseCategories,
    onExport,
}: IncomeExpenseChartsProps) {
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
    const netProfit = totalIncome - totalExpenses;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600">Total Income</div>
                        <div className="text-2xl font-bold text-green-600">
                            ${totalIncome.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600">Total Expenses</div>
                        <div className="text-2xl font-bold text-red-600">
                            ${totalExpenses.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600">Lợi nhuận ròng</div>
                        <div
                            className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                                }`}
                        >
                            ${netProfit.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Income vs Expenses Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Thu nhập và Chi phí theo thời gian</CardTitle>
                    <Button onClick={onExport} variant="outline" size="sm">
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Export Report
                    </Button>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#4ECDC4"
                                strokeWidth={3}
                                name="Income"
                                dot={{ fill: '#4ECDC4', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                stroke="#FF6B6B"
                                strokeWidth={3}
                                name="Expenses"
                                dot={{ fill: '#FF6B6B', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="netProfit"
                                stroke="#FFE66D"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                name="Lợi nhuận ròng"
                                dot={{ fill: '#FFE66D', r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Expense Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Phân tích chi phí theo danh mục</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={expenseCategories as any}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ category, percentage }: any) => `${category}: ${percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="amount"
                                >
                                    {expenseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết danh mục chi phí</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expenseCategories.map((category, index) => (
                                <div key={category.category} className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">{category.category}</span>
                                            <span className="text-gray-600">
                                                ${category.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{
                                                        width: `${category.percentage}%`,
                                                        backgroundColor: COLORS[index % COLORS.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {category.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
