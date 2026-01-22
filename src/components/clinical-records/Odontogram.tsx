'use client';



import React, { useMemo, useState } from 'react';
import { ToothStatusResponse, ToothCondition } from '@/types/clinicalRecord';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Constants
// ============================================================================

/**
 * FDI Tooth Numbering System (Fédération Dentaire Internationale)
 * 
 * Miệng được chia thành 4 cung hàm (quadrants):
 * - Cung 1: Hàm trên bên phải (Upper Right) - Răng 11-18
 * - Cung 2: Hàm trên bên trái (Upper Left) - Răng 21-28
 * - Cung 3: Hàm dưới bên trái (Lower Left) - Răng 31-38
 * - Cung 4: Hàm dưới bên phải (Lower Right) - Răng 41-48
 * 
 * Mỗi cung có 8 răng, đánh số từ 1-8:
 * - 1: Răng cửa giữa (Central Incisor)
 * - 2: Răng cửa bên (Lateral Incisor)
 * - 3: Răng nanh (Canine)
 * - 4: Răng tiền hàm nhỏ thứ nhất (First Premolar)
 * - 5: Răng tiền hàm nhỏ thứ hai (Second Premolar)
 * - 6: Răng hàm lớn thứ nhất (First Molar)
 * - 7: Răng hàm lớn thứ hai (Second Molar)
 * - 8: Răng khôn (Third Molar / Wisdom Tooth)
 * 
 * Cách đọc: Số thứ tự = [Cung hàm] + [Vị trí răng]
 * Ví dụ: Răng 36 = Cung 3 (hàm dưới trái) + Vị trí 6 (răng hàm lớn thứ nhất)
 * 
 * Layout từ góc nhìn bệnh nhân (mirror view):
 * - Upper Right (18-11): Hiển thị từ phải sang trái (18 ngoài cùng phải → 11 gần center)
 * - Upper Left (21-28): Hiển thị từ trái sang phải (21 gần center → 28 ngoài cùng trái)
 * - Lower Left (31-38): Hiển thị từ trái sang phải (31 gần center → 38 ngoài cùng trái)
 * - Lower Right (41-48): Hiển thị từ phải sang trái (48 ngoài cùng phải → 41 gần center)
 */

const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];

const UPPER_LEFT = ['28', '27', '26', '25', '24', '23', '22', '21'];
const LOWER_LEFT = ['38', '37', '36', '35', '34', '33', '32', '31'];
const LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];

const ALL_TEETH = [
  ...UPPER_RIGHT,
  ...UPPER_LEFT,
  ...LOWER_LEFT,
  ...LOWER_RIGHT,
];

// Color mapping for tooth conditions (matching BE enum)
const TOOTH_STATUS_COLORS: Record<ToothCondition, string> = {
  HEALTHY: '#10b981',           // Green
  CARIES_MILD: '#fbbf24',       // Yellow - Sâu răng nhẹ
  CARIES_MODERATE: '#f97316',   // Orange - Sâu răng vừa
  CARIES_SEVERE: '#ef4444',     // Red - Sâu răng nặng
  FILLED: '#3b82f6',            // Blue
  CROWN: '#f59e0b',            // Yellow/Orange
  ROOT_CANAL: '#ec4899',        // Pink
  MISSING: '#6b7280',          // Gray
  IMPLANT: '#8b5cf6',          // Purple
  FRACTURED: '#f97316',        // Orange
  IMPACTED: '#6366f1',         // Indigo
};

// Status labels in Vietnamese (matching BE enum)
const TOOTH_STATUS_LABELS: Record<ToothCondition, string> = {
  HEALTHY: 'Khỏe mạnh',
  CARIES_MILD: 'Sâu răng nhẹ',
  CARIES_MODERATE: 'Sâu răng vừa',
  CARIES_SEVERE: 'Sâu răng nặng',
  FILLED: 'Răng trám',
  CROWN: 'Bọc sứ',
  ROOT_CANAL: 'Điều trị tủy',
  MISSING: 'Mất răng',
  IMPLANT: 'Cấy ghép',
  FRACTURED: 'Gãy răng',
  IMPACTED: 'Mọc ngầm',
};

