import { Page } from "@playwright/test"

/**
 * Set a single key in localStorage. Must be called after page.goto() so the
 * origin exists — otherwise the script has no storage context to write to.
 */
export async function setLocalStorage(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value])
}

/**
 * Wipe all localStorage for the current origin. Call before navigating when
 * you want a completely fresh state (no lingering intro-seen flags, guest
 * counts, etc.).
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear())
}

/**
 * Read a single key from localStorage. Returns null when the key is absent,
 * matching the native localStorage.getItem() contract.
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key)
}

/**
 * Skip the landing page and go straight to the app by setting the
 * `selected_intro_seen` flag and reloading. Use in beforeEach hooks for any
 * test that targets in-app behaviour rather than the landing page.
 */
export async function enterApp(page: Page) {
  await setLocalStorage(page, "selected_intro_seen", "1")
  await page.reload()
}

/**
 * Simulate a child (student) session by writing a mock session object to
 * localStorage AND setting selected_intro_seen so the app view loads.
 *
 * The mock token is not valid for API calls, so any network requests that
 * require a real child token (e.g. /api/student/dashboard) will fail or
 * return errors — that is expected. Tests that use this helper should only
 * assert UI behaviour that does not depend on successful API responses.
 */
export async function setMockChildSession(page: Page) {
  const session = { token: "mock_token", id: "mock_id", name: "Test Kid", avatarEmoji: "🦊" }
  await setLocalStorage(page, "selected_child_session", JSON.stringify(session))
  await setLocalStorage(page, "selected_intro_seen", "1")
  await page.reload()
}
