// Furnihub V2.0 · Container packing engine
// TypeScript port of nangong Django container_engine.py
// Used by /container, /api/container/*, admin container type configurator
//
// Algorithm: 2D bin packing (Guillotine) for floor layout + 1D stack packing for height
// Pitfall log:
//   - All Decimal values from Prisma are `number` in JS (loss of precision below 1e-6)
//   - JSON serialization must keep numeric precision (use toFixed helper)
//   - Container types are configurable via ContainerType table (no hardcoding)

import { prisma } from './db';
import type { Product } from '@prisma/client';

const DEFAULT_COLORS = [
  '#2F7D6A', '#567A9A', '#9A6B55', '#7E885B',
  '#A07C43', '#725F8E', '#4E8B88', '#A15D69',
];

// ===== Helpers =====

function decimalString(value: number, places = 2): string {
  return Number(value ?? 0).toFixed(places);
}

function hashStringToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function productColor(product: Product): string {
  if (product.loadingColor) return product.loadingColor;
  const idx = hashStringToInt(product.sku) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[idx];
}

export interface ContainerTypeLite {
  id: string;
  code: string;
  name: string;
  internalLengthCm: number;
  internalWidthCm: number;
  internalHeightCm: number;
  nominalCbm: number;
  safetyUtilization: number;
  maxPayloadKg: number;
}

function usableCbm(c: ContainerTypeLite): number {
  return (c.nominalCbm * c.safetyUtilization) / 100;
}

export function serializeContainer(c: ContainerTypeLite) {
  return {
    code: c.code,
    name: c.name,
    inside: `${(c.internalLengthCm / 100).toFixed(2)} × ${(c.internalWidthCm / 100).toFixed(2)} × ${(c.internalHeightCm / 100).toFixed(2)} m`,
    internalLengthCm: decimalString(c.internalLengthCm),
    internalWidthCm: decimalString(c.internalWidthCm),
    internalHeightCm: decimalString(c.internalHeightCm),
    nominalCbm: decimalString(c.nominalCbm),
    safetyUtilization: decimalString(c.safetyUtilization),
    usableCbm: decimalString(usableCbm(c)),
    maxPayloadKg: decimalString(c.maxPayloadKg),
  };
}

// ===== Carton math =====

function cartonCount(product: Product, quantity: number): number {
  const numerator = quantity * product.cartonsPerUnit;
  return Math.max(1, Math.ceil(numerator / Math.max(1, product.unitsPerCarton)));
}

function cartonCbm(product: Product): number {
  return (product.cartonLengthCm * product.cartonWidthCm * product.cartonHeightCm) / 1_000_000;
}

interface LineMetric {
  product: Product;
  quantity: number;
  cartons: number;
  cartonCbm: number;
  totalCbm: number;
  totalWeightKg: number;
  allowedLayers: number;
  floorStacks: number;
}

function lineMetrics(product: Product, quantity: number, c: ContainerTypeLite): LineMetric {
  const cartons = cartonCount(product, quantity);
  const physicalCbm = cartonCbm(product);
  const heightLayers = Math.max(1, Math.floor(c.internalHeightCm / product.cartonHeightCm));
  const allowedLayers =
    product.fragile || !product.stackable
      ? 1
      : Math.min(product.maxStackLayers, heightLayers);
  const floorStacks = Math.ceil(cartons / allowedLayers);
  return {
    product,
    quantity,
    cartons,
    cartonCbm: physicalCbm,
    totalCbm: physicalCbm * cartons,
    totalWeightKg: product.grossWeightKg * cartons,
    allowedLayers,
    floorStacks,
  };
}

// ===== 2D bin packing (Guillotine) =====

interface FreeRect { x: number; y: number; w: number; h: number; }
interface Placement {
  key: string;
  productId: string;
  sku: string;
  name: string;
  color: string;
  x: number; y: number; w: number; h: number;
  zCm: number;
  cartonHeightCm: number;
  stackHeightCm: number;
  xPct: number; yPct: number; wPct: number; hPct: number;
  zPct: number;
  heightPct: number;
  cartonCount: number;
  stackLayers: number;
  rotated: boolean;
  fragile: boolean;
}

