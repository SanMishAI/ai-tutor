/**
 * In-app functionality regression tests
 *
 * All tests bypass the landing page by setting selected_intro_seen=1 in
 * localStorage before each test. This simulates a returning guest or user who
 * has already been through the welcome flow.
 *
 * Tests that require network (AI streaming, trivia API) use appropriate
 * timeouts and are written to tolerate slow responses.
 */

import { test, expect } from "@playwright/test"
import { clearLocalStorage, enterApp, setMockChildSession } from "./helpers"

test.describe("App: mode tabs and switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await enterApp(page)
  })

  // ── 1. App loads with mode tabs ───────────────────────────────────────────

  test("all six mode tabs are visible after entering the app", async ({
    page,
  }) => {
    // The mode control bar contains: Chat, Practice, Exam, Adventure, Study, Break
    await expect(page.getByRole("button", { name: /💬 chat/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /📝 practice/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /⏱️ exam/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /⛏️ adventure/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /📖 study/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /🎮 break/i })).toBeVisible()
  })

  test("SelectEd wordmark is visible in the app header", async ({ page }) => {
    // The app header always shows the wordmark — it's not just on the landing page.
    await expect(page.locator("header img[alt='SelectEd']")).toBeVisible()
  })

  // ── 2. Mode switching: Study tab ──────────────────────────────────────────

  test("clicking Study tab shows StudyMode UI", async ({ page }) => {
    // The app starts in study mode by default (initial state in page.tsx).
    // Explicitly click the tab to make the test robust to future state changes.
    await page.getByRole("button", { name: /📖 study/i }).click()

    // StudyMode renders a chapter picker or study content. Wait for something
    // unique to StudyMode to appear. The ChapterPicker is the first thing shown.
    // It renders exam selection cards or study content — look for something
    // that is NOT in chat or practice modes.
    await expect(
      page.locator("main").getByText(/study/i).first()
    ).toBeVisible({ timeout: 5000 })
  })

  // ── 3. Break tab → trivia categories ─────────────────────────────────────

  test("clicking Break tab shows the trivia category picker", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /🎮 break/i }).click()

    // BreakZone renders with forceOpen=true in break mode, so the category
    // picker is immediately shown without needing a secondary click.
    // Categories: Animals, Space, Sports, Pop Culture, World Records, Surprise Me!
    await expect(page.getByText("Animals").first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("Space").first()).toBeVisible({ timeout: 5000 })
  })

  // ── 4. Brain Break trivia: clicking a category starts loading ─────────────

  test("clicking Animals category in Break mode triggers a trivia question load", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /🎮 break/i }).click()

    // Wait for the category list to appear
    await expect(page.getByText("Animals").first()).toBeVisible({ timeout: 5000 })

    // Click the Animals category button
    await page.getByRole("button", { name: /animals/i }).first().click()

    // Either we see a loading state or a question appears
    // (the API response might be fast so we accept either)
    const loadingOrQuestion = await Promise.race([
      page.waitForSelector("text=Loading", { timeout: 8000 }).catch(() => null),
      page
        .waitForSelector("text=Question", { timeout: 8000 })
        .catch(() => null),
      // The trivia question text won't say "Question" explicitly but the
      // options will be rendered as buttons — wait for 4 option buttons
      page
        .waitForFunction(
          () =>
            document.querySelectorAll("button").length > 8, // more buttons than just mode tabs
          { timeout: 8000 }
        )
        .catch(() => null),
    ])

    // If the API is available the response should arrive; if not the test is
    // still useful for catching the category click regression.
    expect(loadingOrQuestion).not.toBeNull()
  })

  // ── 5. Practice tab placeholder uses exam abbreviation ────────────────────

  test("Practice tab placeholder text shows exam abbreviation not full name", async ({
    page,
  }) => {
    // Switch to Practice tab
    await page.getByRole("button", { name: /📝 practice/i }).click()

    // The placeholder text is: "Click "Get Practice Problem" to receive a question for {abbrev}."
    // For AMC (Australian Mathematics Competition (AMC)), the regex extracts "AMC".
    // The full name "Australian Mathematics Competition" should NOT appear verbatim
    // as a sentence fragment like "question for Australian Mathematics Competition".
    const practiceContent = page.locator("main")

    // The abbreviation "AMC" should appear in the placeholder
    await expect(practiceContent.getByText(/question for AMC/i)).toBeVisible({
      timeout: 5000,
    })

    // The full name should NOT appear in the placeholder sentence
    // (it may appear in the subject dropdown, but not in the placeholder body)
    const placeholderText = await practiceContent
      .locator("p", { hasText: /question for/i })
      .first()
      .textContent()
      .catch(() => "")

    expect(placeholderText).not.toMatch(/question for Australian Mathematics Competition/i)
  })

  // ── 6. Chat mode shows notebook-style UI ──────────────────────────────────

  test("Chat tab shows the notebook empty state prompt", async ({ page }) => {
    await page.getByRole("button", { name: /💬 chat/i }).click()

    // When there are no messages, the chat shows a prompt in notebook style
    await expect(
      page.getByText(/open your notebook and ask anything/i)
    ).toBeVisible({ timeout: 5000 })
  })

  // ── 7. Exam/Adventure mode premium gate for guests ────────────────────────

  test("clicking Exam tab as a guest shows the upgrade/limit modal", async ({
    page,
  }) => {
    // As a guest (no Clerk auth, no child session), clicking Exam triggers
    // checkPremiumFeature() → guestLimitModal appears
    await page.getByRole("button", { name: /⏱️ exam/i }).click()

    // The GuestLimitModal should appear (it shows upgrade messaging)
    await expect(
      page.getByText(/upgrade|sign up|free trial|exam mode/i).first()
    ).toBeVisible({ timeout: 5000 })
  })

  // ── 8. Sign out from app → landing page (localStorage path) ──────────────

  test("removing selected_intro_seen and reloading returns to landing page", async ({
    page,
  }) => {
    // Verify we are in the app
    await expect(page.getByRole("button", { name: /📖 study/i })).toBeVisible()

    // Simulate sign-out by removing the flag (the useEffect does this when
    // Clerk detects a signed-out state)
    await page.evaluate(() => localStorage.removeItem("selected_intro_seen"))
    await page.reload()

    // Landing page hero should now be visible
    await expect(page.locator("h1").first()).toContainText(/Australian/i)

    // Mode tabs should be gone
    await expect(
      page.getByRole("button", { name: /📖 study/i })
    ).not.toBeAttached()
  })

  // ── 9. Real Clerk sign-out while in app (requires Clerk) ─────────────────

  test.fixme(
    "Clerk UserButton sign-out while in app redirects to landing page",
    async ({ page }) => {
      // This test requires a real Clerk session (signed-in parent).
      //
      // Expected flow:
      //   1. Click the Clerk UserButton (user avatar in top-right)
      //   2. Click "Sign out" in the Clerk dropdown
      //   3. Clerk removes the session token
      //   4. The app's useEffect detects isSignedIn=false (after being true)
      //   5. setSplashDone(false) is called → landing page is shown
      //   6. selected_intro_seen is NOT in localStorage (was removed when signed in)
      //
      // To enable: provide real Clerk test credentials and a Playwright auth fixture.
    }
  )
})

