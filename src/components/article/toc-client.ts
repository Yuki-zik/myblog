const HEADER_OFFSET = 108;
const ACTIVE_OFFSET = 24;
const ACTIVE_VIEWPORT_RATIO = 0.32;
const MAX_ACTIVATION_LEAD = 220;
const MIN_INDICATOR_HEIGHT = 44;
const ACTIVE_CLASS = "is-active";
const MOBILE_TOC_MEDIA = "(max-width: 1180px)";
const HEADING_SCROLL_MARGIN_TOP = "calc(var(--site-header-offset, 6.5rem) + 1rem)";
const MANUAL_ACTIVE_LOCK_MS = 900;
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: `-${HEADER_OFFSET}px 0px -20% 0px`,
  threshold: [0, 0.35, 0.6, 1]
};

type TocLinkEntry = {
  id: string;
  link: HTMLAnchorElement;
  heading: HTMLElement;
};

type TocEntry = TocLinkEntry & {
  item: HTMLElement;
  parentId: string | null;
};

function getActivationLine(): number {
  return Math.min(
    Math.max(Math.round(window.innerHeight * ACTIVE_VIEWPORT_RATIO), HEADER_OFFSET + ACTIVE_OFFSET),
    HEADER_OFFSET + MAX_ACTIVATION_LEAD
  );
}

function resolveActiveId(headings: HTMLElement[]): string {
  if (headings.length === 0) {
    return "";
  }

  const scrollRoot = document.documentElement;
  const isAtDocumentEnd =
    window.scrollY + window.innerHeight >= scrollRoot.scrollHeight - Math.max(window.innerHeight * 0.08, 48);

  if (isAtDocumentEnd) {
    return headings[headings.length - 1]?.id ?? "";
  }

  const activationLine = getActivationLine();
  let activeId = headings[0]?.id ?? "";

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= activationLine) {
      activeId = heading.id;
      continue;
    }
    break;
  }

  return activeId;
}

function createActiveIdResolver(headings: HTMLElement[]) {
  let lockedId = "";
  let lockedUntil = 0;

  function clearLock(): void {
    lockedId = "";
    lockedUntil = 0;
  }

  return {
    lock(id: string): void {
      lockedId = id;
      lockedUntil = window.performance.now() + MANUAL_ACTIVE_LOCK_MS;
    },
    resolve(): string {
      if (lockedId) {
        const lockedHeading = headings.find((heading) => heading.id === lockedId);
        const lockExpired = window.performance.now() > lockedUntil;

        if (!lockedHeading || lockExpired) {
          clearLock();
        } else {
          const top = lockedHeading.getBoundingClientRect().top;
          const lowerBound = -HEADER_OFFSET - 24;

          if (top <= getActivationLine() + 24 && top >= lowerBound) {
            return lockedId;
          }

          clearLock();
        }
      }

      return resolveActiveId(headings);
    }
  };
}

function ensureHeadingScrollMargin(heading: HTMLElement): void {
  if (heading.dataset.tocBound === "true") {
    return;
  }

  heading.dataset.tocBound = "true";
  heading.style.scrollMarginTop = HEADING_SCROLL_MARGIN_TOP;
}

function collectTocLinkEntries(root: HTMLElement): TocLinkEntry[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"))
    .map((link) => {
      const id = link.dataset.targetId?.trim();
      if (!id) {
        return null;
      }

      const heading = document.getElementById(id);
      if (!(heading instanceof HTMLElement)) {
        return null;
      }

      ensureHeadingScrollMargin(heading);
      return { id, link, heading } satisfies TocLinkEntry;
    })
    .filter((entry): entry is TocLinkEntry => entry !== null);
}

