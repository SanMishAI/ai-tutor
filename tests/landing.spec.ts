/**
 * Landing page regression tests
 *
 * These tests verify the public landing page that visitors see before signing
 * in or entering the app. Every test starts with a cleared localStorage so we
 * always see the marketing page, not the in-app view.
 */

import { test, expect } from "@playwright/test"
import { clearLocalStorage } from "./helpers"

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    // First load the page so the origin exists, then clear any stale state and
    // reload to guarantee we're on the landing page.
    await page.goto("/")
    await clearLocalStorage(page)
    await page.reload()
  })

  // ── 1. Page loads ──────────────────────────────────────────────────────────

  test("page title is SelectEd", async ({ page }) => {
    await expect(page).toHaveTitle(/SelectEd/i)
  })

  test("hero h1 is visible and contains expected copy", async ({ page }) => {
    // Headline: "Your child's own tutor. 24/7, for the price of one coffee a month."
    const h1 = page.locator("h1").first()
    await expect(h1).toBeVisible()
    await expect(h1).toContainText(/tutor/i)
  })

  // ── 2. Navigation bar ──────────────────────────────────────────────────────

  test("nav shows Sign in (desktop) and Try it free CTA", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const nav = page.locator("nav").first()
    await expect(nav).toBeVisible()

    // "Sign in" visible at desktop (hidden md:block)
    const signIn = nav.getByRole("button", { name: /sign in/i })
    await expect(signIn).toBeVisible()

    // Primary CTA: "Try it free →"
    const tryFree = nav.getByRole("button", { name: /try it free/i })
    await expect(tryFree.first()).toBeVisible()
  })

  test("SelectEd wordmark link is visible in nav", async ({ page }) => {
    const navLink = page.locator("nav a[href='/']").first()
    await expect(navLink).toBeVisible()
  })

  // ── 3. Mobile nav behaviour ────────────────────────────────────────────────

  test("at 375 px hamburger button is visible and Sign in is hidden", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    // Hamburger button is md:hidden → visible at 375px
    const hamburger = page.getByRole("button", { name: /open menu/i })
    await expect(hamburger).toBeVisible()

    // "Try it free" mobile button is visible
    const tryFree = page.locator("nav button", { hasText: /try it free/i })
    await expect(tryFree.first()).toBeVisible()

    // "Sign in" is hidden md:block → not visible at 375px
    const signIn = page.locator("nav").first().getByRole("button", { name: /^sign in$/i })
    await expect(signIn).toBeHidden()
  })

  test("at 375 px hamburger opens drawer with nav links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole("button", { name: /open menu/i }).click()
    const drawer = page.getByRole("dialog", { name: /navigation menu/i })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText("How it works")).toBeVisible()
    await expect(drawer.getByText("Pricing")).toBeVisible()
  })

  test("at 375 px student login link is visible in hero", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // Hero has "Already a student? Log in here →"
    const studentBtn = page.getByRole("button", { name: /already a student/i })
    await expect(studentBtn).toBeVisible()
  })

  // ── 4. Exam coverage strip ─────────────────────────────────────────────────

  test("exam abbreviations AMC and NAPLAN appear in the page", async ({ page }) => {
    // Both appear in the rolling banner AND in the coverage grid section.
    // We check the DOM contains the text — scrolling is not required.
    await expect(page.getByText("AMC").first()).toBeAttached()
    await expect(page.getByText("NAPLAN").first()).toBeAttached()
  })

  test("all 8 exam labels are present in the coverage section", async ({ page }) => {
    const labels = ["AMC", "ICAS", "NAPLAN", "ACER", "ATAR", "Bebras", "KSF", "Olympiad"]
    for (const label of labels) {
      await expect(page.getByText(label).first()).toBeAttached()
    }
  })

  // ── 5. Pricing section ─────────────────────────────────────────────────────

  test("pricing section shows Free and Premium tiers", async ({ page }) => {
    // Scroll the pricing section into view so it is rendered.
    await page.evaluate(() =>
      document.querySelector("h2")?.closest("section")?.scrollIntoView()
    )

    // The headings are rendered as plain text inside the pricing cards.
    await expect(page.getByText(/^Free$/).first()).toBeAttached()
    await expect(page.getByText(/^Premium$/).first()).toBeAttached()
  })

  test("Free plan shows price of $0 and free-only features", async ({ page }) => {
    await expect(page.getByText("$0").first()).toBeAttached()
    await expect(page.getByText(/10 AI questions per day/i).first()).toBeAttached()
    await expect(page.getByText(/Chat mode/i).first()).toBeAttached()
    await expect(page.getByText(/Practice mode/i).first()).toBeAttached()
  })

  test("Free plan does NOT claim Unlimited questions", async ({ page }) => {
    // Exam + Adventure are Premium-only; Unlimited is a Premium feature
    const freeCardText = await page.getByText("$0").locator("../..").textContent()
    expect(freeCardText).not.toMatch(/Unlimited questions/i)
  })

  test("Premium plan shows $9.99 price and 7-day trial CTA", async ({ page }) => {
    await expect(page.getByText("$9.99").first()).toBeAttached()
    const startTrial = page.getByRole("button", { name: /7-day free trial/i })
    await expect(startTrial.first()).toBeAttached()
  })

  test("premium card mentions Exam and Adventure modes", async ({ page }) => {
    await expect(page.getByText(/Mock Exam|timed/i).first()).toBeAttached()
    await expect(page.getByText(/Adventure/i).first()).toBeAttached()
  })

  // ── 6. FAQ accordion ───────────────────────────────────────────────────────

  test("FAQ accordion opens and closes on click", async ({ page }) => {
    // First FAQ: "Is SelectEd really free to try?"
    const faqBtn = page.getByRole("button", { name: /is selectEd really free/i })
    await expect(faqBtn).toBeVisible()

    // Initially collapsed
    const answer = page.getByText(/Guests get 10 AI questions per day/i)
    await expect(answer).not.toBeVisible()

    // Open it
    await faqBtn.click()
    await expect(answer).toBeVisible()

    // Close it
    await faqBtn.click()
    await expect(answer).not.toBeVisible()
  })

  // ── 7. CTA enters app ──────────────────────────────────────────────────────

  test('"Try it free" hero CTA enters the app', async ({ page }) => {
    // The hero primary CTA calls onOpenApp → setSplashDone(true)
    await page.getByRole("button", { name: /try it free — no sign-up/i }).click()
    // Landing hero headline should disappear as app loads
    await expect(page.locator("h1").filter({ hasText: /tutor/i })).not.toBeVisible({ timeout: 3000 })
  })

  // ── 8. Student login link ──────────────────────────────────────────────────

  test('"Already a student?" link is visible in hero', async ({ page }) => {
    const studentBtn = page.getByRole("button", { name: /already a student/i })
    await expect(studentBtn).toBeVisible()
  })

  test('"I\'m a student" link appears in mobile hamburger drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole("button", { name: /open menu/i }).click()
    const drawer = page.getByRole("dialog", { name: /navigation/i })
    await expect(drawer.getByText(/I'm a student/i)).toBeVisible()
  })

  // ── 9. Footer ──────────────────────────────────────────────────────────────

  test("footer contains Melbourne location text", async ({ page }) => {
    await expect(page.getByText(/Melbourne/i).first()).toBeAttached()
  })

  test("footer has Privacy link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /privacy/i })).toBeAttached()
  })

  // ── 10. Text size accessibility ────────────────────────────────────────────

  test("no visible text node has computed font-size below 12px", async ({
    page,
  }) => {
    // Gather all text-bearing elements and check their computed font sizes.
    // Elements with font-size < 12px are likely inaccessible for reading.
    const violations = await page.$$eval("*", (elements) => {
      const bad: string[] = []
      for (const el of elements) {
        // Only check leaf nodes that actually contain non-whitespace text
        if (el.children.length > 0) continue
        const text = el.textContent?.trim()
        if (!text) continue
        const style = window.getComputedStyle(el)
        if (style.display === "none" || style.visibility === "hidden") continue
        const size = parseFloat(style.fontSize)
        if (!isNaN(size) && size < 12) {
          bad.push(`"${text.slice(0, 40)}" → ${size}px`)
        }
      }
      return bad
    })

    // Report violations for easier debugging
    if (violations.length > 0) {
      console.warn("Text below 12px:", violations)
    }
    expect(violations).toHaveLength(0)
  })
})
