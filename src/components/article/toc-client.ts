const HEADER_OFFSET = 108;
const ACTIVE_OFFSET = 24;
const ACTIVE_VIEWPORT_RATIO = 0.32;
const MAX_ACTIVATION_LEAD = 220;
const MIN_INDICATOR_HEIGHT = 44;
const SETTLE_EPSILON = 0.5;
const SETTLE_STABLE_FRAMES = 2;
const SETTLE_MAX_FRAMES = 30;
const ACTIVE_CLASS = "is-active";
const MOBILE_TOC_MEDIA = "(max-width: 1180px)";
const HEADING_SCROLL_MARGIN_TOP =
  "calc(var(--site-header-offset, 6.5rem) + 1rem)";
const MANUAL_ACTIVE_LOCK_MS = 900;
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: `-${HEADER_OFFSET}px 0px -20% 0px`,
  threshold: [0, 0.35, 0.6, 1],
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
    Math.max(
      Math.round(window.innerHeight * ACTIVE_VIEWPORT_RATIO),
      HEADER_OFFSET + ACTIVE_OFFSET,
    ),
    HEADER_OFFSET + MAX_ACTIVATION_LEAD,
  );
}

function resolveActiveId(headings: HTMLElement[]): string {
  if (headings.length === 0) {
    return "";
  }

  const scrollRoot = document.documentElement;
  const isAtDocumentEnd =
    window.scrollY + window.innerHeight >=
    scrollRoot.scrollHeight - Math.max(window.innerHeight * 0.08, 48);

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
    /*
     * Extend the lock while a click-initiated smooth scroll is still running.
     *
     * A fixed expiry is a bet on how long the browser takes to settle, and it
     * loses whenever the machine is loaded. Refreshing it on every scroll tick
     * ties the lock to the scroll actually being in progress instead.
     */
    keepAlive(): void {
      if (lockedId) {
        lockedUntil = window.performance.now() + MANUAL_ACTIVE_LOCK_MS;
      }
    },
    isLocked(): boolean {
      return lockedId !== "";
    },
    resolve(): string {
      if (lockedId) {
        const lockedHeading = headings.find(
          (heading) => heading.id === lockedId,
        );
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
    },
  };
}

function ensureHeadingScrollMargin(heading: HTMLElement): void {
  if (heading.dataset.tocBound === "true") {
    return;
  }

  heading.dataset.tocBound = "true";
  heading.style.scrollMarginTop = HEADING_SCROLL_MARGIN_TOP;
}

/*
 * Scroll a heading to just under the sticky header.
 *
 * `heading.scrollIntoView()` honours `scroll-margin-top`, but only when the
 * browser decides a scroll is needed at all. Clicking a TOC entry whose anchor
 * is already the current hash — or whose heading is merely off-screen *above*
 * the header — could therefore leave the heading parked underneath the header,
 * which in turn let the active-section resolver hand the highlight to the
 * following section as soon as the manual lock expired. Computing the target
 * position explicitly makes the landing position deterministic.
 */
function scrollHeadingIntoReadingPosition(heading: HTMLElement): void {
  const styles = window.getComputedStyle(heading);
  const margin = Number.parseFloat(styles.scrollMarginTop);
  const offset = Number.isFinite(margin) ? margin : HEADER_OFFSET;
  const target = heading.getBoundingClientRect().top + window.scrollY - offset;
  const maxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0,
  );

  window.scrollTo({
    top: Math.min(Math.max(target, 0), maxScroll),
    behavior: "smooth",
  });
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
        parentId: item.dataset.parentId ?? null,
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

function observeHeadings(
  headings: HTMLElement[],
  requestSync: () => void,
): IntersectionObserver {
  const observer = new IntersectionObserver(() => {
    requestSync();
  }, OBSERVER_OPTIONS);

  headings.forEach((heading) => observer.observe(heading));
  return observer;
}

function bindTocLinkClicks(
  entries: TocLinkEntry[],
  onActivate: (id: string) => void,
  afterSelect?: () => void,
): () => void {
  const cleanup: Array<() => void> = [];

  entries.forEach((entry) => {
    const onClick = (event: MouseEvent) => {
      event.preventDefault();

      onActivate(entry.id);
      window.history.replaceState(null, "", `#${entry.id}`);
      scrollHeadingIntoReadingPosition(entry.heading);
      afterSelect?.();
    };

    entry.link.addEventListener("click", onClick);
    cleanup.push(() => entry.link.removeEventListener("click", onClick));
  });

  return () => {
    cleanup.forEach((dispose) => dispose());
  };
}

function createSyncScheduler(sync: () => void): {
  requestSync: () => void;
  cancel: () => void;
} {
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
    },
  };
}

/*
 * Pending settle loops, keyed by the progress element so a sidebar can never
 * run two of them at once.
 */
const settleHandles = new WeakMap<HTMLElement, number>();

