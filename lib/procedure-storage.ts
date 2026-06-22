const CHECKS_PREFIX = "procedure-checks:";
const CURRENT_STEP_PREFIX = "procedure-current-step:";

export type CheckState = Record<string, boolean>;

function checksKey(caseId: string) {
  return `${CHECKS_PREFIX}${caseId}`;
}

function currentStepKey(caseId: string) {
  return `${CURRENT_STEP_PREFIX}${caseId}`;
}

export function loadChecks(caseId: string): CheckState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(checksKey(caseId));
    if (!raw) return {};
    return JSON.parse(raw) as CheckState;
  } catch {
    return {};
  }
}

export function saveCheck(
  caseId: string,
  itemId: string,
  checked: boolean
): CheckState {
  const prev = loadChecks(caseId);
  const next = { ...prev, [itemId]: checked };
  if (typeof window !== "undefined") {
    localStorage.setItem(checksKey(caseId), JSON.stringify(next));
  }
  return next;
}

export function loadCurrentStepId(
  caseId: string,
  fallback: string
): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(currentStepKey(caseId)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveCurrentStepId(caseId: string, stepId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(currentStepKey(caseId), stepId);
}

export function loadAllCurrentStepIds(
  defaults: Record<string, string>
): Record<string, string> {
  if (typeof window === "undefined") return defaults;
  const out = { ...defaults };
  for (const caseId of Object.keys(defaults)) {
    out[caseId] = loadCurrentStepId(caseId, defaults[caseId]!);
  }
  return out;
}

export function loadAllCasesChecks(
  caseIds: string[]
): Record<string, CheckState> {
  return Object.fromEntries(caseIds.map((id) => [id, loadChecks(id)]));
}

const DEMO_SEED_KEY = "procedure-demo-seeded-v1";

/**
 * デモ用チェックデータを localStorage に一度だけ書き込む。
 * 既にユーザーが編集済みの場合は上書きしない（seed済みフラグで管理）。
 */
export function seedDemoChecks(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(DEMO_SEED_KEY)) return;

  const demoChecks: Record<string, CheckState> = {
    // 案件A：ステップ自体が遅れ（current=step-2, planned=step-3）→ 赤
    // step-1全5 + step-2の2 = 7/24 = 29%
    "c-a": {
      "step-1-item-1": true,
      "step-1-item-2": true,
      "step-1-item-3": true,
      "step-1-item-4": true,
      "step-1-item-5": true,
      "step-2-item-1": true,
      "step-2-item-2": true,
    },
    // 案件B：同ステップだがチェック率が低い → 黄
    // step-1全5 + step-2の2 = 7/24 = 29%（expectedは17/24=71%）
    "c-b": {
      "step-1-item-1": true,
      "step-1-item-2": true,
      "step-1-item-3": true,
      "step-1-item-4": true,
      "step-1-item-5": true,
      "step-2-item-1": true,
      "step-2-item-2": true,
    },
    // 案件C：順調 → 青
    // step-1〜4全部 + step-5の2 = 19/24 = 79%（expectedは21/24=88%）
    "c-c": {
      "step-1-item-1": true,
      "step-1-item-2": true,
      "step-1-item-3": true,
      "step-1-item-4": true,
      "step-1-item-5": true,
      "step-2-item-1": true,
      "step-2-item-2": true,
      "step-2-item-3": true,
      "step-2-item-4": true,
      "step-2-item-5": true,
      "step-3-item-1": true,
      "step-3-item-2": true,
      "step-3-item-3": true,
      "step-3-item-4": true,
      "step-3-item-5": true,
      "step-3-item-6": true,
      "step-4-item-1": true,
      "step-5-item-1a": true,
      "step-5-item-1b": true,
    },
    // 案件D：順調 → 青
    // step-1全5 + step-2全5 + step-3の2 = 12/24 = 50%（expectedは16/24=67%）
    "c-d": {
      "step-1-item-1": true,
      "step-1-item-2": true,
      "step-1-item-3": true,
      "step-1-item-4": true,
      "step-1-item-5": true,
      "step-2-item-1": true,
      "step-2-item-2": true,
      "step-2-item-3": true,
      "step-2-item-4": true,
      "step-2-item-5": true,
      "step-3-item-1": true,
      "step-3-item-2": true,
    },
  };

  for (const [caseId, checks] of Object.entries(demoChecks)) {
    localStorage.setItem(checksKey(caseId), JSON.stringify(checks));
  }
  localStorage.setItem(DEMO_SEED_KEY, "1");
}