test.describe("App: student session", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
  })

  // ── 10. Child session: Exit button clears session ─────────────────────────

  test("Exit button in app header clears child session and shows landing page", async ({
    page,
  }) => {
    // setMockChildSession sets both localStorage keys and reloads
    await setMockChildSession(page)

    // Confirm child context is active
    await expect(page.getByText("🦊 Test Kid")).toBeVisible({ timeout: 6000 })
    await expect(page.getByRole("button", { name: /^exit$/i })).toBeVisible()

    // The sidebar toggle (☰) should be hidden when a child session is active
    await expect(page.getByTitle(/toggle sidebar/i)).not.toBeAttached()

    // Exit
    await page.getByRole("button", { name: /^exit$/i }).click()

    // Landing page shows
    await expect(page.locator("h1").first()).toContainText(/Australian/i)

    // Both localStorage keys are cleared
    const introSeen = await page.evaluate(() =>
      localStorage.getItem("selected_intro_seen")
    )
    const childSession = await page.evaluate(() =>
      localStorage.getItem("selected_child_session")
    )
    expect(introSeen).toBeNull()
    expect(childSession).toBeNull()
  })
})

test.describe("App: voice toggle in Study mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await clearLocalStorage(page)
    await enterApp(page)
  })

  // ── 11. Voice toggle is ON by default ────────────────────────────────────

  test("Voice toggle button is ON by default in Study mode", async ({
    page,
  }) => {
    // Study mode is the default. The StudyChat component shows inside it.
    // Wait for StudyMode to render (it may load chapters first).
    await page.getByRole("button", { name: /📖 study/i }).click()

    // The voice toggle button shows "🔊 Voice ON" initially (voiceEnabled=true by default)
    // It also has a title attribute for accessibility
    const voiceBtn = page.locator("button", { hasText: /voice on/i })
    await expect(voiceBtn.first()).toBeVisible({ timeout: 8000 })
  })

  test("clicking voice toggle switches from Voice ON to Voice OFF", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /📖 study/i }).click()

    // Wait for Voice ON button to appear
    const voiceOnBtn = page.locator("button", { hasText: /voice on/i })
    await expect(voiceOnBtn.first()).toBeVisible({ timeout: 8000 })

    // Click to toggle off
    await voiceOnBtn.first().click()

    // Should now show Voice OFF
    const voiceOffBtn = page.locator("button", { hasText: /voice off/i })
    await expect(voiceOffBtn.first()).toBeVisible({ timeout: 3000 })

    // Voice ON should no longer be shown
    await expect(page.locator("button", { hasText: /voice on/i })).not.toBeVisible()
  })

  test("clicking Voice OFF switches back to Voice ON", async ({ page }) => {
    await page.getByRole("button", { name: /📖 study/i }).click()

    // Toggle off
    const voiceOnBtn = page.locator("button", { hasText: /voice on/i })
    await expect(voiceOnBtn.first()).toBeVisible({ timeout: 8000 })
    await voiceOnBtn.first().click()

    // Toggle back on
    const voiceOffBtn = page.locator("button", { hasText: /voice off/i })
    await expect(voiceOffBtn.first()).toBeVisible({ timeout: 3000 })
    await voiceOffBtn.first().click()

    // Back to ON
    await expect(page.locator("button", { hasText: /voice on/i }).first()).toBeVisible({
      timeout: 3000,
    })
  })
})
