import { Button } from '@/components/ui/button';
import type { Transaction } from '@/types/accounting';

interface TransactionTableProps {
    transactions: Transaction[];
    onViewDetail?: (transaction: Transaction) => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

export default function TransactionTable({
    transactions,
    onViewDetail,
    onEdit,
    onDelete
}: TransactionTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-3">Mã Phiếu</th>
                        <th className="text-left p-3">Loại</th>
                        <th className="text-left p-3">Danh Mục</th>
                        <th className="text-left p-3">Nội Dung</th>
                        <th className="text-right p-3">Số Tiền</th>
                        <th className="text-left p-3">Ngày</th>
                        <th className="text-center p-3">Trạng Thái</th>
                        <th className="text-center p-3">Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{transaction.code}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${transaction.type === 'Thu'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    {transaction.type}
                                </span>
                            </td>
                            <td className="p-3 text-sm">{transaction.category}</td>
                            <td className="p-3 text-sm max-w-xs truncate">{transaction.description}</td>
                            <td className={`p-3 text-right font-bold ${transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {transaction.type === 'Thu' ? '+' : '-'}{transaction.amount.toLocaleString()} ₫
                            </td>
                            <td className="p-3 text-sm">{transaction.date}</td>
                            <td className="p-3 text-center">
                                <span className={`px-2 py-1 text-xs rounded ${transaction.status === 'Đã duyệt'
                                        ? 'bg-green-100 text-green-700'
                                        : transaction.status === 'Chờ duyệt'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                    {transaction.status}
                                </span>
                            </td>
                            <td className="p-3 text-center">
                                <div className="flex gap-2 justify-center">
                                    {onViewDetail && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDetail(transaction)}
                                        >
                                            Chi tiết
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