// Chữ viết tắt cho trạng thái răng (hiển thị trên/dưới răng)
const TOOTH_STATUS_ABBR: Record<ToothCondition, string> = {
  HEALTHY: '',           // Không hiển thị chữ viết tắt
  CARIES_MILD: 'SR1',    // Sâu Răng Nhẹ (mức 1)
  CARIES_MODERATE: 'SR2', // Sâu Răng Vừa (mức 2)
  CARIES_SEVERE: 'SR3',   // Sâu Răng Nặng (mức 3)
  FILLED: 'TR',          // Răng Trám
  CROWN: 'BS',           // Bọc Sứ
  ROOT_CANAL: 'ĐTT',     // Điều Trị Tủy
  MISSING: 'MR',         // Mất Răng
  IMPLANT: 'CG',         // Cấy Ghép
  FRACTURED: 'GR',       // Gãy Răng
  IMPACTED: 'MN',        // Mọc Ngầm
};

// Các trạng thái cần hiển thị trong legend (bỏ HEALTHY, EXTRACTED, MISSING)
const LEGEND_STATUSES: ToothCondition[] = [
  'CARIES_MILD',
  'CARIES_MODERATE',
  'CARIES_SEVERE',
  'FILLED',
  'CROWN',
  'ROOT_CANAL',
  'IMPLANT',
  'FRACTURED',
  'IMPACTED',
];

// Default color for teeth without status
const DEFAULT_COLOR = '#e5e7eb'; // Light gray

// ============================================================================
// Types
// ============================================================================

export interface OdontogramProps {
  patientId: number;
  toothStatuses?: ToothStatusResponse[];
  onToothClick?: (toothNumber: string, status?: ToothCondition, notes?: string) => void;
  editable?: boolean;
  readOnly?: boolean;
  className?: string;
}

interface ToothData {
  number: string;
  x: number;
  y: number;
  status?: ToothCondition;
  notes?: string;
}

// SVG layout constants (shared between geometry & rendering)
const SVG_WIDTH = 800;
const SVG_HEIGHT = 250;
const TOOTH_WIDTH = 36;
const TOOTH_HEIGHT = 52;
const TOOTH_SPACING = 5;
const CENTER_GAP = 50;    // Khoảng cách giữa cung trái/phải
const VERTICAL_GAP = 30;  // Khoảng cách giữa hàm trên & hàm dưới
const TOP_MARGIN = 55;    // Lề trên cho label + hàng răng trên
const BOTTOM_MARGIN = 30; // Lề dưới

