import type { TZDate } from "@date-fns/tz";
import { addDaysOrg } from "@/lib/org-calendar";

export type Urgency = "normal" | "soon" | "urgent" | "overdue";
export type MarkKind = "deadline" | "meeting" | "delivery" | "site";

export type ProcedureStepIcon =
  | "FileText"
  | "MapPin"
  | "Stamp"
  | "Layers"
  | "HardHat"
  | "ClipboardCheck";

export type ProcedureItem = {
  id: string;
  label: string;
  children?: ProcedureItem[];
};

export type ProcedureStep = {
  id: string;
  title: string;
  icon: ProcedureStepIcon;
  items: ProcedureItem[];
};

export type CaseRow = {
  id: string;
  name: string;
  /** モック初期の現在ステップ */
  defaultCurrentStepId: string;
  /** 現時点のスケジュール上あるべきステップ */
  plannedStepId: string;
  /** 進捗バーの予定ライン（0-100%）。未指定時は plannedStepId から自動計算 */
  plannedProgressPct?: number;
  /** 担当者 */
  assignees: { main: string; sub: string };
};

export function formatPhaseLabel(stepId: string): string {
  const n = stepId.replace("step-", "");
  return `→ ステップ${n}`;
}

export type DeadlineMark = {
  id: string;
  caseId: string;
  /** ISO 8601（日付のみは T00:00:00+09:00 などフルの日単位） */
  at: string;
  dateOnly: boolean;
  title: string;
  assignee: string;
  nextAction: string;
  urgency: Urgency;
  kind: MarkKind;
  linkedStepId?: string;
};

export const PROCEDURE_STEPS: ProcedureStep[] = [
  {
    id: "step-1",
    title: "ステップ1. 設備要求仕様書作成",
    icon: "FileText",
    items: [
      { id: "step-1-item-1", label: "要求事項のすり合わせ" },
      { id: "step-1-item-2", label: "現地確認作業" },
      { id: "step-1-item-3", label: "紙に文章や画像図を書き出し" },
      {
        id: "step-1-item-4",
        label: "クリーンコピーを設備要求仕様書フォーマットへ",
      },
      {
        id: "step-1-item-5",
        label: "見積依頼（設備要求仕様書を社内ポータルへアップロード）",
      },
    ],
  },
  {
    id: "step-2",
    title: "ステップ2. 工事業者と現場確認",
    icon: "MapPin",
    items: [
      { id: "step-2-item-1", label: "現地確認日程の調整" },
      {
        id: "step-2-item-2",
        label: "工事業者と現地で詳細仕様のすり合わせ",
      },
      {
        id: "step-2-item-3",
        label: "すり合わせ内容の記録と関係者への共有",
      },
      { id: "step-2-item-4", label: "見積取得" },
      {
        id: "step-2-item-5",
        label:
          "見積内容の確認（仕様通りか、小計・合計金額は正しいか、見積有効期限は何日か）",
      },
    ],
  },
  {
    id: "step-3",
    title: "ステップ3. 稟議関連（資料作成～発注）",
    icon: "Stamp",
    items: [
      { id: "step-3-item-1", label: "稟議説明資料の作成" },
      { id: "step-3-item-2", label: "稟議項目の確認" },
      { id: "step-3-item-3", label: "必要に応じて決裁者への事前説明" },
      { id: "step-3-item-4", label: "稟議ドラフト" },
      { id: "step-3-item-5", label: "購買依頼の作成" },
      { id: "step-3-item-6", label: "発注" },
    ],
  },
  {
    id: "step-4",
    title: "ステップ4. 承認図面の返却",
    icon: "Layers",
    items: [
      {
        id: "step-4-item-1",
        label:
          "承認図面の返却（機械・電気図面などの図面内容を確認し返却）",
      },
    ],
  },
  {
    id: "step-5",
    title: "ステップ5. 工事",
    icon: "HardHat",
    items: [
      {
        id: "step-5-item-1",
        label: "以下の書類を少なくとも2週間前に取得",
        children: [
          {
            id: "step-5-item-1a",
            label: "道路規制／作業区域規制申請書",
          },
          { id: "step-5-item-1b", label: "屋内火気使用申請" },
          { id: "step-5-item-1c", label: "試運転チェックリスト" },
        ],
      },
      { id: "step-5-item-2", label: "現地確認サポート" },
    ],
  },
  {
    id: "step-6",
    title: "ステップ6. 工事完了後の対応",
    icon: "ClipboardCheck",
    items: [
      { id: "step-6-item-1", label: "工事完成図の取得" },
      {
        id: "step-6-item-2",
        label:
          "工事完了申請（工事完了報告書／検査票／運転開始報告書／固定資産取得報告書）",
      },
      { id: "step-6-item-3", label: "工事後試運転での不具合洗い出し" },
    ],
  },
];

