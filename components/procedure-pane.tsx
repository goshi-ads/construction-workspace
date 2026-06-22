"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProcedureIcon } from "@/lib/procedure-icons";
import {
  type CaseRow,
  type ProcedureItem,
  type ProcedureStep,
} from "@/lib/workspace-model";
import { cn } from "@/lib/utils";

type ProcedurePaneProps = {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  cases: CaseRow[];
  steps: ProcedureStep[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string | null) => void;
  currentStepId: string | null;
  onCurrentStepChange: (caseId: string, stepId: string) => void;
  onChecksChange?: (caseId: string, checks: Record<string, boolean>) => void;
};

function ProcedureItemRow({
  item,
  caseId,
  checks,
  disabled,
  onCheckChange,
  depth = 0,
}: {
  item: ProcedureItem;
  caseId: string;
  checks: Record<string, boolean>;
  disabled: boolean;
  onCheckChange: (itemId: string, checked: boolean) => void;
  depth?: number;
}) {
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <li className={cn("space-y-1", depth > 0 && "pl-4")}>
        <p className="text-muted-foreground text-xs leading-snug">{item.label}</p>
        <ul className="space-y-1.5 border-l border-border pl-3">
          {item.children!.map((child) => (
            <ProcedureItemRow
              key={child.id}
              item={child}
              caseId={caseId}
              checks={checks}
              disabled={disabled}
              onCheckChange={onCheckChange}
              depth={depth + 1}
            />
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex items-start gap-2 text-xs leading-snug",
        depth > 0 && "pl-4"
      )}
    >
      <Checkbox
        id={`${caseId}-${item.id}`}
        checked={checks[item.id] ?? false}
        disabled={disabled}
        onCheckedChange={(v) => onCheckChange(item.id, v === true)}
        className="mt-0.5"
      />
      <label
        htmlFor={`${caseId}-${item.id}`}
        className={cn(
          "flex-1 cursor-pointer",
          disabled && "cursor-default opacity-60",
          checks[item.id] && "text-muted-foreground line-through"
        )}
      >
        {item.label}
      </label>
    </li>
  );
}

export function ProcedurePane({
  scrollContainerRef,
  cases,
  steps,
  selectedCaseId,
  onSelectCase,
  currentStepId,
  onCurrentStepChange,
  onChecksChange,
}: ProcedurePaneProps) {
  const [openSteps, setOpenSteps] = React.useState<string[]>([]);
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});

  const caseActive = Boolean(selectedCaseId && currentStepId);

  // 案件が切り替わったらDBからチェック状態を取得
  React.useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      if (!selectedCaseId) {
        setOpenSteps([]);
        setChecks({});
        return;
      }
      fetch(`/api/cases/${selectedCaseId}/checks`)
        .then((r) => r.json())
        .then((data: Record<string, boolean>) => {
          if (cancelled) return;
          setChecks(data);
          if (currentStepId) setOpenSteps([currentStepId]);
        })
        .catch(() => {
          if (!cancelled) setChecks({});
        });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [selectedCaseId, currentStepId]);

  const handleCheckChange = React.useCallback(
    (itemId: string, checked: boolean) => {
      if (!selectedCaseId) return;
      // 楽観的 UI 更新（先に画面を更新してから API を呼ぶ）
      const next = { ...checks, [itemId]: checked };
      setChecks(next);
      onChecksChange?.(selectedCaseId, next);
      fetch(`/api/cases/${selectedCaseId}/checks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, checked }),
      })
        .then((r) => r.json())
        .then((saved: Record<string, boolean>) => {
          setChecks(saved);
          onChecksChange?.(selectedCaseId, saved);
        })
        .catch(console.error);
    },
    [selectedCaseId, checks, onChecksChange]
  );

  const handleSetCurrent = React.useCallback(
    (e: React.MouseEvent, stepId: string) => {
      e.stopPropagation();
      if (!selectedCaseId) return;
      onCurrentStepChange(selectedCaseId, stepId);
      setOpenSteps([stepId]);
    },
    [onCurrentStepChange, selectedCaseId]
  );

  return (
    <ScrollArea className="h-[min(70vh,560px)] pr-3">
      <div className="pb-2">
        <div className="mb-3 flex flex-wrap gap-1">
          {cases.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="xs"
              variant={selectedCaseId === c.id ? "default" : "outline"}
              className="h-7 text-[11px]"
              onClick={() =>
                onSelectCase(selectedCaseId === c.id ? null : c.id)
              }
            >
              {c.name}
            </Button>
          ))}
        </div>

        {!caseActive ? (
          <p className="text-muted-foreground mb-3 rounded-md border border-dashed bg-muted/30 px-2 py-2 text-xs leading-relaxed">
            上の案件ボタンで対象を選ぶと、現在ステップの強調とチェックが有効になります（ペイン3・4の操作とは連動しません）。
          </p>
        ) : null}

        <div ref={scrollContainerRef}>
          <Accordion
            value={openSteps}
            onValueChange={setOpenSteps}
            className="w-full"
          >
            {steps.map((step) => {
              const Icon = getProcedureIcon(step.icon);
              const isCurrent = caseActive && currentStepId === step.id;

              return (
                <AccordionItem
                  key={step.id}
                  value={step.id}
                  className={cn(
                    "mb-2 rounded-lg border px-2",
                    isCurrent && "border-primary/40 bg-primary/5"
                  )}
                >
                  <AccordionTrigger
                    data-step-id={step.id}
                    className="gap-2 py-2 hover:no-underline"
                  >
                    <Icon
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold leading-tight">
                          {step.title}
                        </span>
                        {isCurrent ? (
                          <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                            現在
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                    {caseActive && !isCurrent ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="mr-6 h-6 shrink-0 text-[10px]"
                        onClick={(e) => handleSetCurrent(e, step.id)}
                      >
                        現在にする
                      </Button>
                    ) : null}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <ul className="space-y-2 pl-6">
                      {step.items.map((item) => (
                        <ProcedureItemRow
                          key={item.id}
                          item={item}
                          caseId={selectedCaseId ?? "_"}
                          checks={checks}
                          disabled={!caseActive}
                          onCheckChange={handleCheckChange}
                        />
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </ScrollArea>
  );
}
