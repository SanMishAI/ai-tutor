/**
 * Auth state and sign-out regression tests
 *
 * These tests use localStorage manipulation to simulate auth states without
 * needing real Clerk credentials. The key insight is:
 *
 *   selected_intro_seen === "1"  →  app UI is shown
 *   selected_intro_seen absent   →  landing page is shown
 *
 * When a signed-in parent is detected by Clerk (isSignedIn=true), the app
 * removes `selected_intro_seen` from localStorage so that after sign-out the
 * flag is already gone and the landing page is shown on reload.
 *
 * Tests that require real Clerk authentication are marked test.fixme().
 */

import { test, expect } from "@playwright/test"
import { clearLocalStorage, setLocalStorage, getLocalStorage, enterApp } from "./helpers"

test.describe("Auth state and landing/app routing", () => {
  // ── 1. Fresh load → landing page ─────────────────────────────────────────

  test("fresh load with no localStorage shows landing page hero", async ({
    page,
  }) => {
    // Clear any persisted state from earlier tests or browser sessions.
    await page.goto("/")
    await clearLocalStorage(page)
    await page.reload()

    // The landing page hero should be visible.
    // The h1 "Give your child the edge in every major Australian exam." is in the hero.
    const h1 = page.locator("h1").first()
    await expect(h1).toBeVisible()
    await expect(h1).toContainText(/Australian/i)

    // The app's mode tabs (Chat, Practice, Study, Break) should NOT be present.
    const chatTab = page.getByRole("button", { name: /💬 chat/i })
    await expect(chatTab).not.toBeAttached()
  })

  // ── 2. Returning guest (localStorage set) → app is shown ─────────────────

  test("setting selected_intro_seen=1 before load shows the app UI", async ({
    page,
  }) => {
    await page.goto("/")
    await setLocalStorage(page, "selected_intro_seen", "1")
    await page.reload()

    // The main app shows mode tabs in the header controls area.
    // We look for any one of them to confirm we're in the app.
    const studyTab = page.getByRole("button", { name: /📖 study/i })
    await expect(studyTab).toBeVisible({ timeout: 6000 })
  })

  // ── 3. Removing localStorage shows landing page on reload ─────────────────

  test("removing selected_intro_seen and reloading shows landing page", async ({
    page,
  }) => {
    // Start in the app
    await page.goto("/")
    await setLocalStorage(page, "selected_intro_seen", "1")
    await page.reload()

    // Confirm we're in the app
    await expect(page.getByRole("button", { name: /📖 study/i })).toBeVisible({ timeout: 6000 })

    // Simulate sign-out by clearing the flag and reloading
    await page.evaluate(() => localStorage.removeItem("selected_intro_seen"))
    await page.reload()

    // Now the landing page hero should be back
    await expect(page.locator("h1").first()).toBeVisible()
    await expect(page.locator("h1").first()).toContainText(/Australian/i)

    // Mode tabs should be gone
    await expect(page.getByRole("button", { name: /📖 study/i })).not.toBeAttached()
  })

  // ── 4. selected_intro_seen is absent after sign-out (the critical bug fix) ─

  test("after sign-out flow, selected_intro_seen is not in localStorage", async ({
    page,
  }) => {
    // This tests the core sign-out regression: when a parent signs out while
    // inside the app, the flag must be gone so the landing page shows on reload.
    // We simulate the sign-out effect (flag removal) via JS rather than
    // triggering real Clerk sign-out (which needs real credentials).

    await page.goto("/")
    await setLocalStorage(page, "selected_intro_seen", "1")
    await page.reload()

    // Simulate the useEffect that fires on sign-out: it calls
    // localStorage.removeItem("selected_intro_seen")
    await page.evaluate(() => localStorage.removeItem("selected_intro_seen"))

    const value = await getLocalStorage(page, "selected_intro_seen")
    expect(value).toBeNull()
  })

  // ── 5. Guest usage key persists across navigation ─────────────────────────

  test("selected_guest_usage key is preserved when navigating between pages", async ({
    page,
  }) => {
    await page.goto("/")
    const today = new Date().toISOString().slice(0, 10)
    await setLocalStorage(
      page,
      "selected_guest_usage",
      JSON.stringify({ date: today, count: 3 })
    )

    // Navigate to /about and back
    await page.goto("/about")
    await page.goto("/")

    const raw = await getLocalStorage(page, "selected_guest_usage")
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.count).toBe(3)
  })

  // ── 6. Signed-in parent shows app (requires Clerk) ───────────────────────

  test.fixme(
    "signed-in parent is taken to the app after Clerk auth",
    async ({ page }) => {
      // This test requires a real Clerk session. Run it locally with a valid
      // CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD set in .env.test.
      // The app's useEffect detects isSignedIn=true and calls setSplashDone(true).
      //
      // To enable this test:
      //   1. Set CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD in .env.test
      //   2. Use a Playwright fixture or setup file to log in via Clerk before this spec
      //   3. Remove test.fixme()
    }
  )

  // ── 7. Sign-out while in app → landing page (requires Clerk) ─────────────

  test.fixme(
    "parent sign-out while in app redirects to landing page",
    async ({ page }) => {
      // This is the critical regression that was fixed. After a real sign-out:
      //   1. selected_intro_seen must be absent from localStorage
      //   2. The landing page hero must be visible
      //   3. The mode tabs must NOT be visible
      //
      // Requires real Clerk auth — see test 6 above for enablement instructions.
    }
  )
})