export const CASES: CaseRow[] = [
  {
    id: "c-a",
    name: "案件A",
    defaultCurrentStepId: "step-2",
    plannedStepId: "step-3",
    plannedProgressPct: 50,
    assignees: { main: "佐藤", sub: "鈴木" },
  },
  {
    id: "c-b",
    name: "案件B",
    defaultCurrentStepId: "step-4",
    plannedStepId: "step-4",
    plannedProgressPct: 36,
    assignees: { main: "田中", sub: "山田" },
  },
  {
    id: "c-c",
    name: "案件C",
    defaultCurrentStepId: "step-5",
    plannedStepId: "step-5",
    plannedProgressPct: 75,
    assignees: { main: "鈴木", sub: "佐藤" },
  },
  {
    id: "c-d",
    name: "案件D",
    defaultCurrentStepId: "step-3",
    plannedStepId: "step-3",
    plannedProgressPct: 50,
    assignees: { main: "高橋", sub: "田中" },
  },
];

function atDay(base: TZDate, offsetDays: number, h = 12, m = 0) {
  const d = addDaysOrg(base, offsetDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function atDateOnly(base: TZDate, offsetDays: number) {
  const d = addDaysOrg(base, offsetDays);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** アンカー週の月曜を基準に、モック期限を生成（常に「今」周辺で意味が通る） */
export function buildMarks(mondayThisWeek: TZDate): DeadlineMark[] {
  const m = mondayThisWeek;
  return [
    {
      id: "m-1",
      caseId: "c-a",
      at: atDay(m, 1, 14, 0),
      dateOnly: false,
      title: "現地確認（業者同席）",
      assignee: "佐藤",
      nextAction: "図面確定と議事メモ共有",
      urgency: "urgent",
      kind: "meeting",
      linkedStepId: "step-2",
    },
    {
      id: "m-2",
      caseId: "c-a",
      at: atDateOnly(m, 2),
      dateOnly: true,
      title: "見積比較表ドラフト",
      assignee: "佐藤",
      nextAction: "比較軸の承認依頼",
      urgency: "soon",
      kind: "deadline",
      linkedStepId: "step-2",
    },
    {
      id: "m-3",
      caseId: "c-b",
      at: atDay(m, 1, 10, 30),
      dateOnly: false,
      title: "発注稟議提出",
      assignee: "田中",
      nextAction: "稟議番号の取得",
      urgency: "urgent",
      kind: "deadline",
      linkedStepId: "step-4",
    },
    {
      id: "m-4",
      caseId: "c-b",
      at: atDay(m, 1, 16, 0),
      dateOnly: false,
      title: "現場立会（配管）",
      assignee: "田中",
      nextAction: "立会チェックリスト回収",
      urgency: "normal",
      kind: "site",
      linkedStepId: "step-4",
    },
    {
      id: "m-5",
      caseId: "c-c",
      at: atDateOnly(m, 3),
      dateOnly: true,
      title: "搬入スロット確定",
      assignee: "鈴木",
      nextAction: "ゲート申請",
      urgency: "normal",
      kind: "delivery",
      linkedStepId: "step-5",
    },
    {
      id: "m-6",
      caseId: "c-c",
      at: atDateOnly(m, 8),
      dateOnly: true,
      title: "検査予定",
      assignee: "鈴木",
      nextAction: "不備リストの事前確認",
      urgency: "soon",
      kind: "meeting",
      linkedStepId: "step-5",
    },
    {
      id: "m-7",
      caseId: "c-d",
      at: atDateOnly(m, 5),
      dateOnly: true,
      title: "設計レビュー",
      assignee: "高橋",
      nextAction: "コメント反映",
      urgency: "normal",
      kind: "meeting",
      linkedStepId: "step-3",
    },
    {
      id: "m-8",
      caseId: "c-d",
      at: atDay(m, 12, 9, 0),
      dateOnly: false,
      title: "承認書ドラフト提出",
      assignee: "高橋",
      nextAction: "法務レビュー依頼",
      urgency: "soon",
      kind: "deadline",
      linkedStepId: "step-3",
    },
    {
      id: "m-9",
      caseId: "c-a",
      at: atDateOnly(m, 20),
      dateOnly: true,
      title: "発注決裁期限",
      assignee: "佐藤",
      nextAction: "決裁者へ最終説明",
      urgency: "normal",
      kind: "deadline",
      linkedStepId: "step-4",
    },
    {
      id: "m-10",
      caseId: "c-b",
      at: atDateOnly(m, 3),
      dateOnly: true,
      title: "安全書類期限（超過扱いデモ）",
      assignee: "田中",
      nextAction: "再提出",
      urgency: "overdue",
      kind: "deadline",
      linkedStepId: "step-5",
    },
  ];
}

export type AnnualScheduleProject = {
  label: string;
  /** true = 完了済み（文字色グレー）、false = 未完了（文字色やや濃い） */
  completed: boolean;
  /** pane3/4 案件との対応ラベル（例: "案件A"） */
  caseLabel?: string;
};

export type AnnualScheduleCard = {
  id: string;
  /** カード上部の見出し（時期）。ない場合は label を見出しに使う */
  period?: string;
  /** period がないカード用の見出し */
  label?: string;
  /** 「・」で示す工事・月の一覧 */
  projects: AnnualScheduleProject[];
};

export const ANNUAL_SCHEDULE_CARDS: AnnualScheduleCard[] = [
  {
    id: "annual-feb",
    period: "2月末（半期棚卸し）",
    projects: [
      { label: "設備A新規導入工事_P株式会社様_新規固定資産_3月検収/3月償却開始", completed: true },
      { label: "設備B改造工事_株式会社Q様_既存固定資産の改造_2月検収/3月償却開始", completed: true },
    ],
  },
  {
    id: "annual-may",
    period: "5月（GW）",
    projects: [
      { label: "電気設備更新工事_R株式会社様_修繕費_5月検収", completed: true },
      { label: "システム制御更新工事_有限会社S様_修繕費_5月検収", completed: true },
    ],
  },
  {
    id: "annual-aug",
    period: "8月（お盆 / 月末 半期棚卸し）",
    projects: [
      { label: "設備C新規導入工事_株式会社T様_新規固定資産_9月検収/9月償却開始", completed: false, caseLabel: "案件A" },
      { label: "設備D改造工事_株式会社U様_既存固定資産の改造_8月検収/9月償却開始", completed: false, caseLabel: "案件B" },
      { label: "空調機更新工事_X株式会社様_修繕_8月検収", completed: false, caseLabel: "案件C" },
      { label: "床塗装工事_Y株式会社様_新規固定資産_9月検収/9月償却開始", completed: false, caseLabel: "案件D" },
    ],
  },
  {
    id: "annual-yearend",
    period: "年末年始",
    projects: [
      { label: "設備E新規導入工事_株式会社T様_新規固定資産_1月検収/1月償却開始", completed: false },
    ],
  },
  {
    id: "annual-other",
    label: "その他の時期",
    projects: [
      { label: "3月_設備F改造工事_株式会社U様_既存固定資産の改造_3月検収/3月償却開始", completed: true },
      { label: "4月", completed: true },
      { label: "6月", completed: false },
      { label: "7月", completed: false },
      { label: "9月", completed: false },
      { label: "10月", completed: false },
      { label: "11月", completed: false },
    ],
  },
];
