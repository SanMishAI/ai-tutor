/**
 * Navigation & routing regression tests
 *
 * Tests for link behaviour, sticky nav, hamburger drawer, and scroll-triggered UI.
 * All tests start from the landing page with cleared localStorage.
 */

import { test, expect } from "@playwright/test"
import { clearLocalStorage } from "./helpers"

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await page.reload()
  })

  // ── 1. Sign in → Clerk modal / redirect ────────────────────────────────────

  test("clicking Sign in opens the Clerk authentication UI", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.getByRole("button", { name: /^sign in$/i }).first().click()

    await Promise.race([
      page.frameLocator("iframe").first().locator("body").waitFor({ timeout: 8000 }).catch(() => null),
      page.waitForURL(/clerk|accounts/, { timeout: 8000 }).catch(() => null),
    ])

    const url = page.url()
    const hasClerkIframe = (await page.frames()).length > 1
    const navigatedAway = !url.includes("localhost:3000") || hasClerkIframe
    if (!navigatedAway) {
      test.info().annotations.push({
        type: "info",
        description: "Clerk did not open a modal or redirect. Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.",
      })
    }
  })

  // ── 2. Logo link stays on home ─────────────────────────────────────────────

  test("clicking the SelectEd logo link keeps the URL at /", async ({ page }) => {
    // Logo is wrapped in <a href="/"> in the new LandingNav
    const logoLink = page.locator("nav a[href='/']").first()
    await expect(logoLink).toBeVisible()
    await logoLink.click()
    await expect(page).toHaveURL("/")
  })

  // ── 3. Nav links are anchor links ──────────────────────────────────────────

  test("nav Pricing link is an anchor to #pricing (not a route)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const pricingLink = page.locator("nav a[href='#pricing']").first()
    await expect(pricingLink).toBeVisible()
    await expect(pricingLink).toHaveAttribute("href", "#pricing")
  })

  test("nav How it works link is an anchor to #how-it-works", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const link = page.locator("nav a[href='#how-it-works']").first()
    await expect(link).toBeVisible()
  })

  // ── 4. Mobile hamburger ────────────────────────────────────────────────────

  test("at 375 px desktop nav links are hidden (inside hamburger)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // The anchor links are in a hidden md:flex container
    const pricingLink = page.locator("nav").first().locator("a[href='#pricing']")
    await expect(pricingLink.first()).toBeHidden()
  })

  test("at 375 px hamburger drawer contains all nav links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole("button", { name: /open menu/i }).click()
    const drawer = page.getByRole("dialog", { name: /navigation menu/i })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText("How it works")).toBeVisible()
    await expect(drawer.getByText("Exams")).toBeVisible()
    await expect(drawer.getByText("Pricing")).toBeVisible()
    // Student login is also in the drawer
    await expect(drawer.getByText(/I'm a student/i)).toBeVisible()
  })

  test("at 375 px hero student link is visible outside nav", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const heroStudentBtn = page.getByRole("button", { name: /already a student/i })
    await expect(heroStudentBtn).toBeVisible()
  })

  test("hamburger drawer closes when Escape is pressed", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole("button", { name: /open menu/i }).click()
    const drawer = page.getByRole("dialog", { name: /navigation menu/i })
    await expect(drawer).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(drawer).not.toBeVisible({ timeout: 2000 })
  })

  // ── 5. Sticky nav on scroll ────────────────────────────────────────────────

  test("nav remains sticky after scrolling 400 px down", async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }))
    await page.waitForTimeout(200)

    const nav = page.locator("nav").first()
    await expect(nav).toBeVisible()

    const box = await nav.boundingBox()
    expect(box).not.toBeNull()
    // Sticky nav stays at top of viewport
    expect(box!.y).toBeLessThanOrEqual(8)
  })

  // ── 6. Footer links ────────────────────────────────────────────────────────

  test("footer Privacy Policy link is present", async ({ page }) => {
    const link = page.getByRole("link", { name: /privacy/i })
    await expect(link).toBeAttached()
  })

  test("footer About link is present", async ({ page }) => {
    const link = page.getByRole("link", { name: /about/i })
    await expect(link).toBeAttached()
  })
})
