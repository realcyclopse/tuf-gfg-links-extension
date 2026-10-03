# TUF GeeksforGeeks External Links Chrome Extension

A lightweight, non-intrusive Chrome/Chromium (Manifest V3) extension that enhances the [TakeUForward (TUF) Striver's A2Z DSA Sheet](https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?page=sheet) and practice editor with direct, verified **GeeksforGeeks** links.


---

## Features

- **100% Native TUF Look & Feel**: The GeeksforGeeks button matches TUF's native action icon buttons in every visual detail:
  - Exact dimensions: `32px x 32px` (`h-8 w-8`)
  - Border radius: `rounded-full` (circular)
  - Seamless background & borders: transparent with subtle `hover:bg-muted` (`rgba(255, 255, 255, 0.08)`)
  - Pixel-perfect icon sizing: `20px x 11px` centered GFG logo with transparent background (no borders or dark boxes)
- **Natural Icon Grouping**:
  - Automatically places the GFG button immediately adjacent to TUF's native LeetCode button.
  - For problems without a native LeetCode button, places the GFG button seamlessly before the utility icons (Notes, Bookmark, Menu).
- **Accurate & Verified Mapping**: Uses the verified mapping dataset (`TUF_Questions_Platform_Links_Verified.xlsx`) cross-referenced with actual live TakeUforward practice problems (437 verified GFG problems across 452 total sheet questions).
- **Zero Interference**: Fully preserves TakeUforward progress tracking, checkboxes, bookmarks, notes, and search/filter controls (`e.stopPropagation()` on clicks).
- **Zero Unwanted Platforms**: Strict scope — NO CodeChef, NO Codeforces, and zero extension-created LeetCode duplicates.
- **Dynamic React/Next.js Support**: Uses a debounced `MutationObserver` with `data-tuf-gfg-link="true"` markers to handle accordion expansion, filtering, pagination, and client-side page transitions without duplicate icons or lag.
- **Local & Private**: Requests no Chrome API permissions (such as storage, tabs, webRequest, or cookies) and runs strictly on the required TakeUForward Striver's A2Z DSA Sheet page. Completely self-contained with bundled JSON and local assets; zero external network requests or tracking.

---

## Project Structure

```
tuf-extension/
│
├── manifest.json            # Chrome Manifest V3 configuration
├── content/
│   ├── tuf-content.js       # Content script (DOM matching, native GFG injection, observer)
│   └── tuf-content.css      # Native TUF action button styles and transitions
├── data/
│   └── problems.json        # Bundled JSON dataset (verified GFG mappings)
├── assets/
│   └── gfg.png              # Bundled GeeksforGeeks logo (clean, transparent)
└── icons/
    ├── icon16.png           # Extension icon 16x16
    ├── icon32.png           # Extension icon 32x32
    ├── icon48.png           # Extension icon 48x48
    └── icon128.png          # Extension icon 128x128
```

---

## Installation Guide (Chrome / Edge / Brave / Chromium)

1. Open your browser and navigate to:
   ```
   chrome://extensions/
   ```
2. Enable **Developer mode** (toggle switch in the top-right corner).
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `tuf-extension` folder in this repository.
5. Navigate to [TakeUForward Striver's A2Z DSA Sheet](https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?page=sheet).
6. Expand any section (e.g. *Learn the basics*, *Arrays*, *Binary Search*). The verified `[GeeksforGeeks]` button appears seamlessly alongside TUF's native action buttons!

---

## Updating the Dataset from Excel

Whenever `TUF_Questions_Platform_Links_Verified.xlsx` is modified:
```pwsh
python scripts/convert_excel.py
```
This reads column 1 (Question) and column 3 (GeeksforGeeks) and updates `data/problems.json`.

---

## Verification & Test Checklist

- [x] **Native Action Icon Styling**: GFG button is circular (`32px x 32px`, `rounded-full`), transparent background, with matching subtle hover effect.
- [x] **Zero Extension LeetCode**: No extension-injected LeetCode buttons or placeholders; TUF's native LeetCode button is 100% intact and untouched.
- [x] **Zero Other Platforms**: Zero CodeChef, zero Codeforces.
- [x] **Semantic Ordering**: GFG button appears directly after native LeetCode (or before notes/bookmark if no native LeetCode).
- [x] **Duplicate Prevention**: Re-expanding accordions or searching does not duplicate the GFG icon (`data-tuf-gfg-link="true"`).
- [x] **Click Isolation**: Clicking the GFG button opens the link in a new tab without toggling checkboxes or row selection.
- [x] **Clean Asset**: Transparent RGBA GFG logo without dark boxes or borders.