/*
 * `scrollIntoView({ block: "nearest" })` equivalent that is scoped to a single
 * container: it never touches the page scroll or any other ancestor.
 */
function scrollItemIntoViewWithin(
  container: HTMLElement,
  item: HTMLElement,
): void {
  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  if (itemRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - itemRect.top;
    return;
  }

  if (itemRect.bottom > containerRect.bottom) {
    container.scrollTop += itemRect.bottom - containerRect.bottom;
  }
}

function cancelSettle(progressLine: HTMLElement): void {
  const handle = settleHandles.get(progressLine);
  if (handle !== undefined) {
    window.cancelAnimationFrame(handle);
    settleHandles.delete(progressLine);
    delete progressLine.dataset.instant;
  }
}

function updateProgress(
  entries: TocEntry[],
  activeId: string,
  trackLine: HTMLElement,
  progressLine: HTMLElement,
  scrollBody: HTMLElement,
): void {
  const activeEntry =
    entries.find((entry) => entry.id === activeId) ?? entries[0];

  cancelSettle(progressLine);

  if (!activeEntry) {
    delete progressLine.dataset.instant;
    progressLine.style.height = "0px";
    progressLine.style.transform = "translateY(0px)";
    return;
  }

  const renderProgress = (): number => {
    const trackRect = trackLine.getBoundingClientRect();
    const activeRect = activeEntry.link.getBoundingClientRect();
    const desiredHeight = Math.min(
      Math.max(activeRect.height - 6, MIN_INDICATOR_HEIGHT),
      trackRect.height,
    );
    const activeCenter = activeRect.top - trackRect.top + activeRect.height / 2;
    const rawOffset = Math.max(activeCenter - desiredHeight / 2, 0);
    const maxOffset = Math.max(trackRect.height - desiredHeight, 0);
    const offset = Math.min(rawOffset, maxOffset);

    progressLine.style.transform = `translateY(${offset}px)`;
    progressLine.style.height = `${desiredHeight}px`;
    scrollBody.dataset.activeId = activeEntry.id;
    return offset;
  };

  const scrollTopBefore = scrollBody.scrollTop;
  /*
   * Only the TOC's own scroller may move here.
   *
   * `scrollIntoView` walks every scrollable ancestor, so on a TOC link click it
   * also nudged the page — which then fought the smooth `heading.scrollIntoView`
   * that `bindTocLinkClicks` performs immediately afterwards, leaving the target
   * heading under the sticky header. Scrolling the container directly keeps the
   * catch-up local.
   */
  scrollItemIntoViewWithin(scrollBody, activeEntry.item);

  /*
   * `scrollIntoView` on this container is synchronous (the TOC body resolves to
   * `scroll-behavior: auto`), so comparing scrollTop here tells us whether this
   * update is a catch-up that moved the list under the indicator.
   */
  const tocScrolled = Math.abs(scrollBody.scrollTop - scrollTopBefore) > 0.5;
  if (tocScrolled) {
    progressLine.dataset.instant = "true";
  }

  /*
   * Re-measure until the sticky sidebar, the page scroll and the TOC's own
   * scroll have all settled.
   *
   * Measuring once right after scrollIntoView() is not enough. While the
   * layout is still in flight the active link can measure *above* the track,
   * which drives `activeCenter` negative and clamps the indicator to offset 0
   * — so jumping to the end of a long article made the rail visibly snap to
   * the top before sliding back down. The previous implementation tried to
   * cover that with a one-shot scroll listener plus a fixed 140ms timer; the
   * listener never fires when scrollIntoView() is a no-op, and 140ms is a
   * guess that loses on a slow frame.
   */
  let previous = renderProgress();
  let stableFrames = 0;
  let frames = 0;

  const finish = () => {
    delete progressLine.dataset.instant;
  };

  const step = () => {
    settleHandles.delete(progressLine);

    const next = renderProgress();
    frames += 1;
    stableFrames =
      Math.abs(next - previous) <= SETTLE_EPSILON ? stableFrames + 1 : 0;
    previous = next;

    if (stableFrames >= SETTLE_STABLE_FRAMES || frames >= SETTLE_MAX_FRAMES) {
      finish();
      return;
    }

    settleHandles.set(progressLine, window.requestAnimationFrame(step));
  };

  settleHandles.set(progressLine, window.requestAnimationFrame(step));
}

