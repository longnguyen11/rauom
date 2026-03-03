import {
  DELIVERY_BASE_FEE_CENTS_DEFAULT,
  DELIVERY_FEE_ROUNDING_STEP_CENTS_DEFAULT,
  DELIVERY_TIER1_RATE_CENTS_PER_MILE_DEFAULT,
  DELIVERY_TIER2_RATE_CENTS_PER_MILE_DEFAULT,
  MAX_DELIVERY_DISTANCE_MI_DEFAULT,
} from "@/lib/constants";

export interface DeliveryPricingRule {
  baseFeeCents: number;
  tier1RateCentsPerMile: number;
  tier2RateCentsPerMile: number;
  maxDistanceMiles: number;
  roundingStepCents: number;
  minimumOrderEnabled: boolean;
  minimumOrderAmountDeliveryCents: number | null;
  minimumOrderAmountPickupCents: number | null;
}

export const DEFAULT_DELIVERY_PRICING_RULE: DeliveryPricingRule = {
  baseFeeCents: DELIVERY_BASE_FEE_CENTS_DEFAULT,
  tier1RateCentsPerMile: DELIVERY_TIER1_RATE_CENTS_PER_MILE_DEFAULT,
  tier2RateCentsPerMile: DELIVERY_TIER2_RATE_CENTS_PER_MILE_DEFAULT,
  maxDistanceMiles: MAX_DELIVERY_DISTANCE_MI_DEFAULT,
  roundingStepCents: DELIVERY_FEE_ROUNDING_STEP_CENTS_DEFAULT,
  minimumOrderEnabled: false,
  minimumOrderAmountDeliveryCents: null,
  minimumOrderAmountPickupCents: null,
};

export function roundToNearestStep(valueCents: number, stepCents: number): number {
  if (stepCents <= 0) {
    return valueCents;
  }
  return Math.round(valueCents / stepCents) * stepCents;
}

export function calculateDeliveryFeeCents(
  distanceMiles: number,
  rule: DeliveryPricingRule,
): number {
  const roundedDistance = Math.round(distanceMiles * 10) / 10;

  if (roundedDistance < 0) {
    throw new Error("Distance cannot be negative.");
  }

  if (roundedDistance > rule.maxDistanceMiles) {
    throw new Error("Delivery is unavailable for this distance.");
  }

  let rawFeeCents = 0;
  if (roundedDistance <= 10) {
    rawFeeCents =
      rule.baseFeeCents + Math.round(roundedDistance * rule.tier1RateCentsPerMile);
  } else {
    const firstTierCents = rule.baseFeeCents + 10 * rule.tier1RateCentsPerMile;
    rawFeeCents =
      firstTierCents +
      Math.round((roundedDistance - 10) * rule.tier2RateCentsPerMile);
  }

  return roundToNearestStep(rawFeeCents, rule.roundingStepCents);
}

export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

export function calculateTaxAmountCents(
  subtotalCents: number,
  taxRateBps: number,
): number {
  const decimalRate = taxRateBps / 10_000;
  return roundHalfUp(subtotalCents * decimalRate);
}

export function calculateTotalCents(
  subtotalCents: number,
  deliveryFeeCents: number,
  taxAmountCents: number,
): number {
  return subtotalCents + deliveryFeeCents + taxAmountCents;
}
