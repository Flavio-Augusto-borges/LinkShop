"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

type FixedRightSidebarLayoutProps = {
  main: ReactNode;
  sidebar: ReactNode;
  className?: string;
  mainClassName?: string;
  sidebarClassName?: string;
  desktopSidebarWidth?: number;
  desktopGap?: number;
  desktopTopOffset?: number;
  desktopMinMainWidth?: number;
  collapsedToggleLabel?: string;
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
  desktopTopOffset = 144,
  desktopMinMainWidth = 760,
  collapsedToggleLabel = "Filtrar"
}: FixedRightSidebarLayoutProps) {
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [isCollapsedPanelOpen, setIsCollapsedPanelOpen] = useState(false);
  const desktopBreakpoint = 1280;
  const edgeOffset = 16;

  useEffect(() => {
    function syncViewportWidth() {
      setViewportWidth(window.innerWidth);
    }

    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth, { passive: true });
    return () => window.removeEventListener("resize", syncViewportWidth);
  }, []);

  const isDesktop = (viewportWidth ?? 0) >= desktopBreakpoint;
  const requiredDockWidth = desktopMinMainWidth + desktopSidebarWidth + desktopGap + edgeOffset * 2;
  const canDockSidebar = isDesktop && (viewportWidth ?? 0) >= requiredDockWidth;

  useEffect(() => {
    if (!isDesktop || canDockSidebar) {
      setIsCollapsedPanelOpen(false);
    }
  }, [isDesktop, canDockSidebar]);

  const dockedPanelStyle = useMemo(
    () =>
      ({
        top: `${desktopTopOffset}px`,
        width: `${desktopSidebarWidth}px`,
        maxHeight: `calc(100vh - ${desktopTopOffset + 16}px)`
      }) as CSSProperties,
    [desktopTopOffset, desktopSidebarWidth]
  );

  const mainDockStyle = useMemo(
    () =>
      ({
        marginRight: `${desktopSidebarWidth + desktopGap}px`
      }) as CSSProperties,
    [desktopGap, desktopSidebarWidth]
  );

  const collapsedToggleStyle = useMemo(
    () =>
      ({
        top: `${desktopTopOffset + 20}px`
      }) as CSSProperties,
    [desktopTopOffset]
  );

  return (
    <section className={joinClasses("mt-6", className)}>
      <div className={joinClasses("min-w-0", mainClassName)} style={canDockSidebar ? mainDockStyle : undefined}>
        {main}
      </div>

      {!isDesktop ? (
        <aside className={joinClasses("mt-6 min-w-0", sidebarClassName)}>{sidebar}</aside>
      ) : canDockSidebar ? (
        <aside
          className={joinClasses(
            "fixed right-4 z-30 mt-0 overflow-y-auto 2xl:right-6",
            sidebarClassName
          )}
          style={dockedPanelStyle}
        >
          {sidebar}
        </aside>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsCollapsedPanelOpen((current) => !current)}
            className="fixed right-2 z-30 inline-flex items-center gap-2 rounded-l-xl bg-ink px-2 py-3 text-xs font-semibold text-white shadow-lg transition hover:bg-neutral-800"
            style={collapsedToggleStyle}
          >
            <span>{isCollapsedPanelOpen ? "→" : "←"}</span>
            <span>{collapsedToggleLabel}</span>
          </button>

          {isCollapsedPanelOpen ? (
            <>
              <button
                type="button"
                aria-label="Fechar painel de filtros"
                className="fixed inset-0 z-30 bg-black/30"
                onClick={() => setIsCollapsedPanelOpen(false)}
              />
              <aside
                className={joinClasses(
                  "fixed right-4 z-40 mt-0 overflow-y-auto rounded-[2rem] border border-white/60 bg-white/95 p-2 shadow-glow backdrop-blur 2xl:right-6",
                  sidebarClassName
                )}
                style={dockedPanelStyle}
              >
                {sidebar}
              </aside>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
