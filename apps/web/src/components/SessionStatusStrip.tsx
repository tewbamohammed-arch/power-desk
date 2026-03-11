import type { AppSessionState } from "@t3tools/contracts";
import { CircleAlertIcon, FolderIcon, TriangleAlertIcon } from "lucide-react";

import { describeSessionState, formatSessionStageLabel } from "../sessionStatus";

function sessionToneClasses(status: AppSessionState["status"]): {
  readonly border: string;
  readonly icon: string;
} {
  switch (status) {
    case "blocked":
      return {
        border: "border-red-500/30 bg-red-500/5",
        icon: "text-red-600 dark:text-red-300",
      };
    case "degraded":
      return {
        border: "border-amber-500/30 bg-amber-500/5",
        icon: "text-amber-700 dark:text-amber-300",
      };
    case "ready":
      return {
        border: "border-emerald-500/30 bg-emerald-500/5",
        icon: "text-emerald-700 dark:text-emerald-300",
      };
    case "starting":
      return {
        border: "border-border bg-background",
        icon: "text-muted-foreground",
      };
  }
}

function SessionStatusIcon({ status }: { status: AppSessionState["status"] }) {
  const classes = sessionToneClasses(status).icon;

  if (status === "blocked") {
    return <TriangleAlertIcon className={`size-3.5 shrink-0 ${classes}`} />;
  }

  if (status === "degraded") {
    return <CircleAlertIcon className={`size-3.5 shrink-0 ${classes}`} />;
  }

  return <FolderIcon className={`size-3.5 shrink-0 ${classes}`} />;
}

export function SessionStatusStrip({ state }: { state: AppSessionState }) {
  const tone = sessionToneClasses(state.status);
  const workspaceLabel = state.workspace?.label ?? "No workspace selected";
  const workspacePath = state.workspace?.rootPath ?? "Choose a workspace to start.";

  return (
    <div className={`rounded-lg border px-3 py-2 ${tone.border}`}>
      <div className="flex items-start gap-2">
        <div className="pt-0.5">
          <SessionStatusIcon status={state.status} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">{formatSessionStageLabel(state.stage)}</span>
            <span className="truncate text-muted-foreground">{workspaceLabel}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{describeSessionState(state)}</p>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/75">{workspacePath}</p>
        </div>
      </div>
    </div>
  );
}
