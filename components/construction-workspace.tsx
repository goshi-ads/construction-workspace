"use client";

import * as React from "react";
import { parseISO } from "date-fns";
import { TZDate } from "@date-fns/tz";
import {
  CalendarDays,
  CircleDot,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  addDaysOrg,
  calendarDayKey,
  dayIndexFromStart,
  formatTokyoDate,
  isWeekendTokyo,
  mondayStartOfWeek,
  orgNow,
  ORG_TZ,
  timeOfDayFraction,
} from "@/lib/org-calendar";
import { AnnualSchedulePane } from "@/components/annual-schedule-pane";
import { ProcedurePane } from "@/components/procedure-pane";
import { getProcedureIcon } from "@/lib/procedure-icons";
import {
  formatPhaseLabel,
  type CaseRow,
  type DeadlineMark,
  type ProcedureStep,
  type ProcedureItem,
} from "@/lib/workspace-model";
import {
  toCase,
  toDeadlineMark,
  toProcedureStep,
  type InitData,
} from "@/lib/api-types";
import { cn } from "@/lib/utils";

const COMPACT_DAYS = 14;
const EXPANDED_DAYS = 56;
const EXPANDED_MARK_CAP = 8;

type Granularity = "week" | "day";
type CheckState = Record<string, boolean>;

function urgencyRing(u: DeadlineMark["urgency"]) {
  switch (u) {
    case "overdue":
      return "ring-red-600/90 bg-red-50 dark:bg-red-950/40";
    case "urgent":
      return "ring-orange-600/85 bg-orange-50 dark:bg-orange-950/35";
    case "soon":
      return "ring-amber-500/90 bg-amber-50 dark:bg-amber-950/35";
    default:
      return "ring-sky-600/70 bg-sky-50 dark:bg-sky-950/30";
  }
}

function MarkIcon({
  mark,
  steps,
}: {
  mark: DeadlineMark;
  steps: ProcedureStep[];
}) {
  const cls = "size-3.5 shrink-0 text-foreground/80";
  const step = mark.linkedStepId
    ? steps.find((s) => s.id === mark.linkedStepId)
    : undefined;
  const Icon = getProcedureIcon(step?.icon ?? "FileText");
  return <Icon className={cls} aria-hidden />;
}

function MarkTooltipBody({ m }: { m: DeadlineMark }) {
  return (
    <div className="space-y-1 text-left">
      <p className="font-medium leading-snug">{m.title}</p>
      <p className="text-muted-foreground">
        {m.dateOnly
          ? formatTokyoDate(parseISO(m.at), "M月d日(E)")
          : formatTokyoDate(parseISO(m.at), "M月d日(E) HH:mm")}
      </p>
      <p>
        <span className="text-muted-foreground">担当:</span> {m.assignee}
      </p>
      <p>
        <span className="text-muted-foreground">次のアクション:</span>{" "}
        {m.nextAction}
      </p>
    </div>
  );
}

