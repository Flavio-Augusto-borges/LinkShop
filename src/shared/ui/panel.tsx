import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return <div className={`rounded-[1.5rem] border border-black/10 bg-white p-5 ${className}`.trim()}>{children}</div>;
}