function collectSidebarEntries(root: HTMLElement): TocEntry[] {
  return collectTocLinkEntries(root)
    .map((entry) => {
      const item = entry.link.closest<HTMLElement>("[data-toc-item]");
      if (!(item instanceof HTMLElement)) {
        return null;
      }

      return {
        ...entry,
        item,
        parentId: item.dataset.parentId ?? null
      } satisfies TocEntry;
    })
    .filter((entry): entry is TocEntry => entry !== null);
}

function applyLinkState(entries: TocLinkEntry[], activeId: string): void {
  entries.forEach((entry) => {
    const isActive = entry.id === activeId;
    entry.link.classList.toggle(ACTIVE_CLASS, isActive);
    if (isActive) {
      entry.link.setAttribute("aria-current", "true");
    } else {
      entry.link.removeAttribute("aria-current");
    }
  });
}

function observeHeadings(headings: HTMLElement[], requestSync: () => void): IntersectionObserver {
  const observer = new IntersectionObserver(() => {
    requestSync();
  }, OBSERVER_OPTIONS);

  headings.forEach((heading) => observer.observe(heading));
  return observer;
}

function bindTocLinkClicks(
  entries: TocLinkEntry[],
  onActivate: (id: string) => void,
  afterSelect?: () => void
): () => void {
  const cleanup: Array<() => void> = [];

  entries.forEach((entry) => {
    const onClick = (event: MouseEvent) => {
      event.preventDefault();

      onActivate(entry.id);
      window.history.replaceState(null, "", `#${entry.id}`);
      entry.heading.scrollIntoView({ behavior: "smooth", block: "start" });
      afterSelect?.();
    };

    entry.link.addEventListener("click", onClick);
    cleanup.push(() => entry.link.removeEventListener("click", onClick));
  });

  return () => {
    cleanup.forEach((dispose) => dispose());
  };
}

function createSyncScheduler(sync: () => void): { requestSync: () => void; cancel: () => void } {
  let rafId = 0;

  return {
    requestSync() {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        sync();
      });
    },
    cancel() {
      if (!rafId) {
        return;
      }
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}

function updateProgress(
  entries: TocEntry[],
  activeId: string,
  trackLine: HTMLElement,
  progressLine: HTMLElement,
  scrollBody: HTMLElement
): void {
  const activeEntry = entries.find((entry) => entry.id === activeId) ?? entries[0];

  if (!activeEntry) {
    progressLine.style.height = "0px";
    progressLine.style.transform = "translateY(0px)";
    return;
  }

  const bodyRect = scrollBody.getBoundingClientRect();
  const renderProgress = () => {
    const trackRect = trackLine.getBoundingClientRect();
    const activeRect = activeEntry.link.getBoundingClientRect();
    const desiredHeight = Math.min(Math.max(activeRect.height - 6, MIN_INDICATOR_HEIGHT), trackRect.height);
    const activeCenter = activeRect.top - trackRect.top + activeRect.height / 2;
    const rawOffset = Math.max(activeCenter - desiredHeight / 2, 0);
    const maxOffset = Math.max(trackRect.height - desiredHeight, 0);
    const offset = Math.min(rawOffset, maxOffset);

    progressLine.style.transform = `translateY(${offset}px)`;
    progressLine.style.height = `${desiredHeight}px`;
    scrollBody.dataset.activeId = activeEntry.id;
  };

  const activeRect = activeEntry.link.getBoundingClientRect();
  const isOutsideViewport = activeRect.top < bodyRect.top || activeRect.bottom > bodyRect.bottom;
  if (isOutsideViewport) {
    let renderedAfterScroll = false;
    const handleScrollSettle = () => {
      renderedAfterScroll = true;
      renderProgress();
    };

    scrollBody.addEventListener("scroll", handleScrollSettle, { passive: true, once: true });
    activeEntry.item.scrollIntoView({ block: "nearest" });
    window.setTimeout(() => {
      if (!renderedAfterScroll) {
        renderProgress();
      }
    }, 140);
    return;
  }

  renderProgress();
}

