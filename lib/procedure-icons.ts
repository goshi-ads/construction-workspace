import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileText,
  HardHat,
  Layers,
  MapPin,
  Stamp,
} from "lucide-react";

import type { ProcedureStepIcon } from "@/lib/workspace-model";

const ICON_MAP: Record<ProcedureStepIcon, LucideIcon> = {
  FileText,
  MapPin,
  Stamp,
  Layers,
  HardHat,
  ClipboardCheck,
};

export function getProcedureIcon(name: ProcedureStepIcon): LucideIcon {
  return ICON_MAP[name];
}
