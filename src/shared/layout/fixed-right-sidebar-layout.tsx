import type { CSSProperties, ReactNode } from "react";

type FixedRightSidebarLayoutProps = {
  main: ReactNode;
  sidebar: ReactNode;
  className?: string;
  mainClassName?: string;
  sidebarClassName?: string;
  desktopSidebarWidth?: number;
  desktopGap?: number;
  desktopTopOffset?: number;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function FixedRightSidebarLayout({
  main,
  sidebar,
  className,
  mainClassName,
  sidebarClassName,
  desktopSidebarWidth = 320,
  desktopGap = 40,
  desktopTopOffset = 144
}: FixedRightSidebarLayoutProps) {
  const style = {
    "--fixed-sidebar-width": `${desktopSidebarWidth}px`,
    "--fixed-sidebar-gap": `${desktopGap}px`,
    "--fixed-sidebar-top": `${desktopTopOffset}px`
  } as CSSProperties;

  return (
    <section className={joinClasses("fixed-sidebar-layout", className)} style={style}>
      <div className={joinClasses("fixed-sidebar-layout-main", mainClassName)}>{main}</div>
      <aside className={joinClasses("fixed-sidebar-layout-panel", sidebarClassName)}>{sidebar}</aside>
    </section>
  );
}
