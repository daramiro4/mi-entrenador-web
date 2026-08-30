"use client";

import { useMemo, useState, useTransition } from "react";
import { submitOnboarding } from "@/app/onboarding/actions";
import { calculateTargetFtp } from "@/lib/ftp-calculator";
import { suggestSeasonName } from "@/lib/season-name";
import type { FocusArea, GoalType, NewSeasonInput } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { StepGoal } from "./steps/StepGoal";
import { StepEventDetails } from "./steps/StepEventDetails";
import { StepFocusAreas } from "./steps/StepFocusAreas";
import { StepWeightGoal } from "./steps/StepWeightGoal";
import { StepFtpGoal } from "./steps/StepFtpGoal";
import { StepHours } from "./steps/StepHours";
import { StepStrength } from "./steps/StepStrength";
import { StepNotes } from "./steps/StepNotes";
import { StepReview } from "./steps/StepReview";

interface FormState {
  goalType: GoalType | null;
  eventType: string;
  eventDate: string;
  focusAreas: FocusArea[];
  targetWeightKg: string;
  targetFtpManual: string;
  hoursPerWeek: string;
  strengthDaysPerWeek: string;
  freeText: string;
  seasonName: string;
  seasonNameTouched: boolean;
}

const INITIAL_STATE: FormState = {
  goalType: null,
  eventType: "",
  eventDate: "",
  focusAreas: [],
  targetWeightKg: "",
  targetFtpManual: "",
  hoursPerWeek: "",
  strengthDaysPerWeek: "0",
  freeText: "",
  seasonName: "",
  seasonNameTouched: false,
};

