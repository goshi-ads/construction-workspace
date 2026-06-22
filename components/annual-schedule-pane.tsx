"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { orgNow } from "@/lib/org-calendar";
import { type ApiAnnualCard } from "@/lib/api-types";
import { cn } from "@/lib/utils";

function renderProjectLabel(label: string, completed: boolean): React.ReactNode {
  const parts = label.split("_");
  return parts.map((part, i) => {
    const isSchedule = /検収|償却/.test(part);
    return (
      <React.Fragment key={i}>
        {i > 0 && <span className={completed ? "text-muted-foreground/60" : "text-foreground/40"}>_</span>}
        <span
          className={cn(
            completed && "line-through",
            isSchedule
              ? completed
                ? "text-red-400/50"
                : "font-medium text-red-500"
              : completed
                ? "text-muted-foreground/60"
                : "text-foreground/80"
          )}
        >
          {part}
        </span>
      </React.Fragment>
    );
  });
}

function extractMonth(card: ApiAnnualCard): number | null {
  const text = card.period ?? card.label ?? "";
  const m = text.match(/^(\d+)月/);
  if (m) return parseInt(m[1]!, 10);
  if (text.includes("年末年始")) return 12;
  return null;
}

function forwardMonthDist(cardMonth: number, todayMonth: number): number {
  const diff = (cardMonth - todayMonth + 12) % 12;
  return diff === 0 ? 12 : diff;
}

function closestCardId(cards: ApiAnnualCard[], todayMonth: number): string {
  let minDist = Infinity;
  let result = cards[0]?.id ?? "";
  for (const card of cards) {
    const month = extractMonth(card);
    if (month === null) continue;
    const dist = forwardMonthDist(month, todayMonth);
    if (dist < minDist) {
      minDist = dist;
      result = card.id;
    }
  }
  return result;
}

export function AnnualSchedulePane() {
  const todayMonth = React.useMemo(() => orgNow().getMonth() + 1, []);
  const [cards, setCards] = React.useState<ApiAnnualCard[]>([]);
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  // 年間スケジュールをDBから取得
  React.useEffect(() => {
    fetch("/api/annual-schedule")
      .then((r) => r.json())
      .then((data: ApiAnnualCard[]) => {
        setCards(data);
        const defaultOpen = closestCardId(data, todayMonth);
        if (defaultOpen) setOpenItems([defaultOpen]);
      })
      .catch(console.error);
  }, [todayMonth]);

  const handleToggleCompleted = React.useCallback(
    (cardId: string, projectId: string, current: boolean) => {
      const next = !current;
      // 楽観的 UI 更新
      setCards((prev) =>
        prev.map((card) =>
          card.id !== cardId
            ? card
            : {
                ...card,
                projects: card.projects.map((p) =>
                  p.id !== projectId ? p : { ...p, completed: next }
                ),
              }
        )
      );
      fetch(`/api/annual-schedule/${cardId}/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      }).catch((err) => {
        console.error(err);
        // 失敗時は元に戻す
        setCards((prev) =>
          prev.map((card) =>
            card.id !== cardId
              ? card
              : {
                  ...card,
                  projects: card.projects.map((p) =>
                    p.id !== projectId ? p : { ...p, completed: current }
                  ),
                }
          )
        );
      });
    },
    []
  );

  return (
    <ScrollArea className="h-[min(70vh,560px)] pr-3">
      <div className="space-y-1 pb-2">
        <Accordion
          value={openItems}
          onValueChange={setOpenItems}
          className="w-full space-y-2"
        >
          {cards.map((card) => (
            <AccordionItem
              key={card.id}
              value={card.id}
              className="rounded-lg border bg-card px-3 shadow-xs"
            >
              <AccordionTrigger className="py-2 text-sm font-bold leading-snug hover:no-underline">
                {card.period ?? card.label}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-1 text-xs leading-relaxed">
                  {card.projects.map((project) => (
                    <li
                      key={project.id}
                      className="flex cursor-pointer gap-1.5"
                      onClick={() =>
                        handleToggleCompleted(card.id, project.id, project.completed)
                      }
                    >
                      <span
                        className={cn(
                          "shrink-0",
                          project.completed
                            ? "text-muted-foreground/60"
                            : "text-foreground/70"
                        )}
                      >
                        ・
                      </span>
                      <span className="min-w-0 flex flex-wrap items-baseline gap-x-1.5">
                        {project.caseLabel ? (
                          <span className="shrink-0 rounded bg-primary/10 px-1 py-px text-[10px] font-semibold text-primary">
                            {project.caseLabel}
                          </span>
                        ) : null}
                        <span className="min-w-0 break-words">
                          {renderProjectLabel(project.label, project.completed)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Separator className="mt-2" />
        <p className="text-muted-foreground text-xs leading-relaxed">
          年間の「塞がり日」を掲載し、ペイン3・4の期限配置の前提にします。クリックで完了を切り替えられます。
        </p>
      </div>
    </ScrollArea>
  );
}