function pruneRectangles(rects: FreeRect[]): FreeRect[] {
  const pruned: FreeRect[] = [];
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (r.w <= 0 || r.h <= 0) continue;
    let contained = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      const o = rects[j];
      if (
        r.x >= o.x && r.y >= o.y &&
        r.x + r.w <= o.x + o.w &&
        r.y + r.h <= o.y + o.h
      ) {
        contained = true;
        break;
      }
    }
    if (!contained) pruned.push(r);
  }
  return pruned;
}

function collisionPairs(placements: Placement[]): Array<[string, string]> {
  const collisions: Array<[string, string]> = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const overlapXY =
        !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
      const overlapZ =
        !(a.zCm + a.stackHeightCm <= b.zCm || b.zCm + b.stackHeightCm <= a.zCm);
      if (overlapXY && overlapZ) collisions.push([a.key, b.key]);
    }
  }
  return collisions;
}

function packLines(lines: Array<[Product, number]>, c: ContainerTypeLite) {
  const metrics = lines.map(([p, q]) => lineMetrics(p, q, c));
  const stackUnits: Array<{
    product: Product;
    quantity: number;
    cartonCount: number;
    stackIndex: number;
    length: number;
    width: number;
    cartonHeight: number;
    rotatable: boolean;
    area: number;
  }> = [];
  for (const m of metrics) {
    let remaining = m.cartons;
    for (let s = 0; s < m.floorStacks; s++) {
      const inStack = Math.min(m.allowedLayers, remaining);
      remaining -= inStack;
      stackUnits.push({
        product: m.product,
        quantity: m.quantity,
        cartonCount: inStack,
        stackIndex: s + 1,
        length: m.product.cartonLengthCm,
        width: m.product.cartonWidthCm,
        cartonHeight: m.product.cartonHeightCm,
        rotatable: m.product.rotatable,
        area: m.product.cartonLengthCm * m.product.cartonWidthCm,
      });
    }
  }
  stackUnits.sort((a, b) => (b.area - a.area) || (b.width - a.width) || (b.length - a.length));

  const containerLength = c.internalLengthCm;
  const containerWidth = c.internalWidthCm;
  let freeRects: FreeRect[] = [{ x: 0, y: 0, w: containerLength, h: containerWidth }];
  const placements: Placement[] = [];
  const unplaced: Array<{
    product: Product; quantity: number; cartonCount: number; stackIndex: number;
    length: number; width: number; cartonHeight: number; rotatable: boolean; area: number;
  }> = [];

  for (const unit of stackUnits) {
    const orientations: Array<[number, number, boolean]> = [[unit.length, unit.width, false]];
    if (unit.rotatable && unit.length !== unit.width) {
      orientations.push([unit.width, unit.length, true]);
    }
    interface Cand { waste: number; shortSide: number; y: number; x: number; idx: number; w: number; h: number; rot: boolean; }
    const candidates: Cand[] = [];
    for (let ri = 0; ri < freeRects.length; ri++) {
      const r = freeRects[ri];
      for (const [w, h, rot] of orientations) {
        if (w <= r.w && h <= r.h) {
          const waste = r.w * r.h - w * h;
          const shortSide = Math.min(r.w - w, r.h - h);
          candidates.push({ waste, shortSide, y: r.y, x: r.x, idx: ri, w, h, rot });
        }
      }
    }
    if (candidates.length === 0) {
      unplaced.push(unit);
      continue;
    }
    candidates.sort((a, b) => (a.waste - b.waste) || (a.shortSide - b.shortSide) || (a.y - b.y) || (a.x - b.x));
    const best = candidates[0];
    const rect = freeRects.splice(best.idx, 1)[0];
    const stackHeight = unit.cartonHeight * unit.cartonCount;
    placements.push({
      key: `${unit.product.id}-${unit.stackIndex}`,
      productId: unit.product.id,
      sku: unit.product.sku,
      name: unit.product.name,
      color: productColor(unit.product),
      x: rect.x, y: rect.y, w: best.w, h: best.h,
      zCm: 0,
      cartonHeightCm: unit.cartonHeight,
      stackHeightCm: stackHeight,
      xPct: round4((rect.x / containerLength) * 100),
      yPct: round4((rect.y / containerWidth) * 100),
      wPct: round4((best.w / containerLength) * 100),
      hPct: round4((best.h / containerWidth) * 100),
      zPct: 0,
      heightPct: round4((stackHeight / c.internalHeightCm) * 100),
      cartonCount: unit.cartonCount,
      stackLayers: unit.cartonCount,
      rotated: best.rot,
      fragile: unit.product.fragile,
    });
    freeRects.push(
      { x: rect.x + best.w, y: rect.y, w: rect.w - best.w, h: best.h },
      { x: rect.x, y: rect.y + best.h, w: rect.w, h: rect.h - best.h },
    );
    freeRects = pruneRectangles(freeRects);
  }

  const unplacedByProduct = new Map<string, { productId: string; sku: string; name: string; cartons: number }>();
  for (const unit of unplaced) {
    const existing = unplacedByProduct.get(unit.product.id);
    if (existing) existing.cartons += unit.cartonCount;
    else unplacedByProduct.set(unit.product.id, {
      productId: unit.product.id, sku: unit.product.sku, name: unit.product.name, cartons: unit.cartonCount,
    });
  }

  const maxStackHeight = placements.length === 0 ? 0 : Math.max(...placements.map((p) => p.stackHeightCm));
  return {
    metrics,
    placements,
    unplaced: Array.from(unplacedByProduct.values()),
    collisions: collisionPairs(placements),
    floorUtilization: round1((placements.reduce((s, p) => s + p.w * p.h, 0) / (containerLength * containerWidth)) * 100),
    heightUtilization: round1((maxStackHeight / c.internalHeightCm) * 100),
    maxStackHeightCm: round1(maxStackHeight),
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }

// ===== Service fee (tiered) =====

export async function serviceFeeForLines(lines: Array<[Product, number]>) {
  const tiers = await prisma.serviceFeeTier.findMany({
    where: { active: true },
    orderBy: { minProductValue: 'asc' },
  });
  let total = 0;
  let fee = 0;
  const breakdown: Array<{
    sku: string; name: string; rate: string;
    lineValue: string; fee: string; tier: string;
  }> = [];
  for (const [product, quantity] of lines) {
    const lineTotal = product.fobPrice * quantity;
    const tier = tiers.find((t) => {
      if (product.fobPrice < t.minProductValue) return false;
      if (t.maxProductValue != null && product.fobPrice > t.maxProductValue) return false;
      return true;
    });
    const rate = tier ? tier.rate : 7.0;  // fallback to v1.0 7%
    const lineFee = Number(((lineTotal * rate) / 100).toFixed(2));
    total += lineTotal;
    fee += lineFee;
    breakdown.push({
      sku: product.sku, name: product.name,
      rate: decimalString(rate),
      lineValue: decimalString(lineTotal),
      fee: decimalString(lineFee),
      tier: tier ? tier.name : 'Default',
    });
  }
  const effectiveRate = total > 0 ? Number(((fee / total) * 100).toFixed(2)) : 0;
  return { total, fee, effectiveRate, breakdown };
}

// ===== Main analyze function =====

export interface AnalyzeInput {
  productId: string;
  quantity: number;
}

export interface AnalyzeOutput {
  container: ReturnType<typeof serializeContainer>;
  total: string;
  totalQuantity: number;
  totalCartons: number;
  totalCbm: string;
  remainingCbm: string;
  totalWeightKg: string;
  remainingPayloadKg: string;
  volumePercent: number;
  payloadPercent: number;
  floorUtilization: number;
  heightUtilization: number;
  maxStackHeightCm: number;
  placements: Placement[];
  unplaced: Array<{ productId: string; sku: string; name: string; cartons: number }>;
  collisions: Array<[string, string]>;
  warnings: Array<{ level: 'error' | 'warning' | 'info'; code: string; message: string }>;
  serviceFeeRate: string;
  serviceFee: string;
  serviceFeeNote: string;
  serviceFeeBreakdown: Array<{ sku: string; name: string; rate: string; lineValue: string; fee: string; tier: string }>;
  overboxThreshold: number;
  overboxCount: number;
  overboxRate: string;
  overboxFee: string;
  grandTotal: string;
  lineMetrics: Record<string, { cartons: number; cartonCbm: string; totalCbm: string; totalWeightKg: string; stackLayers: number; floorStacks: number }>;
}

export async function getActiveContainerTypes() {
  return prisma.containerType.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { nominalCbm: 'asc' }],
  });
}