export default function Odontogram({
  patientId,
  toothStatuses = [],
  onToothClick,
  editable = false,
  readOnly = false,
  className,
}: OdontogramProps) {
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);

  // Create status map for quick lookup
  const statusMap = useMemo(() => {
    const map = new Map<string, ToothStatusResponse>();
    toothStatuses.forEach((status) => {
      map.set(status.toothNumber, status);
    });
    return map;
  }, [toothStatuses]);

  // Generate teeth data with positions
  const teethData = useMemo(() => {
    const teeth: ToothData[] = [];

    // Calculate quadrant width (8 teeth per quadrant)
    const quadrantWidth = (TOOTH_WIDTH + TOOTH_SPACING) * 8 - TOOTH_SPACING;

    // Calculate starting X positions for left and right quadrants
    // Center the entire layout
    const totalWidth = quadrantWidth * 2 + CENTER_GAP;
    const leftQuadrantStart = (SVG_WIDTH - totalWidth) / 2;
    const rightQuadrantStart = leftQuadrantStart + quadrantWidth + CENTER_GAP;

    // Upper jaw Y position
    const upperY = TOP_MARGIN;

    // Upper right quadrant (18-11): Display right to left
    // 18 is on the far right, 11 is near center
    UPPER_RIGHT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      const x = rightQuadrantStart + (7 - index) * (TOOTH_WIDTH + TOOTH_SPACING);
      teeth.push({
        number: toothNum,
        x,
        y: upperY,
        status: status?.status,
        notes: status?.notes,
      });
    });

    
    UPPER_LEFT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      const x = leftQuadrantStart + index * (TOOTH_WIDTH + TOOTH_SPACING);
      teeth.push({
        number: toothNum,
        x,
        y: upperY,
        status: status?.status,
        notes: status?.notes,
      });
    });

    // Lower jaw Y position - phía dưới hàm trên, với khoảng cách rõ ràng (VERTICAL_GAP)
    const lowerY = upperY + TOOTH_HEIGHT + VERTICAL_GAP;

  
    LOWER_RIGHT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
     
      const x = rightQuadrantStart + (7 - index) * (TOOTH_WIDTH + TOOTH_SPACING);
      teeth.push({
        number: toothNum,
        x,
        y: lowerY,
        status: status?.status,
        notes: status?.notes,
      });
    });

   
    LOWER_LEFT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      const x = leftQuadrantStart + index * (TOOTH_WIDTH + TOOTH_SPACING);
      teeth.push({
        number: toothNum,
        x,
        y: lowerY,
        status: status?.status,
        notes: status?.notes,
      });
    });

    // Verify all 32 teeth are generated
    if (teeth.length !== 32) {
      console.warn(`Expected 32 teeth, but generated ${teeth.length}`);
    }

    return teeth;
  }, [statusMap]);

  const handleToothClick = (tooth: ToothData) => {
    if (readOnly || !onToothClick) return;
    onToothClick(tooth.number, tooth.status, tooth.notes);
  };

  const handleToothHover = (toothNumber: string | null) => {
    if (readOnly) return;
    setHoveredTooth(toothNumber);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Sơ đồ răng (Odontogram)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SVG Chart */}
        <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto min-h-[320px] sm:min-h-[400px] max-w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#fafafa" />

            {/* Horizontal line separating upper and lower jaw */}
            {/* Position: TOP_MARGIN + TOOTH_HEIGHT + VERTICAL_GAP/2 */}
            <line
              x1="50"
              y1={TOP_MARGIN + TOOTH_HEIGHT + VERTICAL_GAP / 2}
              x2="750"
              y2={TOP_MARGIN + TOOTH_HEIGHT + VERTICAL_GAP / 2}
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />

            {/* Quadrant labels with FDI notation explanation */}
            <text
              x="200"
              y="25"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-600"
              fontSize="10"
            >
              Cung 2: Hàm trên - trái
            </text>
            <text
              x="600"
              y="25"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-600"
              fontSize="10"
            >
              Cung 1: Hàm trên - phải
            </text>
            <text
              x="200"
              y="220"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-600"
              fontSize="10"
            >
              Cung 3: Hàm dưới - trái
            </text>
            <text
              x="600"
              y="220"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-600"
              fontSize="10"
            >
              Cung 4: Hàm dưới - phải
            </text>

            {/* Render teeth */}
            {teethData.map((tooth) => {
              // If status is HEALTHY or no status, use default color (no special color)
              const fillColor = tooth.status && tooth.status !== 'HEALTHY'
                ? TOOTH_STATUS_COLORS[tooth.status]
                : DEFAULT_COLOR;
              const isHovered = hoveredTooth === tooth.number;
              const strokeColor = isHovered ? '#3b82f6' : '#d1d5db';
              const strokeWidth = isHovered ? 2.5 : 1.5;

              return (
                <g key={tooth.number}>
                  {/* Tooth shape (rounded rectangle) */}
                  <rect
                    x={tooth.x}
                    y={tooth.y}
                    width="36"
                    height="52"
                    rx="4"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    className={cn(
                      'transition-all duration-200',
                      !readOnly && 'cursor-pointer',
                      isHovered && 'opacity-90',
                      !readOnly && !isHovered && 'hover:opacity-85 hover:shadow-md'
                    )}
                    onClick={() => handleToothClick(tooth)}
                    onMouseEnter={() => handleToothHover(tooth.number)}
                    onMouseLeave={() => handleToothHover(null)}
                  />

                  {/* Tooth number - always in center of tooth */}
                  <text
                    x={tooth.x + 18}
                    y={tooth.y + 30}
                    textAnchor="middle"
                    className="text-sm font-bold fill-gray-900"
                    fontSize="11"
                    pointerEvents="none"
                  >
                    {tooth.number}
                  </text>

                  {/* Status abbreviation - above tooth (upper jaw) or below tooth (lower jaw) */}
                  {tooth.status && TOOTH_STATUS_ABBR[tooth.status] && (
                    <text
                      x={tooth.x + 18}
                      y={tooth.y < 120 ? tooth.y - 5 : tooth.y + 65}
                      textAnchor="middle"
                      className="text-xs font-semibold"
                      fill={TOOTH_STATUS_COLORS[tooth.status]}
                      fontSize="9"
                      pointerEvents="none"
                    >
                      {TOOTH_STATUS_ABBR[tooth.status]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Chú thích trạng thái răng</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {LEGEND_STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <div
                  className="w-4 h-4 rounded border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: TOOTH_STATUS_COLORS[status] }}
                />
                <span className="text-xs text-foreground font-medium">
                  {TOOTH_STATUS_LABELS[status]} ({TOOTH_STATUS_ABBR[status]})
                </span>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

