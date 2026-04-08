import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-7 text-neutral-600 md:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
