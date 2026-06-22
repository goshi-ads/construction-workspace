import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

// ────────────────────────────────────────────────
// 月曜起点の週計算（Asia/Tokyo 簡易版）
// ────────────────────────────────────────────────
function mondayOfCurrentWeekJST(): Date {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function atDay(base: Date, offsetDays: number, h = 12, m = 0): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function atDateOnly(base: Date, offsetDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log("Seeding database...");

  // ────────────────────────────────────────────────
  // 案件マスタ
  // ────────────────────────────────────────────────
  const cases = [
    {
      id: "c-a",
      name: "案件A",
      defaultCurrentStepId: "step-2",
      plannedStepId: "step-3",
      plannedProgressPct: 50,
      mainAssignee: "佐藤",
      subAssignee: "鈴木",
    },
    {
      id: "c-b",
      name: "案件B",
      defaultCurrentStepId: "step-4",
      plannedStepId: "step-4",
      plannedProgressPct: 36,
      mainAssignee: "田中",
      subAssignee: "山田",
    },
    {
      id: "c-c",
      name: "案件C",
      defaultCurrentStepId: "step-5",
      plannedStepId: "step-5",
      plannedProgressPct: 75,
      mainAssignee: "鈴木",
      subAssignee: "佐藤",
    },
    {
      id: "c-d",
      name: "案件D",
      defaultCurrentStepId: "step-3",
      plannedStepId: "step-3",
      plannedProgressPct: 50,
      mainAssignee: "高橋",
      subAssignee: "田中",
    },
  ];

  for (const c of cases) {
    await prisma.case.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  console.log(`✓ cases (${cases.length})`);

  // ────────────────────────────────────────────────
  // 初期ステップ進捗（defaultCurrentStepId を初期値として登録）
  // ────────────────────────────────────────────────
  for (const c of cases) {
    await prisma.caseProgress.upsert({
      where: { caseId: c.id },
      update: { currentStepId: c.defaultCurrentStepId },
      create: { caseId: c.id, currentStepId: c.defaultCurrentStepId },
    });
  }
  console.log(`✓ case_progress (${cases.length})`);

  // ────────────────────────────────────────────────
  // 手順ステップ & チェックリスト項目
  // ────────────────────────────────────────────────
  const steps = [
    {
      id: "step-1",
      title: "ステップ1. 設備要求仕様書作成",
      icon: "FileText",
      order: 1,
      items: [
        { id: "step-1-item-1", label: "要求事項のすり合わせ", order: 1 },
        { id: "step-1-item-2", label: "現地確認作業", order: 2 },
        { id: "step-1-item-3", label: "紙に文章や画像図を書き出し", order: 3 },
        { id: "step-1-item-4", label: "クリーンコピーを設備要求仕様書フォーマットへ", order: 4 },
        { id: "step-1-item-5", label: "見積依頼（設備要求仕様書を社内ポータルへアップロード）", order: 5 },
      ],
    },
    {
      id: "step-2",
      title: "ステップ2. 工事業者と現場確認",
      icon: "MapPin",
      order: 2,
      items: [
        { id: "step-2-item-1", label: "現地確認日程の調整", order: 1 },
        { id: "step-2-item-2", label: "工事業者と現地で詳細仕様のすり合わせ", order: 2 },
        { id: "step-2-item-3", label: "すり合わせ内容の記録と関係者への共有", order: 3 },
        { id: "step-2-item-4", label: "見積取得", order: 4 },
        {
          id: "step-2-item-5",
          label: "見積内容の確認（仕様通りか、小計・合計金額は正しいか、見積有効期限は何日か）",
          order: 5,
        },
      ],
    },
    {
      id: "step-3",
      title: "ステップ3. 稟議関連（資料作成～発注）",
      icon: "Stamp",
      order: 3,
      items: [
        { id: "step-3-item-1", label: "稟議説明資料の作成", order: 1 },
        { id: "step-3-item-2", label: "稟議項目の確認", order: 2 },
        { id: "step-3-item-3", label: "必要に応じて決裁者への事前説明", order: 3 },
        { id: "step-3-item-4", label: "稟議ドラフト", order: 4 },
        { id: "step-3-item-5", label: "購買依頼の作成", order: 5 },
        { id: "step-3-item-6", label: "発注", order: 6 },
      ],
    },
    {
      id: "step-4",
      title: "ステップ4. 承認図面の返却",
      icon: "Layers",
      order: 4,
      items: [
        {
          id: "step-4-item-1",
          label: "承認図面の返却（機械・電気図面などの図面内容を確認し返却）",
          order: 1,
        },
      ],
    },
    {
      id: "step-5",
      title: "ステップ5. 工事",
      icon: "HardHat",
      order: 5,
      items: [
        {
          id: "step-5-item-1",
          label: "以下の書類を少なくとも2週間前に取得",
          order: 1,
          children: [
            { id: "step-5-item-1a", label: "道路規制／作業区域規制申請書", order: 1 },
            { id: "step-5-item-1b", label: "屋内火気使用申請", order: 2 },
            { id: "step-5-item-1c", label: "試運転チェックリスト", order: 3 },
          ],
        },
        { id: "step-5-item-2", label: "現地確認サポート", order: 2 },
      ],
    },
    {
      id: "step-6",
      title: "ステップ6. 工事完了後の対応",
      icon: "ClipboardCheck",
      order: 6,
      items: [
        { id: "step-6-item-1", label: "工事完成図の取得", order: 1 },
        {
          id: "step-6-item-2",
          label: "工事完了申請（工事完了報告書／検査票／運転開始報告書／固定資産取得報告書）",
          order: 2,
        },
        { id: "step-6-item-3", label: "工事後試運転での不具合洗い出し", order: 3 },
      ],
    },
  ];

  for (const step of steps) {
    await prisma.procedureStep.upsert({
      where: { id: step.id },
      update: { title: step.title, icon: step.icon, order: step.order },
      create: { id: step.id, title: step.title, icon: step.icon, order: step.order },
    });

    for (const item of step.items) {
      await prisma.procedureItem.upsert({
        where: { id: item.id },
        update: { label: item.label, stepId: step.id, parentId: null, order: item.order },
        create: { id: item.id, label: item.label, stepId: step.id, parentId: null, order: item.order },
      });

      if ("children" in item && item.children) {
        for (const child of item.children) {
          await prisma.procedureItem.upsert({
            where: { id: child.id },
            update: { label: child.label, stepId: step.id, parentId: item.id, order: child.order },
            create: {
              id: child.id,
              label: child.label,
              stepId: step.id,
              parentId: item.id,
              order: child.order,
            },
          });
        }
      }
    }
  }
  console.log(`✓ procedure_steps & procedure_items`);

  // ────────────────────────────────────────────────
  // 期限マーク（今週の月曜を基準に生成）
  // ────────────────────────────────────────────────
  const monday = mondayOfCurrentWeekJST();

  const marks = [
    {
      id: "m-1",
      caseId: "c-a",
      at: atDay(monday, 1, 14, 0),
      dateOnly: false,
      title: "現地確認（業者同席）",
      assignee: "佐藤",
      nextAction: "図面確定と議事メモ共有",
      urgency: "urgent" as const,
      kind: "meeting" as const,
      linkedStepId: "step-2",
    },
    {
      id: "m-2",
      caseId: "c-a",
      at: atDateOnly(monday, 2),
      dateOnly: true,
      title: "見積比較表ドラフト",
      assignee: "佐藤",
      nextAction: "比較軸の承認依頼",
      urgency: "soon" as const,
      kind: "deadline" as const,
      linkedStepId: "step-2",
    },
    {
      id: "m-3",
      caseId: "c-b",
      at: atDay(monday, 1, 10, 30),
      dateOnly: false,
      title: "発注稟議提出",
      assignee: "田中",
      nextAction: "稟議番号の取得",
      urgency: "urgent" as const,
      kind: "deadline" as const,
      linkedStepId: "step-4",
    },
    {
      id: "m-4",
      caseId: "c-b",
      at: atDay(monday, 1, 16, 0),
      dateOnly: false,
      title: "現場立会（配管）",
      assignee: "田中",
      nextAction: "立会チェックリスト回収",
      urgency: "normal" as const,
      kind: "site" as const,
      linkedStepId: "step-4",
    },
    {
      id: "m-5",
      caseId: "c-c",
      at: atDateOnly(monday, 3),
      dateOnly: true,
      title: "搬入スロット確定",
      assignee: "鈴木",
      nextAction: "ゲート申請",
      urgency: "normal" as const,
      kind: "delivery" as const,
      linkedStepId: "step-5",
    },
    {
      id: "m-6",
      caseId: "c-c",
      at: atDateOnly(monday, 8),
      dateOnly: true,
      title: "検査予定",
      assignee: "鈴木",
      nextAction: "不備リストの事前確認",
      urgency: "soon" as const,
      kind: "meeting" as const,
      linkedStepId: "step-5",
    },
    {
      id: "m-7",
      caseId: "c-d",
      at: atDateOnly(monday, 5),
      dateOnly: true,
      title: "設計レビュー",
      assignee: "高橋",
      nextAction: "コメント反映",
      urgency: "normal" as const,
      kind: "meeting" as const,
      linkedStepId: "step-3",
    },
    {
      id: "m-8",
      caseId: "c-d",
      at: atDay(monday, 12, 9, 0),
      dateOnly: false,
      title: "承認書ドラフト提出",
      assignee: "高橋",
      nextAction: "法務レビュー依頼",
      urgency: "soon" as const,
      kind: "deadline" as const,
      linkedStepId: "step-3",
    },
    {
      id: "m-9",
      caseId: "c-a",
      at: atDateOnly(monday, 20),
      dateOnly: true,
      title: "発注決裁期限",
      assignee: "佐藤",
      nextAction: "決裁者へ最終説明",
      urgency: "normal" as const,
      kind: "deadline" as const,
      linkedStepId: "step-4",
    },
    {
      id: "m-10",
      caseId: "c-b",
      at: atDateOnly(monday, 3),
      dateOnly: true,
      title: "安全書類期限（超過扱いデモ）",
      assignee: "田中",
      nextAction: "再提出",
      urgency: "overdue" as const,
      kind: "deadline" as const,
      linkedStepId: "step-5",
    },
  ];

  for (const mark of marks) {
    await prisma.deadlineMark.upsert({
      where: { id: mark.id },
      update: mark,
      create: mark,
    });
  }
  console.log(`✓ deadline_marks (${marks.length})`);

  // ────────────────────────────────────────────────
  // 年間スケジュール
  // ────────────────────────────────────────────────
  const annualCards = [
    {
      id: "annual-feb",
      period: "2月末（半期棚卸し）",
      label: null,
      order: 1,
      projects: [
        {
          label: "設備A新規導入工事_P株式会社様_新規固定資産_3月検収/3月償却開始",
          completed: true,
          caseLabel: null,
          order: 1,
        },
        {
          label: "設備B改造工事_株式会社Q様_既存固定資産の改造_2月検収/3月償却開始",
          completed: true,
          caseLabel: null,
          order: 2,
        },
      ],
    },
    {
      id: "annual-may",
      period: "5月（GW）",
      label: null,
      order: 2,
      projects: [
        {
          label: "電気設備更新工事_R株式会社様_修繕費_5月検収",
          completed: true,
          caseLabel: null,
          order: 1,
        },
        {
          label: "システム制御更新工事_有限会社S様_修繕費_5月検収",
          completed: true,
          caseLabel: null,
          order: 2,
        },
      ],
    },
    {
      id: "annual-aug",
      period: "8月（お盆 / 月末 半期棚卸し）",
      label: null,
      order: 3,
      projects: [
        {
          label: "設備C新規導入工事_株式会社T様_新規固定資産_9月検収/9月償却開始",
          completed: false,
          caseLabel: "案件A",
          order: 1,
        },
        {
          label: "設備D改造工事_株式会社U様_既存固定資産の改造_8月検収/9月償却開始",
          completed: false,
          caseLabel: "案件B",
          order: 2,
        },
        {
          label: "空調機更新工事_X株式会社様_修繕_8月検収",
          completed: false,
          caseLabel: "案件C",
          order: 3,
        },
        {
          label: "床塗装工事_Y株式会社様_新規固定資産_9月検収/9月償却開始",
          completed: false,
          caseLabel: "案件D",
          order: 4,
        },
      ],
    },
    {
      id: "annual-yearend",
      period: "年末年始",
      label: null,
      order: 4,
      projects: [
        {
          label: "設備E新規導入工事_株式会社T様_新規固定資産_1月検収/1月償却開始",
          completed: false,
          caseLabel: null,
          order: 1,
        },
      ],
    },
    {
      id: "annual-other",
      period: null,
      label: "その他の時期",
      order: 5,
      projects: [
        {
          label: "3月_設備F改造工事_株式会社U様_既存固定資産の改造_3月検収/3月償却開始",
          completed: true,
          caseLabel: null,
          order: 1,
        },
        { label: "4月", completed: true, caseLabel: null, order: 2 },
        { label: "6月", completed: false, caseLabel: null, order: 3 },
        { label: "7月", completed: false, caseLabel: null, order: 4 },
        { label: "9月", completed: false, caseLabel: null, order: 5 },
        { label: "10月", completed: false, caseLabel: null, order: 6 },
        { label: "11月", completed: false, caseLabel: null, order: 7 },
      ],
    },
  ];

  for (const card of annualCards) {
    const { projects, ...cardData } = card;
    await prisma.annualCard.upsert({
      where: { id: card.id },
      update: cardData,
      create: cardData,
    });

    for (const proj of projects) {
      const existing = await prisma.annualProject.findFirst({
        where: { cardId: card.id, label: proj.label },
      });
      if (!existing) {
        await prisma.annualProject.create({
          data: { ...proj, cardId: card.id },
        });
      }
    }
  }
  console.log(`✓ annual_cards & annual_projects`);

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