export async function getContainerType(code = '40HQ'): Promise<ContainerTypeLite | null> {
  const all = await getActiveContainerTypes();
  return (
    all.find((c) => c.code === code) ??
    all.find((c) => c.code === '40HQ') ??
    all[0] ??
    null
  );
}

export async function analyzeLines(
  inputs: AnalyzeInput[],
  containerCode = '40HQ'
): Promise<AnalyzeOutput | null> {
  const container = await getContainerType(containerCode);
  if (!container) return null;

  // Resolve product IDs to Product
  const products = await prisma.product.findMany({
    where: { id: { in: inputs.map((i) => i.productId) }, active: true },
  });
  const lines: Array<[Product, number]> = inputs
    .map((i) => [products.find((p) => p.id === i.productId), i.quantity] as const)
    .filter(([p]) => p != null) as Array<[Product, number]>;
  if (lines.length === 0) return null;

  const packed = packLines(lines, container);
  const sf = await serviceFeeForLines(lines);
  const totalQuantity = lines.reduce((s, [, q]) => s + q, 0);
  const totalCartons = packed.metrics.reduce((s, m) => s + m.cartons, 0);
  const totalCbm = packed.metrics.reduce((s, m) => s + m.totalCbm, 0);
  const totalWeight = packed.metrics.reduce((s, m) => s + m.totalWeightKg, 0);
  const usable = usableCbm(container);
  const volumePercent = usable > 0 ? (totalCbm / usable) * 100 : 0;
  const payloadPercent = container.maxPayloadKg > 0 ? (totalWeight / container.maxPayloadKg) * 100 : 0;

  // Overbox rule
  const rule = await prisma.overboxRule.findFirst({ where: { active: true }, orderBy: { id: 'asc' } });
  const threshold = rule?.threshold ?? 300;
  const overboxRate = rule?.feePerCarton ?? 2.0;
  const excessCartons = Math.max(0, totalCartons - threshold);
  const overboxFee = Number((excessCartons * overboxRate).toFixed(2));

  // Warnings
  const warnings: AnalyzeOutput['warnings'] = [];
  if (packed.unplaced.length > 0) {
    const total = packed.unplaced.reduce((s, u) => s + u.cartons, 0);
    warnings.push({ level: 'error', code: 'unplaced', message: `${total} cartons do not fit this container footprint.` });
  }
  if (totalCbm > usable) warnings.push({ level: 'error', code: 'volume', message: 'Estimated packed volume exceeds the configured safe usable capacity.' });
  if (totalWeight > container.maxPayloadKg) warnings.push({ level: 'error', code: 'payload', message: 'Estimated gross weight exceeds the container payload limit.' });
  if (excessCartons > 0) warnings.push({ level: 'warning', code: 'overbox', message: `${excessCartons} cartons exceed the ${threshold}-carton handling threshold.` });
  if (packed.collisions.length > 0) warnings.push({ level: 'error', code: 'collision', message: 'A placement collision was detected and requires manual review.' });

  // Line metrics lookup
  const lineMetrics: AnalyzeOutput['lineMetrics'] = {};
  for (const m of packed.metrics) {
    lineMetrics[m.product.id] = {
      cartons: m.cartons,
      cartonCbm: decimalString(m.cartonCbm, 3),
      totalCbm: decimalString(m.totalCbm, 3),
      totalWeightKg: decimalString(m.totalWeightKg),
      stackLayers: m.allowedLayers,
      floorStacks: m.floorStacks,
    };
  }

  return {
    container: serializeContainer(container),
    total: decimalString(sf.total),
    totalQuantity,
    totalCartons,
    totalCbm: decimalString(totalCbm, 3),
    remainingCbm: decimalString(Math.max(0, usable - totalCbm), 3),
    totalWeightKg: decimalString(totalWeight),
    remainingPayloadKg: decimalString(Math.max(0, container.maxPayloadKg - totalWeight)),
    volumePercent: round1(volumePercent),
    payloadPercent: round1(payloadPercent),
    floorUtilization: packed.floorUtilization,
    heightUtilization: packed.heightUtilization,
    maxStackHeightCm: packed.maxStackHeightCm,
    placements: packed.placements,
    unplaced: packed.unplaced,
    collisions: packed.collisions,
    warnings,
    serviceFeeRate: decimalString(sf.effectiveRate),
    serviceFee: decimalString(sf.fee),
    serviceFeeNote: 'Calculated per SKU using the active FOB price tiers.',
    serviceFeeBreakdown: sf.breakdown,
    overboxThreshold: threshold,
    overboxCount: excessCartons,
    overboxRate: decimalString(overboxRate),
    overboxFee: decimalString(overboxFee),
    grandTotal: decimalString(sf.total + sf.fee + overboxFee),
    lineMetrics,
  };
}

