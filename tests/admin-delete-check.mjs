import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') pageErrors.push(message.text());
});

try {
  await page.goto('http://localhost:4173/admin/login');
  await page.getByLabel('Mobile Number').fill('9999999999');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.getByLabel('Enter OTP').fill('123456');
  await page.getByRole('button', { name: 'Verify OTP' }).click();
  await page.waitForURL('**/admin');

  await page.goto('http://localhost:4173/admin/users');
  await page.waitForSelector('button:has-text("Delete permanently")', { timeout: 15000 });
  page.on('dialog', async (dialog) => { await dialog.accept(); });
  await page.locator('button:has-text("Delete permanently")').first().click();
  await page.waitForTimeout(1000);

  const visibleDeleteButtons = await page.locator('button:has-text("Delete permanently")').count();
  console.log(JSON.stringify({ visibleDeleteButtons, pageErrors }, null, 2));
  if (pageErrors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
