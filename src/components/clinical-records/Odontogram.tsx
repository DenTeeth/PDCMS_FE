'use client';

/**
 * Odontogram Component
 * 
 * Displays a dental chart (sơ đồ răng) with 32 teeth using FDI notation.
 * Shows tooth status with color coding and allows interaction.
 * 
 * Features:
 * - Visual representation of 32 teeth (FDI notation)
 * - Color coding based on tooth condition
 * - Click to view/edit tooth status
 * - Tooltip showing tooth number and status
 * - Responsive design
 */

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
// Thứ tự hiển thị từ trái sang phải trên màn hình (từ góc nhìn bệnh nhân)
// Cung trên - phải: [18,17,16,15,14,13,12,11] (18 ngoài cùng phải → 11 gần center)
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
// Cung trên - trái: [28,27,26,25,24,23,22,21] (28 ngoài cùng trái → 21 gần center)
// Array được giữ nguyên để hiển thị đúng thứ tự
const UPPER_LEFT = ['28', '27', '26', '25', '24', '23', '22', '21'];
// Cung dưới - trái: [38,37,36,35,34,33,32,31] (38 ngoài cùng trái → 31 gần center)
// Array được giữ nguyên để hiển thị đúng thứ tự
const LOWER_LEFT = ['38', '37', '36', '35', '34', '33', '32', '31'];
// Cung dưới - phải: [48,47,46,45,44,43,42,41] (48 ngoài cùng phải → 41 gần center)
const LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];

const ALL_TEETH = [
  ...UPPER_RIGHT,
  ...UPPER_LEFT,
  ...LOWER_LEFT,
  ...LOWER_RIGHT,
];

// Color mapping for tooth conditions (matching BE enum)
const TOOTH_STATUS_COLORS: Record<ToothCondition, string> = {
  HEALTHY: '#10b981',      // Green
  CARIES: '#ef4444',       // Red
  FILLED: '#3b82f6',       // Blue
  CROWN: '#f59e0b',       // Yellow/Orange
  ROOT_CANAL: '#ec4899',  // Pink
  MISSING: '#6b7280',     // Gray
  IMPLANT: '#8b5cf6',     // Purple
  FRACTURED: '#f97316',   // Orange
  IMPACTED: '#6366f1',    // Indigo
};

// Status labels in Vietnamese (matching BE enum)
const TOOTH_STATUS_LABELS: Record<ToothCondition, string> = {
  HEALTHY: 'Khỏe mạnh',
  CARIES: 'Sâu răng',
  FILLED: 'Đã trám',
  CROWN: 'Bọc sứ',
  ROOT_CANAL: 'Điều trị tủy',
  MISSING: 'Mất răng',
  IMPLANT: 'Cấy ghép',
  FRACTURED: 'Gãy răng',
  IMPACTED: 'Mọc ngầm',
};

// Chữ viết tắt cho trạng thái răng (hiển thị trên/dưới răng)
const TOOTH_STATUS_ABBR: Record<ToothCondition, string> = {
  HEALTHY: '', // Không hiển thị chữ viết tắt
  CARIES: 'SR',    // Sâu Răng
  FILLED: 'ĐT',    // Đã Trám
  CROWN: 'BS',     // Bọc Sứ
  ROOT_CANAL: 'ĐTT', // Điều Trị Tủy
  MISSING: 'MR',     // Mất Răng
  IMPLANT: 'CG',     // Cấy Ghép
  FRACTURED: 'GR',   // Gãy Răng
  IMPACTED: 'MN',    // Mọc Ngầm
};