export async function recommendContainer(inputs: AnalyzeInput[]): Promise<string> {
  const containers = await getActiveContainerTypes();
  if (containers.length === 0) return '40HQ';
  const products = await prisma.product.findMany({
    where: { id: { in: inputs.map((i) => i.productId) }, active: true },
  });
  const lines: Array<[Product, number]> = inputs
    .map((i) => [products.find((p) => p.id === i.productId), i.quantity] as const)
    .filter(([p]) => p != null) as Array<[Product, number]>;
  if (lines.length === 0) return '40HQ';

  let fallback: string | null = null;
  for (const c of containers) {
    fallback ??= c.code;
    const packed = packLines(lines, c);
    const totalCbm = packed.metrics.reduce((s, m) => s + m.totalCbm, 0);
    const totalWeight = packed.metrics.reduce((s, m) => s + m.totalWeightKg, 0);
    if (packed.unplaced.length === 0 && totalCbm <= usableCbm(c) && totalWeight <= c.maxPayloadKg) {
      return c.code;
    }
  }
  return fallback ?? '40HQ';
}

export async function fillerSuggestions(inputs: AnalyzeInput[], containerCode: string, limit = 5) {
  if (inputs.length === 0) return [];
  const selectedIds = inputs.map((i) => i.productId);
  const candidates = await prisma.product.findMany({
    where: { active: true, id: { notIn: selectedIds } },
    orderBy: [{ cartonCbm: 'asc' }, { name: 'asc' }],
    take: 40,
  });
  const suggestions: Array<{
    productId: string; sku: string; name: string; slug: string | null;
    categorySlug: string; imageUrl: string | null; suggestedQty: number;
    addedCartons: number; addedCbm: string; remainingCbmAfter: string; reason: string;
  }> = [];
  for (const candidate of candidates) {
    const trial = await analyzeLines(
      [...inputs, { productId: candidate.id, quantity: candidate.moq }],
      containerCode
    );
    if (!trial || trial.unplaced.length > 0) continue;
    const hasBlockingWarning = trial.warnings.some((w) => ['volume', 'payload', 'collision'].includes(w.code) && w.level === 'error');
    if (hasBlockingWarning) continue;
    const addedCartons = cartonCount(candidate, candidate.moq);
    const addedCbm = cartonCbm(candidate) * addedCartons;
    suggestions.push({
      productId: candidate.id, sku: candidate.sku, name: candidate.name, slug: candidate.slug,
      categorySlug: candidate.categoryId,
      imageUrl: candidate.imageUrl ?? null,
      suggestedQty: candidate.moq,
      addedCartons,
      addedCbm: decimalString(addedCbm, 3),
      remainingCbmAfter: trial.remainingCbm,
      reason: `Adds ${addedCartons} cartons while staying within the estimated loading envelope.`,
    });
  }
  suggestions.sort((a, b) => parseFloat(a.remainingCbmAfter) - parseFloat(b.remainingCbmAfter));
  return suggestions.slice(0, limit);
}

// ===== Commerce settings (single API call) =====

export async function getCommerceSettings() {
  const [tiers, rule, containers] = await Promise.all([
    prisma.serviceFeeTier.findMany({ where: { active: true }, orderBy: { minProductValue: 'asc' } }),
    prisma.overboxRule.findFirst({ where: { active: true }, orderBy: { id: 'asc' } }),
    getActiveContainerTypes(),
  ]);
  return {
    currency: 'USD',
    priceTerm: 'FOB',
    moq: 5,
    serviceFeeTiers: tiers.map((t) => ({
      name: t.name,
      min: decimalString(t.minProductValue),
      max: t.maxProductValue != null ? decimalString(t.maxProductValue) : null,
      rate: decimalString(t.rate),
      note: t.note ?? '',
    })),
    containerTypes: containers.map(serializeContainer),
    overbox: {
      threshold: rule?.threshold ?? 300,
      feePerCarton: decimalString(rule?.feePerCarton ?? 2.0),
    },
  };
}
