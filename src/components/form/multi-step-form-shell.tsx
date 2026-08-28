"use client";

import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MultiStepFormStep<TFormValues extends FieldValues> {
  id: string;
  title: string;
  description?: string;
  fields: FieldPath<TFormValues>[];
  content: React.ReactNode;
}

export interface MultiStepFormShellProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  steps: MultiStepFormStep<TFormValues>[];
  onSubmit: (values: TFormValues) => void | Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  nextLabel: string;
  backLabel: string;
  stepIndicatorLabel?: (
    current: number,
    total: number,
    title: string,
  ) => string;
  className?: string;
}

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

export function MultiStepFormShell<TFormValues extends FieldValues>({
  form,
  steps,
  onSubmit,
  submitLabel,
  submittingLabel,
  nextLabel,
  backLabel,
  stepIndicatorLabel,
  className,
}: MultiStepFormShellProps<TFormValues>) {
  "use no memo";

  const [currentStep, setCurrentStep] = React.useState(0);
  const {
    handleSubmit,
    trigger,
    formState: { isSubmitting },
  } = form;

  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];

  async function goNext() {
    const valid = await trigger(step.fields, { shouldFocus: true });
    if (!valid) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function goToStep(target: number) {
    if (target === currentStep) return;
    if (target < currentStep) {
      setCurrentStep(target);
      return;
    }
    // moving forward — validate every step in between
    for (let i = currentStep; i < target; i++) {
      const valid = await trigger(steps[i].fields, { shouldFocus: true });
      if (!valid) {
        setCurrentStep(i);
        return;
      }
    }
    setCurrentStep(target);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("mx-auto flex w-full max-w-2xl flex-col gap-6", className)}
    >
      {/* Progress indicator */}
      <div>
        <div className="mb-2 flex justify-between">
          {steps.map((s, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isClickable = index <= currentStep;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  aria-label={s.title}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "h-4 w-4 rounded-full transition-colors duration-300",
                    isCompleted && "bg-primary",
                    isActive && "bg-primary ring-4 ring-primary/20",
                    !isCompleted && !isActive && "cursor-not-allowed bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "hidden text-xs sm:block",
                    isActive
                      ? "font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step card */}
      <Card className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              {step.description && (
                <CardDescription>{step.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {step.content}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0 || isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Button>

          {isLast ? (
            <Button type="submit" disabled={isSubmitting} className="gap-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {submittingLabel}
                </>
              ) : (
                <>
                  {submitLabel}
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="gap-1"
            >
              {nextLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {stepIndicatorLabel && (
        <div className="text-center text-sm text-muted-foreground">
          {stepIndicatorLabel(currentStep + 1, steps.length, step.title)}
        </div>
      )}
    </form>
  );
}