export function OnboardingWizard({
  currentFtpWatts,
  currentWeightKg,
}: {
  currentFtpWatts: number | null;
  currentWeightKg: number | null;
}) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const hasFtpHistory = currentFtpWatts != null && currentWeightKg != null;
  const wantsWeightLoss = form.focusAreas.includes("weight_loss");

  const steps = useMemo(() => {
    const s = ["goal"];
    if (form.goalType === "event_prep") s.push("event");
    s.push("focus");
    if (wantsWeightLoss) s.push("weight");
    s.push("ftp", "hours", "strength", "notes", "review");
    return s;
  }, [form.goalType, wantsWeightLoss]);

  const currentStepIndex = Math.min(stepIndex, steps.length - 1);
  const currentStepKey = steps[currentStepIndex];

  const autoFtpResult = useMemo(() => {
    if (!hasFtpHistory) return null;
    return calculateTargetFtp({
      currentFtpWatts: currentFtpWatts as number,
      currentWeightKg: currentWeightKg as number,
      focusAreas: form.focusAreas,
      targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : null,
    });
  }, [form.focusAreas, form.targetWeightKg, hasFtpHistory, currentFtpWatts, currentWeightKg]);

  // Mientras el usuario no lo edite, el campo de revisión muestra el valor calculado.
  const displayedFtpValue =
    form.targetFtpManual ||
    (autoFtpResult ? String(Math.round(autoFtpResult.targetFtpWatts)) : "");

  const suggestedName = useMemo(
    () => suggestSeasonName(form.goalType, form.eventType, form.eventDate),
    [form.goalType, form.eventType, form.eventDate]
  );

  const effectiveSeasonName = form.seasonNameTouched ? form.seasonName : suggestedName;

  function canGoNext(): boolean {
    switch (currentStepKey) {
      case "goal":
        return form.goalType !== null;
      case "event":
        return form.eventType.trim() !== "" && form.eventDate !== "";
      case "ftp":
        return hasFtpHistory || form.targetFtpManual.trim() !== "";
      case "hours":
        return form.hoursPerWeek.trim() !== "" && Number(form.hoursPerWeek) > 0;
      case "strength":
        return form.strengthDaysPerWeek.trim() !== "";
      default:
        return true;
    }
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleConfirm() {
    setSubmitError(null);

    const finalTargetFtp = displayedFtpValue.trim() ? Number(displayedFtpValue) : null;
    const finalTargetWeightKg = wantsWeightLoss
      ? autoFtpResult?.effectiveTargetWeightKg ??
        (form.targetWeightKg ? Number(form.targetWeightKg) : null)
      : null;

    const input: NewSeasonInput = {
      name: effectiveSeasonName || suggestedName,
      goal_type: form.goalType as GoalType,
      target_date: form.goalType === "event_prep" ? form.eventDate : null,
      target_ftp: finalTargetFtp,
      target_weight_kg: finalTargetWeightKg,
      focus_areas: form.focusAreas,
      hours_per_week: Number(form.hoursPerWeek),
      strength_days_per_week: Number(form.strengthDaysPerWeek),
      notes: {
        ...(form.goalType === "event_prep" ? { event_type: form.eventType } : {}),
        ...(form.freeText.trim() ? { free_text: form.freeText.trim() } : {}),
        ...(autoFtpResult?.weightGoalWasCapped ? { weight_goal_capped: true } : {}),
      },
    };

    startTransition(async () => {
      const result = await submitOnboarding(input);
      if (result?.error) {
        setSubmitError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="metric text-xs text-fog uppercase tracking-wide">
          Paso {currentStepIndex + 1} de {steps.length}
        </p>
        <div className="flex gap-1.5">
          {steps.map((key, i) => (
            <span
              key={key}
              className={`h-1 flex-1 rounded-full ${i <= currentStepIndex ? "bg-volt" : "bg-fog/20"}`}
            />
          ))}
        </div>
      </div>

      {currentStepKey === "goal" && (
        <StepGoal value={form.goalType} onChange={(v) => update("goalType", v)} />
      )}
      {currentStepKey === "event" && (
        <StepEventDetails
          eventType={form.eventType}
          eventDate={form.eventDate}
          onEventTypeChange={(v) => update("eventType", v)}
          onEventDateChange={(v) => update("eventDate", v)}
        />
      )}
      {currentStepKey === "focus" && (
        <StepFocusAreas values={form.focusAreas} onChange={(v) => update("focusAreas", v)} />
      )}
      {currentStepKey === "weight" && (
        <StepWeightGoal value={form.targetWeightKg} onChange={(v) => update("targetWeightKg", v)} />
      )}
      {currentStepKey === "ftp" && (
        <StepFtpGoal
          value={form.targetFtpManual}
          onChange={(v) => update("targetFtpManual", v)}
          hasFtpHistory={hasFtpHistory}
        />
      )}
      {currentStepKey === "hours" && (
        <StepHours value={form.hoursPerWeek} onChange={(v) => update("hoursPerWeek", v)} />
      )}
      {currentStepKey === "strength" && (
        <StepStrength
          value={form.strengthDaysPerWeek}
          onChange={(v) => update("strengthDaysPerWeek", v)}
        />
      )}
      {currentStepKey === "notes" && (
        <StepNotes value={form.freeText} onChange={(v) => update("freeText", v)} />
      )}
      {currentStepKey === "review" && (
        <StepReview
          autoFtpResult={autoFtpResult}
          currentWeightKg={currentWeightKg}
          hasFtpHistory={hasFtpHistory}
          ftpValue={displayedFtpValue}
          onFtpChange={(v) => update("targetFtpManual", v)}
          seasonName={effectiveSeasonName}
          onSeasonNameChange={(v) => {
            setForm((prev) => ({ ...prev, seasonName: v, seasonNameTouched: true }));
          }}
        />
      )}

      {submitError && <p className="text-sm text-fatiga">{submitError}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={goBack} disabled={currentStepIndex === 0 || isPending}>
          Atrás
        </Button>
        {currentStepKey === "review" ? (
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Creando temporada..." : "Confirmar y crear temporada"}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canGoNext()}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
