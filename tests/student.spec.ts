/**
 * Student (child) login and dashboard regression tests
 *
 * These tests cover the child login flow reachable via the "I'm a student →"
 * button. The child login screen shows a name field and a 4-digit PIN entry,
 * which is different from the parent Clerk login.
 *
 * Tests that require a real child account in the database are marked
 * test.fixme(). The others use localStorage mocking or form validation checks
 * that can run without API credentials.
 */

import { test, expect } from "@playwright/test"
import { clearLocalStorage, setLocalStorage, setMockChildSession, enterApp } from "./helpers"

test.describe("Student login screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await page.reload()
  })

  // ── 1. Student login link is visible ──────────────────────────────────────

  test("I'm a student button is visible on landing page", async ({ page }) => {
    // At desktop viewport the nav has the button AND the hero has one.
    await page.setViewportSize({ width: 1280, height: 800 })

    // Hero button — always visible regardless of viewport
    const heroStudentBtn = page
      .locator("button", { hasText: /I'm a student/i })
      .first()
    await expect(heroStudentBtn).toBeVisible()
  })

  // ── 2. Student login form structure ───────────────────────────────────────

  test("clicking I'm a student shows name input and 4-digit PIN fields", async ({
    page,
  }) => {
    // Click the hero student button (always visible at any viewport)
    await page.getByRole("button", { name: /I'm a student/i }).first().click()

    // The ChildLoginScreen renders with heading "Student login"
    await expect(page.getByText("Student login")).toBeVisible({ timeout: 5000 })

    // Name input — a standard text input
    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible()

    // PIN — 4 separate password inputs rendered side by side
    const pinInputs = page.locator('input[type="password"]')
    await expect(pinInputs).toHaveCount(4)
  })

  // ── 3. Form validation: empty submission ──────────────────────────────────

  test("submitting the student form with no name shows an error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /I'm a student/i }).first().click()
    await expect(page.getByText("Student login")).toBeVisible({ timeout: 5000 })

    // Submit the form without filling anything in
    // The form is submitted when all 4 PIN digits are entered OR by pressing
    // the submit button if one exists. We can trigger via form submit.
    await page.keyboard.press("Enter")

    // Should show the "Please enter your name." error
    await expect(page.getByText(/please enter your name/i)).toBeVisible({ timeout: 3000 })
  })

  test("entering a name but submitting with incomplete PIN shows an error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /I'm a student/i }).first().click()
    await expect(page.getByText("Student login")).toBeVisible({ timeout: 5000 })

    // Fill in the name
    await page.locator('input[type="text"]').first().fill("Alice")

    // Press Enter with no PIN entered — expect PIN validation error
    await page.keyboard.press("Enter")

    await expect(
      page.getByText(/please enter your 4-digit pin/i)
    ).toBeVisible({ timeout: 3000 })
  })

  // ── 4. Wrong credentials → error message ─────────────────────────────────

  test("non-existent student name and PIN shows an error from the API", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /I'm a student/i }).first().click()
    await expect(page.getByText("Student login")).toBeVisible({ timeout: 5000 })

    // Fill name
    await page.locator('input[type="text"]').first().fill("test_nonexistent_xyz")

    // Fill all 4 PIN digits (each input is separate)
    const pinInputs = page.locator('input[type="password"]')
    for (let i = 0; i < 4; i++) {
      await pinInputs.nth(i).fill((i).toString())
    }

    // After the last digit the form auto-submits. Wait for the API response.
    await expect(
      page.getByText(/name or pin not recognised|something went wrong/i)
    ).toBeVisible({ timeout: 8000 })
  })

  // ── 5. Back button returns to landing ────────────────────────────────────

  test("back button from student login returns to landing page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /I'm a student/i }).first().click()
    await expect(page.getByText("Student login")).toBeVisible({ timeout: 5000 })

    // The ChildLoginScreen has a "← Back to home" or "Back" button rendered by onBack
    const backBtn = page.getByRole("button", { name: /back/i })
    await backBtn.click()

    // Landing page hero should be visible again
    await expect(page.locator("h1").first()).toBeVisible()
    await expect(page.locator("h1").first()).toContainText(/Australian/i)
  })
})

test.describe("Student in-app session (via localStorage mock)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await page.reload()
  })

  // ── 6. App loads with child session context ───────────────────────────────

  test("mock child session shows child name and Exit button in app header", async ({
    page,
  }) => {
    // setMockChildSession sets both selected_child_session and selected_intro_seen
    // so the app view is shown with the child's avatar + name in the header.
    await setMockChildSession(page)

    // The header shows the avatar emoji + name from the session object
    await expect(page.getByText("🦊 Test Kid")).toBeVisible({ timeout: 6000 })

    // The "Exit" button appears in place of the usual sign-in/streak widget
    const exitBtn = page.getByRole("button", { name: /^exit$/i })
    await expect(exitBtn).toBeVisible()
  })

  // ── 7. Exit button clears session and returns to landing ──────────────────

  test("clicking Exit in the app header clears the child session and shows landing page", async ({
    page,
  }) => {
    await setMockChildSession(page)

    // Confirm we're in the app with a child session
    await expect(page.getByRole("button", { name: /^exit$/i })).toBeVisible({ timeout: 6000 })

    // Click Exit
    await page.getByRole("button", { name: /^exit$/i }).click()

    // Both localStorage keys should be gone
    const intrSeen = await page.evaluate(() => localStorage.getItem("selected_intro_seen"))
    const childSession = await page.evaluate(() =>
      localStorage.getItem("selected_child_session")
    )
    expect(intrSeen).toBeNull()
    expect(childSession).toBeNull()

    // The landing page hero is back
    await expect(page.locator("h1").first()).toBeVisible()
    await expect(page.locator("h1").first()).toContainText(/Australian/i)
  })

  // ── 8. Student dashboard (requires real API) ──────────────────────────────

  test.fixme(
    "after real child login the student dashboard shows Welcome back and Start Studying",
    async ({ page }) => {
      // This test requires:
      //   - A parent Clerk account that has at least one child profile configured
      //   - The parent to be signed in (providing localStorage `selected_parent_id`)
      //   - The child name and PIN to be set in env vars
      //
      // The StudentDashboard component is rendered via the showStudentDashboard
      // state flag which is set to true only after handleChildLogin() fires,
      // meaning it cannot be triggered purely via localStorage injection.
      //
      // To enable this test:
      //   1. Set CHILD_TEST_NAME and CHILD_TEST_PIN in .env.test
      //   2. Use a Playwright setup fixture to sign in the parent first
      //   3. Remove test.fixme()
      //
      // Expected assertions once enabled:
      //   - page.getByText(/Welcome back/i) to be visible
      //   - page.getByText(/Start Studying|Continue Studying/i) to be visible
    }
  )

  test.fixme(
    "clicking Start Studying from the dashboard enters the app",
    async ({ page }) => {
      // Depends on the same setup as test 8 above.
      // Expected: clicking the CTA button shows the mode tabs (Chat, Practice, etc.)
    }
  )
})
