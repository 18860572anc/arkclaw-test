import type { OrderBundleLine } from '../types/domain';

export const orderCycleLabel = (months?: number, fallback?: string) => {
  if (months) return `${months}个月`;
  if (fallback?.includes('年付')) return '12个月';
  if (fallback?.includes('半年')) return '6个月';
  if (fallback?.includes('季付')) return '3个月';
  if (fallback?.includes('试点')) return '1个月';
  return fallback || '';
};

export const orderSummaryLabel = (orderType: string, bundleLines?: OrderBundleLine[]) => {
  const seatLines = bundleLines?.filter((line) => line.productType === 'seat') ?? [];
  if (!seatLines.length) return orderType;
  const seats = seatLines.reduce((sum, line) => sum + line.quantity, 0);
  const cycle = orderCycleLabel(seatLines[0]?.cycleMonths, seatLines[0]?.specLabel);
  return `席位组合包 · ${seats}席${cycle ? ` · ${cycle}` : ''}`;
};

export const orderBundleDetailLines = (bundleLines?: OrderBundleLine[]) => {
  if (!bundleLines?.length) return [];
  const codingLines = bundleLines.filter((line) => line.productType === 'coding_plan');
  return bundleLines
    .filter((line) => line.productType === 'seat')
    .map((line) => {
      const expectedCodingName = line.productName.includes('轻量版') || line.productName.includes('标准版')
        ? 'CodingPlan Team Lite'
        : 'CodingPlan Team Pro';
      const matchedCoding = codingLines.find((coding) => (
        coding.productName === expectedCodingName
        && coding.quantity === line.quantity
        && coding.specLabel === line.specLabel
      )) ?? codingLines.find((coding) => (
        coding.productName === expectedCodingName
        && coding.quantity === line.quantity
      ));
      return `${line.productName} ${line.quantity}${line.unit}${matchedCoding ? `，含 ${matchedCoding.productName}` : ''}`;
    });
};
