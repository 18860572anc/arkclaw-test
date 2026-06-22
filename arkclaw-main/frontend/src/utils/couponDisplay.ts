import type { CouponBenefitType, CouponRecord } from '../types/domain';

export const getCouponBenefitType = (
  coupon?: Pick<CouponRecord, 'benefitType'>,
): CouponBenefitType => coupon?.benefitType ?? 'voucher';

export const couponBenefitTypeLabel = (coupon?: Pick<CouponRecord, 'benefitType'>) =>
  getCouponBenefitType(coupon) === 'coupon' ? '优惠券' : '代金券';

export const isVoucherCoupon = (coupon?: Pick<CouponRecord, 'benefitType'>) =>
  getCouponBenefitType(coupon) === 'voucher';

export const isDiscountCoupon = (coupon?: Pick<CouponRecord, 'benefitType'>) =>
  getCouponBenefitType(coupon) === 'coupon';
