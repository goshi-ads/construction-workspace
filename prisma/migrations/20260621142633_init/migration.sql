-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('normal', 'soon', 'urgent', 'overdue');

-- CreateEnum
CREATE TYPE "MarkKind" AS ENUM ('deadline', 'meeting', 'delivery', 'site');

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainAssignee" TEXT NOT NULL,
    "subAssignee" TEXT NOT NULL,
    "plannedStepId" TEXT NOT NULL,
    "plannedProgressPct" INTEGER,
    "defaultCurrentStepId" TEXT NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_checks" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "case_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_progress" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "currentStepId" TEXT NOT NULL,

    CONSTRAINT "case_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deadline_marks" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "at" TEXT NOT NULL,
    "dateOnly" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "nextAction" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'normal',
    "kind" "MarkKind" NOT NULL DEFAULT 'deadline',
    "linkedStepId" TEXT,

    CONSTRAINT "deadline_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_steps" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "procedure_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_items" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "procedure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_cards" (
    "id" TEXT NOT NULL,
    "period" TEXT,
    "label" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "annual_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_projects" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "caseLabel" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "annual_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_checks_caseId_itemId_key" ON "case_checks"("caseId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "case_progress_caseId_key" ON "case_progress"("caseId");

-- AddForeignKey
ALTER TABLE "case_checks" ADD CONSTRAINT "case_checks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_progress" ADD CONSTRAINT "case_progress_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline_marks" ADD CONSTRAINT "deadline_marks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_items" ADD CONSTRAINT "procedure_items_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "procedure_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_items" ADD CONSTRAINT "procedure_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "procedure_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "annual_projects" ADD CONSTRAINT "annual_projects_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "annual_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