function applySidebarState(
  entries: TocEntry[],
  activeId: string,
  itemById: Map<string, HTMLElement>,
  trackLine: HTMLElement,
  progressLine: HTMLElement,
  scrollBody: HTMLElement,
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

/*
 * Collapse state, remembered across navigations.
 *
 * Reading a long article is a repeated activity, so a reader who folds the
 * contents away expects it to stay folded on the next post rather than having
 * to dismiss it every time.
 */
const TOC_COLLAPSE_KEY = "toc-collapsed";
/*
 * Deliberately unhurried. Folding away a whole column of links is a large
 * movement, and at the original 380ms it read as a snap rather than a fold.
 */
const TOC_COLLAPSE_MS = 520;
/*
 * A symmetric ease-in-out, not the site's default `--ease-out`
 * (cubic-bezier(0.22, 1, 0.36, 1)) and not a decelerate curve.
 *
 * Both of those are tuned for small movements. Measured over this several
 * hundred pixel fold, `--ease-out` was 76% done at a quarter of the duration
 * and a decelerate curve was 78% done at the halfway point, so most of the
 * travel happened up front and the rest crawled — which reads as a jump
 * followed by a stall rather than as a smooth fold. An even curve spends the
 * distance at a steady rate.
 */
const TOC_COLLAPSE_EASE = "cubic-bezier(0.45, 0.05, 0.55, 0.95)";

function readCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(TOC_COLLAPSE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean): void {
  try {
    window.localStorage.setItem(TOC_COLLAPSE_KEY, collapsed ? "true" : "false");
  } catch {
    /* Private mode or blocked storage: the toggle still works for this page. */
  }
}

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

function bindCollapseToggle(
  root: HTMLElement,
  onChange: () => void,
): (() => void) | void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-toc-toggle]");
  const viewport = root.querySelector<HTMLElement>(".toc-sidebar__viewport");
  if (!toggle || !viewport) {
    return;
  }

  let animation: Animation | null = null;

  const setState = (collapsed: boolean) => {
    root.dataset.collapsed = collapsed ? "true" : "false";
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  };

  /*
   * Animate an explicit height rather than a CSS `grid-template-rows`
   * transition.
   *
   * The grid `1fr -> 0fr` technique registers a transition here but does not
   * interpolate — measured with forced frames, the height jumps straight from
   * full to zero — because the row resolves against a capped container. Driving
   * the height directly is predictable, and `finished` gives a reliable hook
   * for clearing the inline style afterwards.
   */
  const animateTo = (collapsed: boolean) => {
    animation?.cancel();
    // A cancelled run never reaches its `finished` handler, so drop the hint
    // here rather than leaving a compositing layer alive for the whole page.
    viewport.style.willChange = "";

    if (prefersReducedMotion()) {
      setState(collapsed);
      viewport.style.height = "";
      return;
    }

    const from = viewport.getBoundingClientRect().height;
    setState(collapsed);
    // Measure the target after the state flips so the open height reflects the
    // real content rather than a guess.
    viewport.style.height = "";
    const to = collapsed ? 0 : viewport.getBoundingClientRect().height;

    // Tell the browser what is about to change, and withdraw the hint as soon
    // as it stops being true rather than leaving the layer alive for the page.
    viewport.style.willChange = "height";

    animation = viewport.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      {
        duration: TOC_COLLAPSE_MS,
        easing: TOC_COLLAPSE_EASE,
        fill: "backwards",
      },
    );

    animation.finished
      .then(() => {
        viewport.style.height = "";
        viewport.style.willChange = "";
        if (!collapsed) {
          onChange();
        }
      })
      .catch(() => {
        /* Cancelled by a newer toggle; that run owns the cleanup. */
      });
  };

  // Restore the stored preference without animating on first paint: a reader
  // who left the contents folded should find them already folded, not watch
  // them close.
  root.dataset.tocMotion = "off";
  setState(readCollapsedPreference());
  requestAnimationFrame(() => {
    delete root.dataset.tocMotion;
  });

  const onClick = () => {
    const next = root.dataset.collapsed !== "true";
    animateTo(next);
    writeCollapsedPreference(next);
  };

  toggle.addEventListener("click", onClick);
  return () => {
    animation?.cancel();
    viewport.style.willChange = "";
    toggle.removeEventListener("click", onClick);
  };
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
    applySidebarState(
      entries,
      activeId,
      itemById,
      trackLine,
      progressLine,
      scrollBody,
    );
  });

  const observer = observeHeadings(headings, requestSync);
  const removeClickHandlers = bindTocLinkClicks(entries, (id) => {
    activeResolver.lock(id);
    activeId = id;
    applySidebarState(
      entries,
      activeId,
      itemById,
      trackLine,
      progressLine,
      scrollBody,
    );
  });

  const onResize = () => requestSync();
  /*
   * Scroll events keep the manual lock alive, so a click-initiated smooth
   * scroll holds the reader's selection for as long as it is actually running
   * rather than for a fixed guess. The lock still expires normally once the
   * page stops moving.
   */
  const onScroll = () => {
    activeResolver.keepAlive();
    requestSync();
  };
  const onHashChange = () => requestSync();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("site-header-framechange", onResize);

  const removeCollapseToggle = bindCollapseToggle(root, requestSync);

  requestSync();

  return () => {
    observer.disconnect();
    removeClickHandlers();
    removeCollapseToggle?.();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("site-header-framechange", onResize);
    cancelSettle(progressLine);
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
  const mobileDetails = root.querySelector<HTMLDetailsElement>(
    "[data-post-toc-mobile]",
  );

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
    },
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
