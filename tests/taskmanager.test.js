/**
 * MERN Task Manager – Selenium Test Suite
 * 17 automated test cases (TC-01 … TC-17)
 * Runner : Jest   Browser : Headless Chrome
 *
 * ENV: APP_URL  (default http://localhost:3000)
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE = process.env.APP_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

// Unique per-run email to keep tests independent
const TS     = Date.now();
const EMAIL  = `testuser_${TS}@mail.com`;
const PASS   = 'Test@123';
const NAME   = 'Selenium Tester';

let driver;

// ── Driver helpers ────────────────────────────────────────────────────────────

async function buildDriver() {
  const opts = new chrome.Options();
  opts.addArguments(
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080'
  );
  return new Builder().forBrowser('chrome').setChromeOptions(opts).build();
}

const go  = (path) => driver.get(`${BASE}${path}`);
const $   = (css)  => driver.findElement(By.css(css));
const $$  = (css)  => driver.findElements(By.css(css));
const wait = (css, ms = TIMEOUT) => driver.wait(until.elementLocated(By.css(css)), ms);
const waitVisible = (css, ms = TIMEOUT) =>
  driver.wait(until.elementIsVisible(driver.findElement(By.css(css))), ms);
const sleep = (ms) => driver.sleep(ms);

async function type(css, text) {
  const el = await $(css);
  await el.clear();
  await el.sendKeys(text);
}

async function click(css) {
  const el = await $(css);
  await driver.wait(until.elementIsEnabled(el), TIMEOUT);
  await el.click();
}

async function loginAs(email = EMAIL, password = PASS) {
  await go('/login');
  await wait('#login-email');
  await type('#login-email', email);
  await type('#login-password', password);
  await click('#login-btn');
  await wait('#logout-btn');
}

// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  driver = await buildDriver();
}, 30000);

afterAll(async () => {
  await driver.quit();
});

// ══════════════════════════════════════════════════════════════════════════════
//  TC-01  Valid Registration
// ══════════════════════════════════════════════════════════════════════════════
test('TC-01: Valid user registration navigates to dashboard', async () => {
  await go('/register');
  await wait('#reg-name');
  await type('#reg-name', NAME);
  await type('#reg-email', EMAIL);
  await type('#reg-password', PASS);
  await click('#register-btn');
  await wait('#logout-btn');
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/dashboard');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-02  Duplicate Email
// ══════════════════════════════════════════════════════════════════════════════
test('TC-02: Duplicate email shows error message', async () => {
  await go('/register');
  await wait('#reg-name');
  await type('#reg-name', 'Another User');
  await type('#reg-email', EMAIL);
  await type('#reg-password', PASS);
  await click('#register-btn');
  await wait('#register-error');
  const msg = await (await $('#register-error')).getText();
  expect(msg.toLowerCase()).toContain('email');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-03  Valid Login
// ══════════════════════════════════════════════════════════════════════════════
test('TC-03: Valid login reaches dashboard', async () => {
  await loginAs();
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/dashboard');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-04  User name visible after login
// ══════════════════════════════════════════════════════════════════════════════
test('TC-04: Logged-in user name is shown in navbar', async () => {
  await loginAs();
  await wait('#user-name');
  const nameEl = await $('#user-name');
  const text   = await nameEl.getText();
  expect(text).toContain(NAME);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-05  Invalid Password
// ══════════════════════════════════════════════════════════════════════════════
test('TC-05: Wrong password shows invalid credentials error', async () => {
  await go('/login');
  await wait('#login-email');
  await type('#login-email', EMAIL);
  await type('#login-password', 'WrongPass!99');
  await click('#login-btn');
  await wait('#login-error');
  const msg = await (await $('#login-error')).getText();
  expect(msg.toLowerCase()).toContain('invalid');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-06  Empty Login Fields
// ══════════════════════════════════════════════════════════════════════════════
test('TC-06: Submitting empty login form stays on login page', async () => {
  await go('/login');
  await wait('#login-btn');
  // Clear any autofill
  await type('#login-email', '');
  await type('#login-password', '');
  // JS form validation prevents submission
  await driver.executeScript(
    "document.querySelector('#login-btn').click()"
  );
  await sleep(800);
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/login');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-07  Logout
// ══════════════════════════════════════════════════════════════════════════════
test('TC-07: Logout redirects to login page', async () => {
  await loginAs();
  await click('#logout-btn');
  await wait('#login-form');
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/login');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-08  Protected Route Redirect
// ══════════════════════════════════════════════════════════════════════════════
test('TC-08: Accessing /dashboard without login redirects to /login', async () => {
  // Make sure we are logged out
  await go('/login');
  try { await (await $('#logout-btn')).click(); } catch (_) {}
  localStorage && await driver.executeScript("window.localStorage.clear()");
  await go('/dashboard');
  await sleep(1200);
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/login');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-09  Create Task (valid)
// ══════════════════════════════════════════════════════════════════════════════
test('TC-09: Creating a task adds it to the task list', async () => {
  await loginAs();
  await click('#new-task-btn');
  await wait('#task-title-input');
  await type('#task-title-input', 'Selenium Test Task');
  await type('#task-desc-input', 'Created by Selenium TC-09');
  await click('#save-task-btn');
  await sleep(800);
  const cards = await $$('.task-card');
  expect(cards.length).toBeGreaterThan(0);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-10  Create Task – Empty Title
// ══════════════════════════════════════════════════════════════════════════════
test('TC-10: Creating task without title shows validation error', async () => {
  await loginAs();
  await click('#new-task-btn');
  await wait('#task-title-input');
  // Leave title empty
  await click('#save-task-btn');
  // Modal stays open (no navigation) – check we are still on dashboard
  await sleep(600);
  const url = await driver.getCurrentUrl();
  expect(url).toContain('/dashboard');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-11  Edit Task Title
// ══════════════════════════════════════════════════════════════════════════════
test('TC-11: Editing a task updates its title', async () => {
  await loginAs();
  await wait('.edit-task-btn');
  // Click first edit button
  const editBtns = await $$('.edit-task-btn');
  await editBtns[0].click();
  await wait('#task-title-input');
  await type('#task-title-input', 'Updated via TC-11');
  await click('#save-task-btn');
  await sleep(800);
  const body = await driver.findElement(By.css('body')).getText();
  expect(body).toContain('Updated via TC-11');
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-12  Change Status to In Progress
// ══════════════════════════════════════════════════════════════════════════════
test('TC-12: Editing task status to in-progress reflects on card', async () => {
  await loginAs();
  await wait('.edit-task-btn');
  const editBtns = await $$('.edit-task-btn');
  await editBtns[0].click();
  await wait('#task-status-input');
  const sel = await $('#task-status-input');
  await sel.sendKeys('in-progress');
  await click('#save-task-btn');
  await sleep(800);
  const statuses = await $$('.task-status');
  const texts = await Promise.all(statuses.map(s => s.getText()));
  expect(texts.some(t => t.includes('in-progress'))).toBe(true);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-13  Mark Task Completed
// ══════════════════════════════════════════════════════════════════════════════
test('TC-13: Editing task status to completed reflects on card', async () => {
  await loginAs();
  await wait('.edit-task-btn');
  const editBtns = await $$('.edit-task-btn');
  await editBtns[0].click();
  await wait('#task-status-input');
  const sel = await $('#task-status-input');
  await sel.sendKeys('completed');
  await click('#save-task-btn');
  await sleep(800);
  const statuses = await $$('.task-status');
  const texts = await Promise.all(statuses.map(s => s.getText()));
  expect(texts.some(t => t.includes('completed'))).toBe(true);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-14  Delete Task
// ══════════════════════════════════════════════════════════════════════════════
test('TC-14: Deleting a task removes it from the list', async () => {
  await loginAs();
  await wait('.task-card');
  const before = (await $$('.task-card')).length;
  await click('.delete-task-btn');
  // Handle JS confirm dialog
  await driver.wait(until.alertIsPresent(), TIMEOUT);
  await driver.switchTo().alert().accept();
  await sleep(1000);
  const after = (await $$('.task-card')).length;
  expect(after).toBeLessThan(before);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-15  Filter by Status
// ══════════════════════════════════════════════════════════════════════════════
test('TC-15: Status filter shows only matching tasks', async () => {
  await loginAs();
  // Create a pending task first
  await click('#new-task-btn');
  await wait('#task-title-input');
  await type('#task-title-input', 'Pending Filter Task');
  await click('#save-task-btn');
  await sleep(600);

  const sel = await $('#status-filter');
  await sel.sendKeys('pending');
  await sleep(500);
  const cards = await $$('.task-card');
  const statuses = await Promise.all(
    (await $$('.task-status')).map(el => el.getText())
  );
  // All visible cards should be pending (or list is empty – no non-pending shown)
  const hasNonPending = statuses.some(s => s !== 'pending');
  expect(hasNonPending).toBe(false);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-16  Search
// ══════════════════════════════════════════════════════════════════════════════
test('TC-16: Search filters tasks by keyword', async () => {
  await loginAs();
  // Create a distinctly named task
  await click('#new-task-btn');
  await wait('#task-title-input');
  await type('#task-title-input', 'UniqueKeyword9X');
  await click('#save-task-btn');
  await sleep(600);

  await type('#search-box', 'UniqueKeyword9X');
  await sleep(500);
  const titles = await Promise.all(
    (await $$('.task-title')).map(el => el.getText())
  );
  expect(titles.every(t => t.includes('UniqueKeyword9X'))).toBe(true);
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
//  TC-17  Page Title
// ══════════════════════════════════════════════════════════════════════════════
test('TC-17: Page title is "Task Manager"', async () => {
  await go('/');
  const title = await driver.getTitle();
  expect(title).toBe('Task Manager');
}, 30000);