function applySidebarState(
  entries: TocEntry[],
  activeId: string,
  itemById: Map<string, HTMLElement>,
  trackLine: HTMLElement,
  progressLine: HTMLElement,
  scrollBody: HTMLElement
): void {
  applyLinkState(entries, activeId);

  entries.forEach((entry) => {
    entry.item.classList.remove("is-active-branch");
  });

  const activeEntry = entries.find((entry) => entry.id === activeId);
  if (activeEntry) {
    activeEntry.item.classList.add("is-active-branch");
    if (activeEntry.parentId) {
      itemById.get(activeEntry.parentId)?.classList.add("is-active-branch");
    }
  }

  updateProgress(entries, activeId, trackLine, progressLine, scrollBody);
}

export function initTocSidebar(root: Element): (() => void) | void {
  if (!(root instanceof HTMLElement) || root.dataset.ready === "true") {
    return;
  }
  root.dataset.ready = "true";

  const scrollBody = root.querySelector<HTMLElement>("[data-toc-sidebar-body]");
  const trackLine = root.querySelector<HTMLElement>(".toc-sidebar__track");
  const progressLine = root.querySelector<HTMLElement>("[data-toc-progress]");
  const entries = collectSidebarEntries(root);

  if (!scrollBody || !trackLine || !progressLine || entries.length === 0) {
    root.hidden = true;
    return;
  }

  const itemById = new Map(entries.map((entry) => [entry.id, entry.item]));
  const headings = entries.map((entry) => entry.heading);
  const activeResolver = createActiveIdResolver(headings);
  let activeId = headings[0]?.id ?? "";

  const { requestSync, cancel } = createSyncScheduler(() => {
    const nextActiveId = activeResolver.resolve();
    if (!nextActiveId) {
      return;
    }
    activeId = nextActiveId;
    applySidebarState(entries, activeId, itemById, trackLine, progressLine, scrollBody);
  });

  const observer = observeHeadings(headings, requestSync);
  const removeClickHandlers = bindTocLinkClicks(entries, (id) => {
    activeResolver.lock(id);
    activeId = id;
    applySidebarState(entries, activeId, itemById, trackLine, progressLine, scrollBody);
  });

  const onResize = () => requestSync();
  const onScroll = () => requestSync();
  const onHashChange = () => requestSync();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("site-header-framechange", onResize);

  requestSync();

  return () => {
    observer.disconnect();
    removeClickHandlers();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("site-header-framechange", onResize);
    cancel();
  };
}

export function initPostToc(root: Element): (() => void) | void {
  if (!(root instanceof HTMLElement) || root.dataset.ready === "true") {
    return;
  }
  root.dataset.ready = "true";

  const entries = collectTocLinkEntries(root);
  if (entries.length === 0) {
    return;
  }

  const headings = entries.map((entry) => entry.heading);
  const activeResolver = createActiveIdResolver(headings);
  const mobileDetails = root.querySelector<HTMLDetailsElement>("[data-post-toc-mobile]");

  const { requestSync, cancel } = createSyncScheduler(() => {
    applyLinkState(entries, activeResolver.resolve());
  });

  const observer = observeHeadings(headings, requestSync);
  const removeClickHandlers = bindTocLinkClicks(
    entries,
    (id) => {
      activeResolver.lock(id);
      applyLinkState(entries, id);
    },
    () => {
      if (!(mobileDetails instanceof HTMLDetailsElement)) {
        return;
      }
      if (!window.matchMedia(MOBILE_TOC_MEDIA).matches) {
        return;
      }
      window.setTimeout(() => {
        mobileDetails.open = false;
      }, 40);
    }
  );

  const onResize = () => requestSync();
  const onScroll = () => requestSync();
  const onHashChange = () => requestSync();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("site-header-framechange", onResize);

  requestSync();

  return () => {
    observer.disconnect();
    removeClickHandlers();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("site-header-framechange", onResize);
    cancel();
  };
}
