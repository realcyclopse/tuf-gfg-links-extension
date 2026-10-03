/**
 * TUF GeeksforGeeks External Links Content Script
 * Enhances TakeUForward with verified direct GeeksforGeeks links.
 * 100% native UI look & feel.
 */

(function () {
  "use strict";

  console.log("[TUF-GFG] TUF GeeksforGeeks Content Script initialized.");

  let problemsData = [];
  const problemsBySlug = new Map();
  const problemsByTitle = new Map();
  const problemsByExactTitle = new Map();
  let isInitialized = false;

  function normalize(str) {
    if (!str || typeof str !== "string") return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function validateGfgUrl(url) {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith("https://")) return null;
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname === "www.geeksforgeeks.org" || parsed.hostname === "geeksforgeeks.org") {
        return trimmed;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // Load verified GFG dataset
  async function loadData() {
    try {
      console.log("[TUF-GFG] Fetching problems.json...");
      const dataUrl = chrome.runtime.getURL("data/problems.json");
      console.log("[TUF-GFG] Data URL:", dataUrl);
      const resp = await fetch(dataUrl);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      problemsData = await resp.json();
      console.log("[TUF-GFG] Loaded problems data count:", problemsData.length);

      for (const item of problemsData) {
        if (!item || !item.question) continue;

        const exactTitle = item.question.trim().toLowerCase();
        const normTitle = normalize(item.question);
        problemsByExactTitle.set(exactTitle, item);
        problemsByTitle.set(normTitle, item);

        if (item.slug) {
          const normSlug = normalize(item.slug);
          problemsBySlug.set(normSlug, item);
        }
      }

      isInitialized = true;
      scanAndEnhance();
    } catch (err) {
      console.error("[TUF-GFG] Failed to load problem data:", err);
    }
  }

  function findProblemData(row) {
    if (!isInitialized) return null;

    // Strategy 1: Find practice link inside row or card
    const practiceLinks = row.querySelectorAll('a[href*="/practice/dsa/"], a[href*="/practice/"]');
    for (const a of practiceLinks) {
      const href = a.getAttribute("href") || "";
      const m = href.match(/\/practice\/dsa\/([^?#/]+)/);
      if (m && m[1]) {
        const slugNorm = normalize(m[1]);
        const match = problemsBySlug.get(slugNorm);
        if (match) return match;
      }
    }

    // Strategy 2: Checkbox aria-label (e.g., "Mark Two Sum complete")
    const checkbox = row.querySelector('input[type="checkbox"], button[role="checkbox"], [aria-label*="complete"]');
    if (checkbox) {
      const ariaLabel = checkbox.getAttribute("aria-label") || "";
      if (ariaLabel.toLowerCase().includes("complete")) {
        const cleanTitle = ariaLabel
          .replace(/^Mark\s+/i, "")
          .replace(/\s+complete$/i, "")
          .trim();
        const exactMatch = problemsByExactTitle.get(cleanTitle.toLowerCase());
        if (exactMatch) return exactMatch;
        const normMatch = problemsByTitle.get(normalize(cleanTitle));
        if (normMatch) return normMatch;
      }
    }

    // Strategy 3: Problem label / text cell / modern card header
    const labelEl = row.querySelector(
      '[class*="itemTitle"], [class*="problemLabel"], [data-label="Problem"] span, [class*="colProblemName"] span, [class*="itemCardHeader"] span, [class*="itemCardHeader"] h4, [class*="itemCardHeader"] h3, [class*="itemCardHeader"] p'
    );
    if (labelEl) {
      let rawText = labelEl.textContent || "";
      rawText = rawText.replace(/\b(Easy|Medium|Hard|Core|Basic|Pro|Elite)\b/gi, "").trim();
      const exactMatch = problemsByExactTitle.get(rawText.toLowerCase());
      if (exactMatch) return exactMatch;
      const normMatch = problemsByTitle.get(normalize(rawText));
      if (normMatch) return normMatch;
    }

    // Strategy 4: Fallback on card header text
    const cardHeader = row.querySelector('[class*="itemCardHeader"]');
    if (cardHeader) {
      let rawText = cardHeader.textContent || "";
      rawText = rawText.replace(/\b(Easy|Medium|Hard|Core|Basic|Pro|Elite)\b/gi, "").trim();
      const exactMatch = problemsByExactTitle.get(rawText.toLowerCase());
      if (exactMatch) return exactMatch;
      const normMatch = problemsByTitle.get(normalize(rawText));
      if (normMatch) return normMatch;
    }

    return null;
  }

  function createGfgButton(problem, validUrl) {
    // Wrapper matching TUF native actionButtonWrap (using span to seamlessly blend with sibling actionButtonWrap spans)
    const wrap = document.createElement("span");
    wrap.className = "sheet-tree-module__lpXZ8G__actionButtonWrap tuf-ext-gfg-wrap";
    wrap.setAttribute("data-tuf-gfg-link", "true");

    // Action button matching TUF native j.Button (variant: "action", size: "base", rounded-full)
    const btn = document.createElement("a");
    btn.className =
      "group/button inline-flex shrink-0 hover:cursor-pointer items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 h-8 w-8 !p-1 gap-1 rounded-full cursor-pointer bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground body-b3-medium tuf-ext-gfg-btn";
    btn.href = validUrl;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.title = "Open on GeeksforGeeks";
    btn.setAttribute("aria-label", `Open ${problem.question} on GeeksforGeeks`);

    // Prevent row expansion, checkbox toggling, or selection when clicking the link
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Native-sized GFG Icon
    const iconImg = document.createElement("img");
    iconImg.src = chrome.runtime.getURL("assets/gfg.png");
    iconImg.alt = "GeeksforGeeks";
    iconImg.className = "tuf-ext-gfg-icon";
    iconImg.loading = "lazy";

    btn.appendChild(iconImg);
    wrap.appendChild(btn);

    return wrap;
  }

  function enhanceRow(row) {
    // Duplicate prevention: check marker on row or within row
    if (row.hasAttribute("data-tuf-gfg-link") || row.querySelector('[data-tuf-gfg-link="true"]')) {
      return;
    }

    const problem = findProblemData(row);
    if (!problem || !problem.gfg) return;

    const validUrl = validateGfgUrl(problem.gfg);
    if (!validUrl) return;

    // Locate existing TUF action area (supporting both modern card layout & legacy table rows)
    const actionsPack =
      row.querySelector('[class*="itemResourcesActions"]') ||
      row.querySelector('[class*="practiceActionsPack"]') ||
      row.querySelector('[data-label="Actions"] > div') ||
      row.querySelector('[class*="practiceActionsCell"] > div') ||
      row.querySelector('[data-label="Actions"]');

    if (!actionsPack) return;

    // Double check actionsPack hasn't already received GFG button
    if (actionsPack.querySelector('[data-tuf-gfg-link="true"]')) {
      row.setAttribute("data-tuf-gfg-link", "true");
      return;
    }

    const gfgWrap = createGfgButton(problem, validUrl);
    if (!gfgWrap) return;

    // Determine semantic insertion point:
    // 1. If TUF has native LeetCode button, insert directly after native LeetCode
    const nativeLc = actionsPack.querySelector(
      'a[href*="leetcode.com"], [aria-label*="LeetCode" i], [title*="LeetCode" i]'
    );

    if (nativeLc) {
      const lcWrap = nativeLc.closest('[class*="actionButtonWrap"]') || nativeLc.parentElement;
      if (lcWrap && lcWrap.parentElement === actionsPack) {
        if (lcWrap.nextSibling) {
          actionsPack.insertBefore(gfgWrap, lcWrap.nextSibling);
        } else {
          actionsPack.appendChild(gfgWrap);
        }
        row.setAttribute("data-tuf-gfg-link", "true");
        return;
      }
    }

    // 2. If no native LeetCode, insert right before user utility buttons (notes, bookmark, menu)
    const utilityAction = actionsPack.querySelector(
      '[aria-label*="Notes" i], [title*="Notes" i], [aria-label*="Bookmark" i], [title*="Bookmark" i], [aria-label*="More" i], [title*="More" i], [class*="itemMenuButton"]'
    );

    if (utilityAction) {
      const utilWrap =
        utilityAction.closest('[class*="actionButtonWrap"]') ||
        (utilityAction.parentElement === actionsPack ? utilityAction : utilityAction.parentElement);
      if (utilWrap && utilWrap.parentElement === actionsPack) {
        actionsPack.insertBefore(gfgWrap, utilWrap);
        row.setAttribute("data-tuf-gfg-link", "true");
        return;
      }
    }

    // 3. Fallback: append to actionsPack
    actionsPack.appendChild(gfgWrap);
    row.setAttribute("data-tuf-gfg-link", "true");
  }

  function enhancePracticePageHeader() {
    if (!isInitialized) return;
    if (!window.location.pathname.startsWith("/practice/")) return;

    // Check if header already enhanced
    if (document.querySelector('header [data-tuf-gfg-link="true"], [class*="ProblemPanel"] [data-tuf-gfg-link="true"]')) {
      return;
    }

    const m = window.location.pathname.match(/\/practice\/dsa\/([^?#/]+)/);
    if (!m || !m[1]) return;
    const slugNorm = normalize(m[1]);
    const problem = problemsBySlug.get(slugNorm);
    if (!problem || !problem.gfg) return;

    const validUrl = validateGfgUrl(problem.gfg);
    if (!validUrl) return;

    const shortcutButtons = document.querySelector('[class*="shortcutButtons"]');
    const header =
      document.querySelector('[class*="ProblemPanel-module"][class*="header"]') ||
      document.querySelector('[class*="problemHeader"]') ||
      document.querySelector("header h1")?.parentElement ||
      document.querySelector("header");

    if (!header && !shortcutButtons) return;

    const gfgWrap = createGfgButton(problem, validUrl);
    if (!gfgWrap) return;

    if (shortcutButtons) {
      shortcutButtons.appendChild(gfgWrap);
    } else if (header) {
      gfgWrap.classList.add("tuf-ext-header-gfg-wrap");
      header.appendChild(gfgWrap);
    }
  }

  function scanAndEnhance() {
    if (!isInitialized) return;

    // Find all problem items (supporting both modern card layout and legacy table rows)
    const items = document.querySelectorAll(
      'article[class*="itemCard"], [data-sheet-row-key], [class*="contentTableRow"], tr[class*="contentTableRow"], [data-label="Problem"]'
    );

    for (const el of items) {
      const row = el.getAttribute("data-label") === "Problem" ? el.closest("tr") || el.parentElement : el;
      if (row) {
        enhanceRow(row);
      }
    }

    // Also check for practice/editor page header
    enhancePracticePageHeader();
  }

  // Debounced scan function
  let debounceTimeout = null;
  function scheduleScan() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      scanAndEnhance();
    }, 60);
  }

  // Setup MutationObserver for dynamic React rerenders
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scheduleScan();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Listen for client-side navigation (Next.js route changes)
  window.addEventListener("popstate", scheduleScan);
  const origPushState = history.pushState;
  if (origPushState) {
    history.pushState = function () {
      origPushState.apply(this, arguments);
      scheduleScan();
    };
  }
  const origReplaceState = history.replaceState;
  if (origReplaceState) {
    history.replaceState = function () {
      origReplaceState.apply(this, arguments);
      scheduleScan();
    };
  }

  // Initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadData);
  } else {
    loadData();
  }
})();