// Các trạng thái cần hiển thị trong legend (bỏ HEALTHY, EXTRACTED, MISSING)
const LEGEND_STATUSES: ToothCondition[] = [
  'CARIES',
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

// ============================================================================
// Component
// ============================================================================

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
    
    // SVG dimensions - Compact size for better fit
    const svgWidth = 800;
    const svgHeight = 320; // Reduced height to minimize bottom space
    const toothWidth = 36;
    const toothHeight = 52;
    const spacing = 5;
    const centerGap = 50; // Gap between left and right quadrants
    const verticalGap = 15; // Small gap between upper and lower jaw
    const topMargin = 40; // Top margin for labels
    const bottomMargin = 20; // Reduced bottom margin
    
    // Calculate quadrant width (8 teeth per quadrant)
    const quadrantWidth = (toothWidth + spacing) * 8 - spacing;
    
    // Calculate starting X positions for left and right quadrants
    // Center the entire layout
    const totalWidth = quadrantWidth * 2 + centerGap;
    const leftQuadrantStart = (svgWidth - totalWidth) / 2;
    const rightQuadrantStart = leftQuadrantStart + quadrantWidth + centerGap;
    
    // Upper jaw Y position
    const upperY = topMargin;
    
    // Upper right quadrant (18-11): Display right to left
    // 18 is on the far right, 11 is near center
    UPPER_RIGHT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      const x = rightQuadrantStart + (7 - index) * (toothWidth + spacing);
      teeth.push({
        number: toothNum,
        x,
        y: upperY,
        status: status?.status,
        notes: status?.notes,
      });
    });
    
    // Cung trên - trái (Upper Left Quadrant 2): [28,27,26,25,24,23,22,21]
    // Array: ['28', '27', '26', '25', '24', '23', '22', '21']
    // Hiển thị từ trái sang phải: 28 ngoài cùng trái → 21 gần center
    // index 0 (28) → x = leftQuadrantStart (ngoài cùng trái)
    // index 7 (21) → x = leftQuadrantStart + 7*(toothWidth+spacing) (gần center)
    UPPER_LEFT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      const x = leftQuadrantStart + index * (toothWidth + spacing);
      teeth.push({
        number: toothNum,
        x,
        y: upperY,
        status: status?.status,
        notes: status?.notes,
      });
    });
    
    // Lower jaw Y position - closer to upper jaw
    const lowerY = upperY + toothHeight + verticalGap;
    
    // Cung dưới - phải (Lower Right Quadrant 4): [48,47,46,45,44,43,42,41]
    // Hiển thị từ phải sang trái: 48 ngoài cùng phải → 41 gần center
    // Nằm dưới cung trên - phải (cùng x positions)
    LOWER_RIGHT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      // Array đã được sắp xếp [48,47,46,45,44,43,42,41]
      // 48 (index 0) is at rightQuadrantStart + 7*(toothWidth+spacing)
      // 41 (index 7) is at rightQuadrantStart
      const x = rightQuadrantStart + (7 - index) * (toothWidth + spacing);
      teeth.push({
        number: toothNum,
        x,
        y: lowerY,
        status: status?.status,
        notes: status?.notes,
      });
    });
    
    // Cung dưới - trái (Lower Left Quadrant 3): [38,37,36,35,34,33,32,31]
    // Array: ['38', '37', '36', '35', '34', '33', '32', '31']
    // Hiển thị từ trái sang phải: 38 ngoài cùng trái → 31 gần center
    // index 0 (38) → x = leftQuadrantStart (ngoài cùng trái)
    // index 7 (31) → x = leftQuadrantStart + 7*(toothWidth+spacing) (gần center)
    LOWER_LEFT.forEach((toothNum, index) => {
      const status = statusMap.get(toothNum);
      const x = leftQuadrantStart + index * (toothWidth + spacing);
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
            viewBox="0 0 800 320"
            className="w-full h-auto min-h-[256px] sm:min-h-[320px] max-w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect width="800" height="320" fill="#fafafa" />
            
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
              y="180"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-600"
              fontSize="10"
            >
              Cung 3: Hàm dưới - trái
            </text>
            <text
              x="600"
              y="180"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-600"
              fontSize="10"
            >
              Cung 4: Hàm dưới - phải
            </text>
            
            {/* Render teeth */}
            {teethData.map((tooth) => {
              const fillColor = tooth.status
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
          <h4 className="text-sm font-semibold mb-3 text-foreground">Chú giải trạng thái răng</h4>
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

