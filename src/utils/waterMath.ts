import { WaterValidationResult } from '../types';

export const SINGLE_ADDITION_LIMIT = 500; // ml
export const DAILY_LIMIT_RATIO = 1.2; // 120%

/**
 * Calculates water reference range according to user weight
 * Formula: Weight (kg) x 30–35 ml
 */
export function calculateWaterRange(weight: number): { min: number; max: number } {
  const safeWeight = Math.max(20, Math.min(250, weight || 60));
  return {
    min: Math.round(safeWeight * 30),
    max: Math.round(safeWeight * 35),
  };
}

/**
 * Calculates progress target
 * Formula: Weight (kg) x 32.5 ml
 */
export function calculateProgressTarget(weight: number): number {
  const safeWeight = Math.max(20, Math.min(250, weight || 60));
  return Math.round(safeWeight * 32.5);
}

/**
 * Calculates daily technical limit: Target * 120%
 */
export function calculateDailyLimit(target: number): number {
  return Math.round(target * DAILY_LIMIT_RATIO);
}

/**
 * Validates water addition according to strict technical limits
 */
export function validateWaterAddition(
  currentTotal: number,
  target: number,
  amountToAdd: number
): WaterValidationResult {
  // Check 1: single addition limit <= 500 ml
  if (amountToAdd > SINGLE_ADDITION_LIMIT) {
    return {
      allowed: false,
      reason: 'EXCEEDS_SINGLE_LIMIT',
      message: '⚠️ Lượng nước mỗi lần ghi nhận không được vượt quá 500 ml. Hãy chia thành các lần nhỏ hơn.',
    };
  }

  if (amountToAdd <= 0 || isNaN(amountToAdd)) {
    return {
      allowed: false,
      message: '⚠️ Lượng nước phải lớn hơn 0 ml.',
    };
  }

  // Check 2: daily limit <= 120% target
  const dailyLimit = calculateDailyLimit(target);
  const newTotal = currentTotal + amountToAdd;

  if (newTotal > dailyLimit) {
    return {
      allowed: false,
      reason: 'EXCEEDS_DAILY_LIMIT',
      message: '⚠️ Không thể ghi nhận lượng nước này vì tổng lượng nước sẽ vượt giới hạn của ứng dụng hôm nay.',
    };
  }

  return { allowed: true };
}

/**
 * Formats milliliter numbers with Vietnamese dot thousand separators (e.g., 1.950 ml)
 */
export function formatMl(amount: number): string {
  const safe = Math.max(0, Math.round(amount || 0));
  return safe.toLocaleString('vi-VN');
}
