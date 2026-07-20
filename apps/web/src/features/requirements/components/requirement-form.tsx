import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  requirementFormSchema,
  type RequirementFormValues,
} from '../requirement.schema';
import type { DirectoryUser } from '../api/requirements.types';

type Masters = {
  clients: { id: string; name: string }[];
  families: { id: string; name: string }[];
  priorities: { code: string; label: string }[];
  taUsers: DirectoryUser[];
  salesUsers: DirectoryUser[];
};

type Props = {
  masters: Masters;
  defaultValues: RequirementFormValues;
  submitLabel: string;
  isPending?: boolean;
  showSalesOwner?: boolean;
  taFieldsOnly?: boolean;
  onSubmit: (values: RequirementFormValues) => void;
  onCancel?: () => void;
};

export function RequirementForm({
  masters,
  defaultValues,
  submitLabel,
  isPending,
  showSalesOwner,
  taFieldsOnly,
  onSubmit,
  onCancel,
}: Props) {
  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;
  const positions = watch('numberOfPositions');

  if (taFieldsOnly) {
    return (
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Field label="TA Owner" error={errors.taOwnerId?.message}>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            {...register('taOwnerId')}
          >
            <option value="">Unassigned</option>
            {masters.taUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="TA Handoff Date" error={errors.taHandoffDate?.message}>
          <Input type="date" {...register('taHandoffDate')} />
        </Field>
        <Field label="Remarks" error={errors.remarks?.message}>
          <Input {...register('remarks')} />
        </Field>
        <div className="sm:col-span-3 flex gap-2">
          <Button type="submit" disabled={isPending}>
            {submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Section title="Core">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Requirement Date *" error={errors.requirementDate?.message}>
            <Input type="date" {...register('requirementDate')} />
          </Field>
          <Field label="Role / Skill *" error={errors.roleSkill?.message}>
            <Input placeholder="e.g. Python Developer" {...register('roleSkill')} />
          </Field>
          <Field
            label="Number Of Positions *"
            error={errors.numberOfPositions?.message}
            hint={`Starts as ${Math.max(1, Number(positions) || 1)} open / 0 closed`}
          >
            <Input type="number" min={1} {...register('numberOfPositions')} />
          </Field>
          <Field label="Client Name *" error={errors.clientId?.message}>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              {...register('clientId')}
            >
              <option value="">Select client…</option>
              {masters.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Job Family *" error={errors.jobFamilyId?.message}>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              {...register('jobFamilyId')}
            >
              <option value="">Select job family…</option>
              {masters.families.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority *" error={errors.priorityCode?.message}>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              {...register('priorityCode')}
            >
              <option value="">Select priority…</option>
              {masters.priorities.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          {showSalesOwner ? (
            <Field label="Sales Owner *" error={errors.salesOwnerId?.message}>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                {...register('salesOwnerId')}
              >
                <option value="">Select sales owner…</option>
                {masters.salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <input type="hidden" {...register('salesOwnerId')} />
          )}
        </div>
      </Section>

      <Section title="Owners & Dates (optional at create)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="TA Owner" error={errors.taOwnerId?.message}>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              {...register('taOwnerId')}
            >
              <option value="">Assign later…</option>
              {masters.taUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="TA Handoff Date" error={errors.taHandoffDate?.message}>
            <Input type="date" {...register('taHandoffDate')} />
          </Field>
          <Field
            label="Target Closure Date"
            error={errors.targetClosureDate?.message}
          >
            <Input type="date" {...register('targetClosureDate')} />
          </Field>
        </div>
      </Section>

      <Section title="Commercials (optional)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Job Location" error={errors.jobLocation?.message}>
            <Input {...register('jobLocation')} />
          </Field>
          <Field label="Experience" error={errors.experience?.message}>
            <Input {...register('experience')} />
          </Field>
          <Field label="Min Budget" error={errors.minBudget?.message}>
            <Input type="number" min={0} step="0.01" {...register('minBudget')} />
          </Field>
          <Field label="Max Budget" error={errors.maxBudget?.message}>
            <Input type="number" min={0} step="0.01" {...register('maxBudget')} />
          </Field>
          <Field
            label="Duration of Project (Months)"
            error={errors.durationMonths?.message}
          >
            <Input type="number" min={1} {...register('durationMonths')} />
          </Field>
        </div>
      </Section>

      <Section title="Remarks">
        <Field label="Remarks" error={errors.remarks?.message}>
          <Input {...register('remarks')} />
        </Field>
      </Section>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
