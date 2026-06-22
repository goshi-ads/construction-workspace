import type {
  CaseRow,
  DeadlineMark,
  ProcedureStep,
  ProcedureItem,
} from "@/lib/workspace-model";

// ─── API レスポンス型（DB スキーマに準じる）───────────────────────

export type ApiCase = {
  id: string;
  name: string;
  mainAssignee: string;
  subAssignee: string;
  plannedStepId: string;
  plannedProgressPct: number | null;
  defaultCurrentStepId: string;
};

export type ApiProcedureItem = {
  id: string;
  stepId: string;
  parentId: string | null;
  label: string;
  order: number;
};

export type ApiProcedureStep = {
  id: string;
  title: string;
  icon: string;
  order: number;
  items: ApiProcedureItem[];
};

export type ApiDeadlineMark = {
  id: string;
  caseId: string;
  at: string;
  dateOnly: boolean;
  title: string;
  assignee: string;
  nextAction: string;
  urgency: "normal" | "soon" | "urgent" | "overdue";
  kind: "deadline" | "meeting" | "delivery" | "site";
  linkedStepId: string | null;
};

export type ApiAnnualProject = {
  id: string;
  cardId: string;
  label: string;
  completed: boolean;
  caseLabel: string | null;
  order: number;
};

export type ApiAnnualCard = {
  id: string;
  period: string | null;
  label: string | null;
  order: number;
  projects: ApiAnnualProject[];
};

export type InitData = {
  cases: ApiCase[];
  marks: ApiDeadlineMark[];
  steps: ApiProcedureStep[];
  checksByCase: Record<string, Record<string, boolean>>;
  currentStepByCase: Record<string, string>;
};

// ─── DB フラット構造 → ワークスペースモデルのネスト構造 へ変換 ──

export function toCase(api: ApiCase): CaseRow {
  return {
    id: api.id,
    name: api.name,
    defaultCurrentStepId: api.defaultCurrentStepId,
    plannedStepId: api.plannedStepId,
    plannedProgressPct: api.plannedProgressPct ?? undefined,
    assignees: { main: api.mainAssignee, sub: api.subAssignee },
  };
}

export function toDeadlineMark(api: ApiDeadlineMark): DeadlineMark {
  return { ...api, linkedStepId: api.linkedStepId ?? undefined };
}

function buildItemTree(
  items: ApiProcedureItem[],
  parentId: string | null = null
): ProcedureItem[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const children = buildItemTree(items, item.id);
      return {
        id: item.id,
        label: item.label,
        ...(children.length > 0 ? { children } : {}),
      };
    });
}

export function toProcedureStep(api: ApiProcedureStep): ProcedureStep {
  return {
    id: api.id,
    title: api.title,
    icon: api.icon as ProcedureStep["icon"],
    items: buildItemTree(api.items),
  };
}