function useWorkspaceClock() {
  const [now, setNow] = React.useState<TZDate>(() => orgNow());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(orgNow()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export function ConstructionWorkspace() {
  const now = useWorkspaceClock();
  const monday = React.useMemo(() => mondayStartOfWeek(now), [now]);

  // ── DB から取得するデータ ─────────────────────────────────────
  const [cases, setCases] = React.useState<CaseRow[]>([]);
  const [marks, setMarks] = React.useState<DeadlineMark[]>([]);
  const [steps, setSteps] = React.useState<ProcedureStep[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // ── UI 状態 ───────────────────────────────────────────────────
  const [timelineCaseId, setTimelineCaseId] = React.useState<string | null>(null);
  const [procedureCaseId, setProcedureCaseId] = React.useState<string | null>(null);
  const [currentStepByCase, setCurrentStepByCase] =
    React.useState<Record<string, string>>({});
  const [checksByCase, setChecksByCase] = React.useState<
    Record<string, CheckState>
  >({});
  const [focusedMarkId, setFocusedMarkId] = React.useState<string | null>(null);
  const [granularity, setGranularity] = React.useState<Granularity>("week");
  const [showJumpHint, setShowJumpHint] = React.useState(false);
  const [showPane4, setShowPane4] = React.useState(false);

  const procedureRef = React.useRef<HTMLDivElement>(null);

  // ── 初期データ取得 ────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/init")
      .then((r) => r.json())
      .then((data: InitData) => {
        if (cancelled) return;
        setCases(data.cases.map(toCase));
        setMarks(data.marks.map(toDeadlineMark));
        setSteps(data.steps.map(toProcedureStep));
        setCurrentStepByCase(data.currentStepByCase);
        setChecksByCase(data.checksByCase);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── 進捗計算用のリーフ ID（steps がロードされてから計算）────
  const allLeafIds = React.useMemo(
    () => steps.flatMap((s) => collectLeafIds(s.items)),
    [steps]
  );

  const procedureCurrentStepId = procedureCaseId
    ? (currentStepByCase[procedureCaseId] ?? null)
    : null;

  const handleCurrentStepChange = React.useCallback(
    (caseId: string, stepId: string) => {
      setCurrentStepByCase((prev) => ({ ...prev, [caseId]: stepId }));
      fetch(`/api/cases/${caseId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStepId: stepId }),
      }).catch(console.error);
    },
    []
  );

  const handleChecksByCase = React.useCallback(
    (caseId: string, checks: CheckState) => {
      setChecksByCase((prev) => ({ ...prev, [caseId]: checks }));
    },
    []
  );

  const expandedScrollRef = React.useRef<HTMLDivElement>(null);
  const prevCaseRef = React.useRef<string | null>(null);

  const marksByCase = React.useMemo(() => {
    const map = new Map<string, DeadlineMark[]>();
    for (const m of marks) {
      const arr = map.get(m.caseId) ?? [];
      arr.push(m);
      map.set(m.caseId, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => parseISO(a.at).getTime() - parseISO(b.at).getTime());
    }
    return map;
  }, [marks]);

  const onMarkActivate = React.useCallback((m: DeadlineMark) => {
    setTimelineCaseId(m.caseId);
    setFocusedMarkId(m.id);
  }, []);

  React.useEffect(() => {
    const prevSelection = prevCaseRef.current;
    prevCaseRef.current = timelineCaseId;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      if (!timelineCaseId) {
        setShowJumpHint(false);
        return;
      }
      if (prevSelection === timelineCaseId) return;

      const el = expandedScrollRef.current;
      if (!el) return;

      const caseMarks = marksByCase.get(timelineCaseId) ?? [];
      const next =
        caseMarks.find((m) => parseISO(m.at).getTime() >= now.getTime()) ??
        caseMarks[0];
      if (!next) {
        setShowJumpHint(false);
        return;
      }

      const anchor = el.querySelector<HTMLElement>(
        `[data-mark-anchor="${next.id}"]`
      );
      if (!anchor) {
        setShowJumpHint(false);
        return;
      }

      const cr = el.getBoundingClientRect();
      const ar = anchor.getBoundingClientRect();
      const visible = ar.left >= cr.left - 4 && ar.right <= cr.right + 4;
      setShowJumpHint(!visible);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [timelineCaseId, marksByCase, now]);

  const scrollToNextDeadline = React.useCallback(() => {
    if (!timelineCaseId) return;
    const el = expandedScrollRef.current;
    if (!el) return;
    const caseMarks = marksByCase.get(timelineCaseId) ?? [];
    const next =
      caseMarks.find((m) => parseISO(m.at).getTime() >= now.getTime()) ??
      caseMarks[0];
    if (!next) return;
    const anchor = el.querySelector<HTMLElement>(
      `[data-mark-anchor="${next.id}"]`
    );
    anchor?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setShowJumpHint(false);
  }, [marksByCase, now, timelineCaseId]);

  const dayHeaders = React.useMemo(
    () => Array.from({ length: COMPACT_DAYS }, (_, i) => addDaysOrg(monday, i)),
    [monday]
  );

  const windowEnd = React.useMemo(() => {
    const d = addDaysOrg(monday, COMPACT_DAYS - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [monday]);

  const todayIdx = dayIndexFromStart(monday, now);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        データを読み込んでいます…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            工事ワークスペース
          </h1>
          <p className="text-muted-foreground text-xs">
            組織タイムゾーン {ORG_TZ} · 週は月曜始まり · 今日{" "}
            <span className="font-medium text-foreground">
              {formatTokyoDate(now, "M月d日(E)")}
            </span>
          </p>
        </div>
        <Tabs
          value={showPane4 ? "both" : "pane3"}
          onValueChange={(v) => setShowPane4(v === "both")}
        >
          <TabsList className="h-8">
            <TabsTrigger value="pane3" className="px-3 text-xs">
              直近
            </TabsTrigger>
            <TabsTrigger value="both" className="px-3 text-xs">
              直近＋今後
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-[minmax(200px,14rem)_minmax(240px,18rem)_minmax(0,1fr)]">
        <PaneShell
          title="ペイン1 · 工事の流れ"
          className="min-w-0 lg:max-w-[14rem]"
        >
          <ProcedurePane
            scrollContainerRef={procedureRef}
            cases={cases}
            steps={steps}
            selectedCaseId={procedureCaseId}
            onSelectCase={setProcedureCaseId}
            currentStepId={procedureCurrentStepId}
            onCurrentStepChange={handleCurrentStepChange}
            onChecksChange={handleChecksByCase}
          />
        </PaneShell>

        <PaneShell
          title="ペイン2 · 年間工事予定"
          className="min-w-0 lg:max-w-[18rem]"
        >
          <AnnualSchedulePane />
        </PaneShell>

        <div className="flex min-h-0 min-w-0 flex-col gap-2 md:col-span-2 lg:col-span-1">
          {/* ペイン3：常に表示 */}
          <PaneShell
            title="ペイン3 · 対応中（直近）タイムレール"
            className={cn(
              showPane4
                ? "min-h-[min(24vh,220px)]"
                : "min-h-[min(36vh,320px)] flex-1"
            )}
          >
            <CompactTimeRail
              monday={monday}
              windowEnd={windowEnd}
              dayHeaders={dayHeaders}
              todayIdx={todayIdx}
              cases={cases}
              steps={steps}
              currentStepByCase={currentStepByCase}
              marksByCase={marksByCase}
              checksByCase={checksByCase}
              allLeafIds={allLeafIds}
              selectedCaseId={timelineCaseId}
              focusedMarkId={focusedMarkId}
              onSelectCase={setTimelineCaseId}
              onMarkActivate={onMarkActivate}
            />
          </PaneShell>

          {/* ペイン4：「直近＋今後」タブ選択時のみ表示 */}
          {showPane4 ? (
            <PaneShell
              title="ペイン4 · 対応中（今後）タイムレール"
              className="min-h-[min(36vh,320px)] flex-1"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Tabs
                    value={granularity}
                    onValueChange={(v) => setGranularity(v as Granularity)}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="week" className="px-2 text-xs">
                        週（既定）
                      </TabsTrigger>
                      <TabsTrigger value="day" className="px-2 text-xs">
                        日
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-muted-foreground text-[10px]">
                    祝日列: オフ（設定で後からオン想定）
                  </p>
                </div>

                {!timelineCaseId ? (
                  <Card className="border-dashed bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm">
                      <CalendarDays className="text-muted-foreground size-8" />
                      <p className="font-medium">案件が未選択です</p>
                      <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
                        ペイン3の案件名をクリックするか、期限マークを選ぶと、このペインに同じ案件の時間軸が開きます。
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {showJumpHint ? (
                      <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-50 px-2 py-1.5 text-xs dark:bg-amber-950/30">
                        <span className="text-muted-foreground shrink">
                          次の期限が表示範囲外です。
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          className="h-6 shrink-0"
                          onClick={scrollToNextDeadline}
                        >
                          次の期限を表示
                        </Button>
                      </div>
                    ) : null}
                    <ExpandedTimeRail
                      ref={expandedScrollRef}
                      monday={monday}
                      now={now}
                      caseName={
                        cases.find((c) => c.id === timelineCaseId)?.name ?? ""
                      }
                      marks={marksByCase.get(timelineCaseId) ?? []}
                      steps={steps}
                      cap={EXPANDED_MARK_CAP}
                      granularity={granularity}
                      totalDays={EXPANDED_DAYS}
                      focusedMarkId={focusedMarkId}
                      onMarkActivate={onMarkActivate}
                    />
                  </>
                )}
              </div>
            </PaneShell>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PaneShell({
  title,
  headerExtra,
  children,
  className,
}: {
  title: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden py-0 shadow-sm",
        className
      )}
    >
      <CardHeader className="bg-primary text-primary-foreground shrink-0 rounded-none px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide">{title}</p>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2 py-2">
        {children}
      </CardContent>
    </Card>
  );
}

type Cluster = { dayKey: string; marks: DeadlineMark[] };

function clusterMarksForCompact(
  marks: DeadlineMark[],
  windowStart: TZDate,
  windowEnd: TZDate
): Cluster[] {
  const inWin = marks
    .filter((m) => {
      const t = parseISO(m.at);
      return t >= windowStart && t <= windowEnd;
    })
    .sort((a, b) => parseISO(a.at).getTime() - parseISO(b.at).getTime());

  const clusters: Cluster[] = [];
  for (const m of inWin) {
    const k = calendarDayKey(parseISO(m.at));
    const last = clusters[clusters.length - 1];
    if (last && last.dayKey === k) {
      last.marks.push(m);
    } else {
      clusters.push({ dayKey: k, marks: [m] });
    }
  }
  return clusters.slice(0, 3);
}

// ─── 進捗計算 ────────────────────────────────────────────────────

type ProgressStatus = "red" | "yellow" | "blue";

type CaseProgressInfo = {
  actualRate: number;
  expectedRate: number;
  status: ProgressStatus;
  label: string;
  completedItems: number;
  totalItems: number;
};

function collectLeafIds(items: ProcedureItem[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      out.push(...collectLeafIds(item.children));
    } else {
      out.push(item.id);
    }
  }
  return out;
}

function leafIdsUpToStep(
  steps: ProcedureStep[],
  plannedStepId: string
): string[] {
  const out: string[] = [];
  for (const step of steps) {
    out.push(...collectLeafIds(step.items));
    if (step.id === plannedStepId) break;
  }
  return out;
}

function calcProgress(
  steps: ProcedureStep[],
  allLeafIds: string[],
  currentStepId: string,
  plannedStepId: string,
  checks: Record<string, boolean>,
  plannedProgressPct?: number
): CaseProgressInfo {
  const total = allLeafIds.length;
  const completed = allLeafIds.filter((id) => checks[id]).length;
  const actualRate = total > 0 ? (completed / total) * 100 : 0;

  const expectedRate =
    plannedProgressPct !== undefined
      ? plannedProgressPct
      : total > 0
        ? (leafIdsUpToStep(steps, plannedStepId).length / total) * 100
        : 0;

  const diff = expectedRate - actualRate;

  let status: ProgressStatus;
  let label: string;
  if (diff >= 16) {
    status = "red";
    label = "遅れている";
  } else if (diff >= 5) {
    status = "yellow";
    label = "遅れ気味";
  } else {
    status = "blue";
    label = "順調";
  }

  return { actualRate, expectedRate, status, label, completedItems: completed, totalItems: total };
}

function statusColor(status: ProgressStatus) {
  switch (status) {
    case "red":    return { dot: "bg-red-500",   bar: "bg-red-400",   text: "text-red-600 dark:text-red-400" };
    case "yellow": return { dot: "bg-amber-400", bar: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" };
    default:       return { dot: "bg-teal-500",  bar: "bg-teal-500",  text: "text-teal-600 dark:text-teal-400" };
  }
}

// ─── CompactTimeRail ──────────────────────────────────────────────

function CompactTimeRail({
  monday,
  windowEnd,
  dayHeaders,
  todayIdx,
  cases,
  steps,
  currentStepByCase,
  marksByCase,
  checksByCase,
  allLeafIds,
  selectedCaseId,
  focusedMarkId,
  onSelectCase,
  onMarkActivate,
}: {
  monday: TZDate;
  windowEnd: TZDate;
  dayHeaders: TZDate[];
  todayIdx: number;
  cases: CaseRow[];
  steps: ProcedureStep[];
  currentStepByCase: Record<string, string>;
  marksByCase: Map<string, DeadlineMark[]>;
  checksByCase: Record<string, Record<string, boolean>>;
  allLeafIds: string[];
  selectedCaseId: string | null;
  focusedMarkId: string | null;
  onSelectCase: (id: string | null) => void;
  onMarkActivate: (m: DeadlineMark) => void;
}) {
  const weekLabels: { label: string; span: number }[] = [
    { label: "今週", span: Math.min(7, COMPACT_DAYS) },
    { label: "翌週", span: Math.max(0, COMPACT_DAYS - 7) },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <p className="text-muted-foreground text-[10px] leading-snug">
        今週＋翌週（{COMPACT_DAYS}日）· 行は最大3件まで近い期限を集約（同日はバッジ）
      </p>
      <div className="min-h-0 overflow-x-auto overflow-y-auto rounded-md border">
        <table className="w-max min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-muted/80 sticky left-0 z-20 w-36 border-b border-r px-2 py-1 text-left font-medium backdrop-blur-sm">
                案件
              </th>
              {weekLabels.map((w, wi) =>
                w.span > 0 ? (
                  <th
                    key={wi}
                    colSpan={w.span}
                    className="border-b bg-muted/50 px-1 py-1 text-center font-medium"
                  >
                    {w.label}
                  </th>
                ) : null
              )}
            </tr>
            <tr>
              <th className="bg-muted/80 sticky left-0 z-20 border-r px-2 py-1 backdrop-blur-sm" />
              {dayHeaders.map((d, i) => {
                const weekend = isWeekendTokyo(d);
                const isToday = i === todayIdx;
                return (
                  <th
                    key={i}
                    className={cn(
                      "border-b px-0.5 py-1 text-center font-normal",
                      weekend && "bg-orange-100/70",
                      isToday && "bg-primary/15 ring-1 ring-primary/25"
                    )}
                  >
                    <div className="text-[10px] text-muted-foreground">
                      {formatTokyoDate(d, "EEE")}
                    </div>
                    <div className="font-medium">{formatTokyoDate(d, "d")}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const clusters = clusterMarksForCompact(
                marksByCase.get(c.id) ?? [],
                monday,
                windowEnd
              );
              const rowSel = selectedCaseId === c.id;
              return (
                <tr
                  key={c.id}
                  className={cn(
                    "cursor-pointer border-t transition-colors hover:bg-muted/30",
                    rowSel && "bg-primary/5"
                  )}
                  onClick={() =>
                    onSelectCase(selectedCaseId === c.id ? null : c.id)
                  }
                >
                  <td
                    className={cn(
                      "bg-card sticky left-0 z-10 w-36 border-r px-2 py-2 align-top backdrop-blur-sm",
                      rowSel && "ring-1 ring-inset ring-primary/30"
                    )}
                  >
                    <p className="font-medium leading-tight">{c.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {formatPhaseLabel(
                        currentStepByCase[c.id] ?? c.defaultCurrentStepId
                      )}
                    </p>
                  </td>
                  {dayHeaders.map((d, colIdx) => {
                    const cluster = clusters.find(
                      (cl) => cl.dayKey === calendarDayKey(d)
                    );
                    const isToday = colIdx === todayIdx;
                    const weekend = isWeekendTokyo(d);
                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          "relative min-w-[44px] border-l px-0.5 py-1 align-middle",
                          weekend && "bg-orange-100/70",
                          isToday && "bg-primary/10"
                        )}
                      >
                        {isToday ? (
                          <div
                            className="pointer-events-none absolute inset-y-1 left-1/2 z-0 w-px -translate-x-1/2 bg-primary motion-safe:opacity-90 motion-reduce:opacity-100"
                            aria-hidden
                          />
                        ) : null}
                        {cluster ? (
                          <div className="relative z-[1] flex justify-center">
                            <Tooltip>
                              <TooltipTrigger
                                className={cn(
                                  "relative flex items-center gap-0.5 rounded-full border px-1 py-0.5 ring-2 ring-transparent",
                                  urgencyRing(cluster.marks[0]!.urgency),
                                  focusedMarkId &&
                                    cluster.marks.some(
                                      (m) => m.id === focusedMarkId
                                    ) &&
                                    "ring-primary"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkActivate(cluster.marks[0]!);
                                }}
                              >
                                <MarkIcon mark={cluster.marks[0]!} steps={steps} />
                                {cluster.marks.length > 1 ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-4 min-w-4 px-0.5 text-[9px] leading-none"
                                  >
                                    {cluster.marks.length}
                                  </Badge>
                                ) : null}
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-xs text-background"
                              >
                                {cluster.marks.length === 1 ? (
                                  <MarkTooltipBody m={cluster.marks[0]!} />
                                ) : (
                                  <div className="space-y-2">
                                    {cluster.marks.map((m) => (
                                      <div key={m.id}>
                                        <MarkTooltipBody m={m} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 進捗状況セクション */}
      <div className="shrink-0 rounded-md border bg-muted/20 px-2 py-2">
        <div className="mb-2 flex items-center gap-1.5">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wide">
            進捗状況（チェックリスト完了率）
          </p>
          <Popover>
            <PopoverTrigger className="inline-flex h-5 items-center rounded-md border border-input bg-muted/60 px-2 text-[10px] shadow-xs hover:bg-muted">
              進捗ステータス定義
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 space-y-2 p-3">
              <p className="text-xs font-semibold">ステータス定義（予定−実績）</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2.5 shrink-0 rounded-full bg-red-500" />
                  <span><span className="font-medium text-red-500">赤</span> ： 16%以上遅れている</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2.5 shrink-0 rounded-full bg-amber-400" />
                  <span><span className="font-medium text-amber-500">黄</span> ： 5〜15%遅れている</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2.5 shrink-0 rounded-full bg-teal-500" />
                  <span><span className="font-medium text-teal-600">青緑</span> ： 4%以内（順調）</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-3.5">
          {cases.map((c) => {
            const currentStepId =
              currentStepByCase[c.id] ?? c.defaultCurrentStepId;
            const checks = checksByCase[c.id] ?? {};
            const prog = calcProgress(steps, allLeafIds, currentStepId, c.plannedStepId, checks, c.plannedProgressPct);
            const col = statusColor(prog.status);
            const actualW = Math.round(prog.actualRate);
            const expectedW = Math.round(prog.expectedRate);
            const isBehindStep =
              steps.findIndex((s) => s.id === currentStepId) <
              steps.findIndex((s) => s.id === c.plannedStepId);
            return (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <div className="w-52 shrink-0">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-2 text-[10px]">
                    メイン: {c.assignees.main}、サブ: {c.assignees.sub}
                  </span>
                </div>
                <span className={cn("flex w-16 shrink-0 items-center gap-1", col.text)}>
                  <span className={cn("inline-block size-2 shrink-0 rounded-full", col.dot)} />
                  <span className="text-[10px]">{prog.label}</span>
                </span>
                <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-zinc-500/55"
                    style={{ width: `${expectedW}%` }}
                  />
                  <div
                    className={cn("absolute inset-y-0 left-0 rounded-full transition-all", col.bar)}
                    style={{ width: `${actualW}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-24 shrink-0 text-right text-[10px]">
                  予定{expectedW}% / 実績{actualW}%
                </span>
                <span className="text-muted-foreground shrink-0 text-[10px]">
                  予定:
                  <span className={cn("ml-0.5", isBehindStep && "font-semibold text-red-500")}>
                    {c.plannedStepId.replace("step-", "S")}
                  </span>
                  {" / 現在:"}
                  <span className="ml-0.5">
                    {currentStepId.replace("step-", "S")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ExpandedTimeRail = React.forwardRef<
  HTMLDivElement,
  {
    monday: TZDate;
    now: TZDate;
    caseName: string;
    marks: DeadlineMark[];
    steps: ProcedureStep[];
    cap: number;
    granularity: Granularity;
    totalDays: number;
    focusedMarkId: string | null;
    onMarkActivate: (m: DeadlineMark) => void;
  }
>(function ExpandedTimeRail(
  {
    monday,
    now,
    caseName,
    marks,
    steps,
    cap,
    granularity,
    totalDays,
    focusedMarkId,
    onMarkActivate,
  },
  ref
) {
  const shown = React.useMemo(() => {
    const sorted = [...marks].sort(
      (a, b) => parseISO(a.at).getTime() - parseISO(b.at).getTime()
    );
    return sorted.slice(0, cap);
  }, [marks, cap]);

  const days: TZDate[] = React.useMemo(() => {
    const out: TZDate[] = [];
    for (let i = 0; i < totalDays; i++) {
      out.push(addDaysOrg(monday, i));
    }
    return out;
  }, [monday, totalDays]);

  const todayIdx = dayIndexFromStart(monday, now);
  const colMin =
    granularity === "day" ? "minmax(40px,1fr)" : "minmax(22px,1fr)";

  const nowFrac =
    (todayIdx >= 0 && todayIdx < totalDays
      ? todayIdx + timeOfDayFraction(now, false)
      : -1) / totalDays;

  return (
    <div
      ref={ref}
      className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-md border"
    >
      <div
        className="min-w-[720px] space-y-1 p-2"
        style={{
          width: granularity === "day" ? "min(100%, 2400px)" : undefined,
        }}
      >
        <p className="text-muted-foreground text-[10px]">
          {caseName} · 次の期限を最大{cap}件 ·{" "}
          {granularity === "week"
            ? "週ビュー（列幅狭め・8週間）"
            : "日ビュー（列幅広め・8週間）"}
        </p>

        {granularity === "week" ? (
          <p className="text-muted-foreground rounded bg-muted/40 px-2 py-1 text-[9px]">
            {totalDays / 7}週分を横スクロールで表示（週ビューは列を詰めて一覧性優先）
          </p>
        ) : null}

        <div
          className="relative grid text-[9px]"
          style={{
            gridTemplateColumns: `repeat(${totalDays}, ${colMin})`,
          }}
        >
          {days.map((d, idx) => {
            const weekend = isWeekendTokyo(d);
            const isToday = idx === todayIdx;
            return (
              <div
                key={idx}
                className={cn(
                  "border-b border-l border-l-border/60 py-1 text-center",
                  weekend && "bg-orange-100/70",
                  isToday && "bg-primary/15"
                )}
              >
                <div className="text-muted-foreground">
                  {formatTokyoDate(d, "EEE")}
                </div>
                <div>{formatTokyoDate(d, "d")}</div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-1 h-20 rounded-md border bg-muted/10">
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${totalDays}, ${colMin})`,
            }}
          >
            {days.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "border-l border-l-border/60",
                  isWeekendTokyo(days[idx]!) && "bg-orange-100/70"
                )}
              />
            ))}
          </div>

          {nowFrac >= 0 && nowFrac <= 1 ? (
            <div
              className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-primary motion-safe:animate-pulse motion-reduce:animate-none"
              style={{ left: `${nowFrac * 100}%` }}
              aria-hidden
            />
          ) : null}

          {shown.map((m, stackI) => {
            const idx = dayIndexFromStart(monday, parseISO(m.at));
            if (idx < 0 || idx >= totalDays) return null;
            const frac = timeOfDayFraction(parseISO(m.at), m.dateOnly);
            const center = ((idx + frac) / totalDays) * 100;
            const sameDay = shown.filter(
              (x) =>
                calendarDayKey(parseISO(x.at)) ===
                calendarDayKey(parseISO(m.at))
            );
            const z = sameDay.indexOf(m);
            const offsetY = stackI * 6 + (z % 2) * 5;
            const offsetX = (z % 3) * 5;
            return (
              <div
                key={m.id}
                data-mark-anchor={m.id}
                className="pointer-events-auto absolute top-2 z-[3]"
                style={{
                  left: `${center}%`,
                  transform: `translate(-50%, ${offsetY}px) translateX(${offsetX}px)`,
                }}
              >
                <Tooltip>
                  <TooltipTrigger
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border bg-card shadow-sm ring-2 ring-transparent",
                      urgencyRing(m.urgency),
                      focusedMarkId === m.id && "ring-primary"
                    )}
                    onClick={() => onMarkActivate(m)}
                  >
                    <MarkIcon mark={m} steps={steps} />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs text-background"
                  >
                    <MarkTooltipBody m={m} />
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
          <CircleDot className="size-3" />
          色＝緊急度、アイコン＝種類。手順1への紐づけがない場合は3・4の強調のみです。
        </p>
      </div>
    </div>
  );
});

ExpandedTimeRail.displayName = "ExpandedTimeRail";
