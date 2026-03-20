const HEADER_OFFSET = 112;
const ACTIVE_OFFSET = 24;
const MIN_INDICATOR_HEIGHT = 44;

type TocEntry = {
  id: string;
  link: HTMLAnchorElement;
  item: HTMLElement;
  heading: HTMLElement;
  parentId: string | null;
};

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

  const activationLine = HEADER_OFFSET + ACTIVE_OFFSET;
  let activeId = headings[0].id;

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= activationLine) {
      activeId = heading.id;
      continue;
    }
    break;
  }

  return activeId;
}

function updateProgress(
  entries: TocEntry[],
  activeId: string,
  list: HTMLElement,
  progressLine: HTMLElement,
  scrollBody: HTMLElement
): void {
  const activeEntry = entries.find((entry) => entry.id === activeId) ?? entries[0];

  if (!activeEntry) {
    progressLine.style.height = "0px";
    progressLine.style.transform = "translateY(0px)";
    return;
  }

  const listRect = list.getBoundingClientRect();
  const activeRect = activeEntry.link.getBoundingClientRect();
  const offset = Math.max(activeRect.top - listRect.top + 2, 0);
  const height = Math.min(
    Math.max(activeRect.height - 6, MIN_INDICATOR_HEIGHT),
    Math.max(listRect.height - offset, MIN_INDICATOR_HEIGHT)
  );

  progressLine.style.transform = `translateY(${offset}px)`;
  progressLine.style.height = `${height}px`;
  activeEntry.item.scrollIntoView({ block: "nearest" });
  scrollBody.dataset.activeId = activeEntry.id;
}

function applyState(
  entries: TocEntry[],
  activeId: string,
  itemById: Map<string, HTMLElement>,
  list: HTMLElement,
  progressLine: HTMLElement,
  scrollBody: HTMLElement
): void {
  entries.forEach((entry) => {
    entry.link.classList.toggle("is-active", entry.id === activeId);
    entry.item.classList.toggle("is-active-branch", entry.id === activeId);
  });

  const activeEntry = entries.find((entry) => entry.id === activeId);
  if (activeEntry?.parentId) {
    itemById.get(activeEntry.parentId)?.classList.add("is-active-branch");
  }

  updateProgress(entries, activeId, list, progressLine, scrollBody);
}

export function initTocSidebar(root: Element): (() => void) | void {
  if (!(root instanceof HTMLElement) || root.dataset.ready === "true") {
    return;
  }
  root.dataset.ready = "true";

  const scrollBody = root.querySelector<HTMLElement>("[data-toc-sidebar-body]");
  const list = root.querySelector<HTMLElement>("[data-toc-list]");
  const progressLine = root.querySelector<HTMLElement>("[data-toc-progress]");
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"));

  if (!scrollBody || !list || !progressLine || links.length === 0) {
    root.hidden = true;
    return;
  }

  const entries = links
    .map((link) => {
      const id = link.dataset.targetId;
      if (!id) {
        return null;
      }

      const heading = document.getElementById(id);
      const item = link.closest<HTMLElement>("[data-toc-item]");
      if (!(heading instanceof HTMLElement) || !(item instanceof HTMLElement)) {
        return null;
      }

      heading.dataset.tocBound = "true";
      heading.style.scrollMarginTop = "calc(var(--site-header-offset, 6.5rem) + 1rem)";

      return {
        id,
        link,
        item,
        heading,
        parentId: item.dataset.parentId ?? null
      } satisfies TocEntry;
    })
    .filter((entry): entry is TocEntry => entry !== null);

  if (entries.length === 0) {
    root.hidden = true;
    return;
  }

  const itemById = new Map(entries.map((entry) => [entry.id, entry.item]));
  const headings = entries.map((entry) => entry.heading);
  let activeId = headings[0]?.id ?? "";
  let rafId = 0;

  const sync = () => {
    rafId = 0;
    const nextActiveId = resolveActiveId(headings);
    if (!nextActiveId) {
      return;
    }
    activeId = nextActiveId;
    applyState(entries, activeId, itemById, list, progressLine, scrollBody);
  };

  const requestSync = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(sync);
  };

  const observer = new IntersectionObserver(
    () => {
      requestSync();
    },
    {
      rootMargin: `-${HEADER_OFFSET}px 0px -62% 0px`,
      threshold: [0, 0.35, 0.6, 1]
    }
  );

  headings.forEach((heading) => observer.observe(heading));

  const onResize = () => requestSync();
  const onScroll = () => requestSync();
  const onHashChange = () => requestSync();

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const id = link.dataset.targetId;
      if (!id) {
        return;
      }

      const target = document.getElementById(id);
      if (!(target instanceof HTMLElement)) {
        return;
      }

      activeId = id;
      applyState(entries, activeId, itemById, list, progressLine, scrollBody);
      window.history.replaceState(null, "", `#${id}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("site-header-framechange", onResize);

  requestSync();

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("site-header-framechange", onResize);
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  };
}
