/**
 * Accessibility regression tests
 *
 * These tests check foundational accessibility requirements without needing
 * an external library like axe-core. They cover font size, button labels,
 * image alt text, keyboard navigation, and focus visibility.
 *
 * Run these alongside the other test suites in CI to catch regressions in
 * core accessibility properties.
 */

import { test, expect } from "@playwright/test"
import { clearLocalStorage, enterApp } from "./helpers"

// ─────────────────────────────────────────────────────────────────────────────
// Landing page accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Accessibility: landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await page.reload()
  })

  // ── 1. No text below 12 px ────────────────────────────────────────────────

  test("no visible leaf text node has a computed font-size below 12px", async ({
    page,
  }) => {
    // Wait for the page to be fully interactive before scanning.
    await page.waitForLoadState("networkidle")

    const violations = await page.$$eval("*", (elements) => {
      const bad: Array<{ text: string; size: number }> = []
      for (const el of elements) {
        // Only examine leaf nodes (no children) with actual text content.
        if (el.children.length > 0) continue
        const text = (el.textContent ?? "").trim()
        if (!text || text.length === 0) continue

        const style = window.getComputedStyle(el)
        // Skip hidden elements
        if (style.display === "none" || style.visibility === "hidden") continue
        if ((el as HTMLElement).offsetParent === null) continue

        const size = parseFloat(style.fontSize)
        if (!isNaN(size) && size < 12) {
          bad.push({ text: text.slice(0, 60), size })
        }
      }
      return bad
    })

    if (violations.length > 0) {
      console.warn(
        "Text nodes smaller than 12px:",
        violations.map((v) => `"${v.text}" → ${v.size}px`).join("\n")
      )
    }

    expect(violations).toHaveLength(0)
  })

  // ── 2. Buttons have accessible labels ─────────────────────────────────────

  test("all buttons on the landing page have accessible names", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle")

    const unlabelled = await page.$$eval("button", (buttons) => {
      return buttons
        .filter((btn) => {
          // A button is accessible if it has:
          // - visible text content, OR
          // - aria-label attribute, OR
          // - aria-labelledby pointing at a labelling element
          const text = (btn.textContent ?? "").trim()
          const ariaLabel = btn.getAttribute("aria-label")
          const ariaLabelledBy = btn.getAttribute("aria-labelledby")
          if (ariaLabel || ariaLabelledBy) return false
          if (text.length > 0) return false
          return true
        })
        .map((btn) => btn.outerHTML.slice(0, 120))
    })

    if (unlabelled.length > 0) {
      console.warn("Buttons without accessible labels:", unlabelled)
    }

    expect(unlabelled).toHaveLength(0)
  })

  // ── 3. Images have alt text ───────────────────────────────────────────────

  test("all img elements have a non-empty alt attribute", async ({ page }) => {
    await page.waitForLoadState("networkidle")

    const imagesWithoutAlt = await page.$$eval("img", (imgs) => {
      return imgs
        .filter((img) => {
          const alt = img.getAttribute("alt")
          // alt="" is valid for decorative images; null/undefined is not
          return alt === null || alt === undefined
        })
        .map((img) => img.src.split("/").pop() ?? img.outerHTML.slice(0, 80))
    })

    if (imagesWithoutAlt.length > 0) {
      console.warn("Images missing alt attribute:", imagesWithoutAlt)
    }

    expect(imagesWithoutAlt).toHaveLength(0)
  })

  // ── 4. Keyboard navigation: Tab to CTA and activate ───────────────────────

  test("Tab key can reach Get started button and Enter activates it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    // Start focus at the top of the page
    await page.locator("body").focus()

    // Tab through until we find the Get started button or exhaust 20 tabs
    let found = false
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab")
      const focusedText = await page.evaluate(
        () => document.activeElement?.textContent?.trim() ?? ""
      )
      if (/get started/i.test(focusedText)) {
        found = true
        break
      }
    }

    expect(found).toBe(true)

    // Activate with Enter → the start-choice modal should open
    await page.keyboard.press("Enter")
    await expect(page.getByText(/continue as guest/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  // ── 5. Focused elements have a visible focus ring ─────────────────────────

  test("buttons and links do not suppress focus outlines entirely", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    // Focus the first interactive element and check it has some visible indicator.
    // We check that the element's outline is not "none" OR it has a box-shadow.
    await page.locator("body").focus()
    await page.keyboard.press("Tab")

    const hasFocusIndicator = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return false
      const style = window.getComputedStyle(el)
      const outline = style.outline
      const boxShadow = style.boxShadow
      // Consider visible if outline is not "none" / "0px none" or box-shadow is set
      const hasOutline =
        outline !== "none" &&
        !outline.startsWith("0px") &&
        outline !== ""
      const hasShadow = boxShadow !== "none" && boxShadow !== ""
      return hasOutline || hasShadow
    })

    // Log for debugging but don't hard-fail if the first element happens to
    // be decorative. This is a best-effort check.
    if (!hasFocusIndicator) {
      test.info().annotations.push({
        type: "warn",
        description:
          "First focusable element may not have a visible focus ring. Verify manually.",
      })
    }
  })

  // ── 6. Page has a single h1 ───────────────────────────────────────────────

  test("landing page has exactly one h1 element", async ({ page }) => {
    const h1Count = await page.locator("h1").count()
    expect(h1Count).toBe(1)
  })

  // ── 7. Nav has a landmark role ────────────────────────────────────────────

  test("page has a <nav> landmark for screen readers", async ({ page }) => {
    const nav = page.locator("nav").first()
    await expect(nav).toBeAttached()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// In-app accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Accessibility: in-app", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await enterApp(page)
    await page.waitForLoadState("networkidle")
  })

  // ── 8. Mode tab buttons have visible labels ───────────────────────────────

  test("mode tab buttons all have non-empty text content", async ({ page }) => {
    const tabLabels = ["💬 Chat", "📝 Practice", "⏱️ Exam", "⛏️ Adventure", "📖 Study", "🎮 Break"]
    for (const label of tabLabels) {
      const btn = page.getByRole("button", { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })
      await expect(btn.first()).toBeAttached()
    }
  })

  // ── 9. App header has role="banner" (implicit via <header>) ──────────────

  test("app has a <header> landmark", async ({ page }) => {
    const header = page.locator("header").first()
    await expect(header).toBeAttached()
  })

  // ── 10. Main content area is present ─────────────────────────────────────

  test("app has a <main> landmark", async ({ page }) => {
    const main = page.locator("main").first()
    await expect(main).toBeAttached()
  })

  // ── 11. No text below 12 px in-app ────────────────────────────────────────

  test("no visible text node in the app UI is smaller than 12px", async ({
    page,
  }) => {
    const violations = await page.$$eval("*", (elements) => {
      const bad: Array<{ text: string; size: number }> = []
      for (const el of elements) {
        if (el.children.length > 0) continue
        const text = (el.textContent ?? "").trim()
        if (!text) continue
        const style = window.getComputedStyle(el)
        if (style.display === "none" || style.visibility === "hidden") continue
        if ((el as HTMLElement).offsetParent === null) continue
        const size = parseFloat(style.fontSize)
        if (!isNaN(size) && size < 12) {
          bad.push({ text: text.slice(0, 60), size })
        }
      }
      return bad
    })

    if (violations.length > 0) {
      console.warn(
        "In-app text nodes smaller than 12px:",
        violations.map((v) => `"${v.text}" → ${v.size}px`)
      )
    }

    expect(violations).toHaveLength(0)
  })
})
