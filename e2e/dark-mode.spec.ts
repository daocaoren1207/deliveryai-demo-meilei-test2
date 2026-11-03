import { test, expect, type Page } from '@playwright/test'

const switchToDark = /切换到暗黑模式|Switch to dark mode/
const switchToLight = /切换到明亮模式|Switch to light mode/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme-mode', 'light')
    localStorage.setItem('i18nextLng', 'zh')
  })
})

async function enterMenu(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /A08/ }).first().click()
  await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
}

async function expectDarkMode(page: Page) {
  await expect(page.locator('html')).toHaveClass(/(^|\s)dark(\s|$)/)
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#211f1c')
}

async function expectLightMode(page: Page) {
  await expect(page.locator('html')).not.toHaveClass(/(^|\s)dark(\s|$)/)
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fbf5ea')
}

async function openProductSpec(page: Page, productName: string) {
  const productCard = page.locator('article').filter({ hasText: productName })
  await productCard.locator('button').last().click()
  await expect(page.getByRole('dialog', { name: productName })).toBeVisible()
}

test.describe('暗黑模式 - E2E 验收测试', () => {
  test('REQ-001/REQ-002: 用户可在主流程切换暗黑和明亮模式，页面主要内容保持可读可操作', async ({ page }) => {
    await page.goto('/')
    await expectLightMode(page)
    await expect(page.getByRole('heading', { name: /热气升腾/ })).toBeVisible()

    await page.getByRole('button', { name: switchToDark }).click()
    await expectDarkMode(page)
    await expect(page.getByRole('button', { name: switchToLight })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: /A08/ }).first().click()
    await expect(page.getByRole('heading', { name: '欢迎光临沸点！' })).toBeVisible()
    await expectDarkMode(page)

    await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
    await expect(page).toHaveURL(/#\/menu$/)
    await expect(page.getByRole('heading', { name: '想吃什么，一起点。' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '本桌购物车' })).toBeVisible()
    await expectDarkMode(page)

    await page.getByRole('button', { name: switchToLight }).click()
    await expectLightMode(page)
    await expect(page.getByRole('button', { name: switchToDark })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('heading', { name: '想吃什么，一起点。' })).toBeVisible()
  })

  test('REQ-003/REQ-005: 切换主题不丢失搜索筛选、购物车、订单和结账支付方式', async ({ page }) => {
    await enterMenu(page)

    const searchInput = page.getByPlaceholder('搜索锅底、菜品或饮品')
    await searchInput.fill('牛肉')
    await page.getByRole('button', { name: '牛羊肉' }).click()
    await expect(searchInput).toHaveValue('牛肉')
    await expect(page.getByRole('heading', { name: '琥珀嫩牛肉' })).toBeVisible()

    await openProductSpec(page, '琥珀嫩牛肉')
    await page.getByRole('button', { name: '半份' }).click()
    await page.getByRole('button', { name: '加入本桌购物车' }).click()
    await expect(page.getByRole('heading', { name: '本桌购物车' })).toBeVisible()
    await expect(page.getByText('琥珀嫩牛肉').first()).toBeVisible()
    await expect(page.getByText('半份').first()).toBeVisible()

    await page.getByRole('button', { name: switchToDark }).click()
    await expectDarkMode(page)
    await expect(page).toHaveURL(/#\/menu$/)
    await expect(searchInput).toHaveValue('牛肉')
    await expect(page.getByText('琥珀嫩牛肉').first()).toBeVisible()
    await expect(page.getByText('半份').first()).toBeVisible()

    await page.getByRole('button', { name: '确认并提交订单' }).click()
    await expect(page).toHaveURL(/#\/order$/)
    await expect(page.getByRole('heading', { name: '这一锅，正在抵达' })).toBeVisible()
    await expect(page.getByText('琥珀嫩牛肉').first()).toBeVisible()

    await page.getByRole('button', { name: '去结账' }).click()
    await expect(page).toHaveURL(/#\/checkout$/)
    const posMethod = page.getByRole('button', { name: /桌边 POS/ })
    await posMethod.click()
    await expect(posMethod).toHaveClass(/border-chili-500/)

    await page.getByRole('button', { name: switchToLight }).click()
    await expectLightMode(page)
    await expect(page).toHaveURL(/#\/checkout$/)
    await expect(page.getByText('琥珀嫩牛肉').first()).toBeVisible()
    await expect(posMethod).toHaveClass(/border-chili-500/)
  })

  test('REQ-003: 菜品规格弹窗打开时仍可切换主题并保留已选规格', async ({ page }) => {
    await enterMenu(page)
    await openProductSpec(page, '鎏金番茄鸳鸯锅')
    await page.getByRole('button', { name: '菌汤 + 牛油' }).click()
    await page.getByRole('button', { name: '中辣' }).click()

    const specDialog = page.getByRole('dialog', { name: '鎏金番茄鸳鸯锅' })
    await expect(specDialog).toBeVisible()
    await expect(page.getByRole('button', { name: '菌汤 + 牛油' })).toHaveClass(/border-chili-500/)
    await expect(page.getByRole('button', { name: '中辣' })).toHaveClass(/border-chili-500/)

    await expect(
      page.getByRole('button', { name: switchToDark }),
      '菜品规格弹窗打开时，用户仍应能访问主题切换入口以验证切换不关闭弹窗、不丢失规格选择',
    ).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: switchToDark }).click()

    await expectDarkMode(page)
    await expect(specDialog).toBeVisible()
    await expect(page.getByRole('button', { name: '菌汤 + 牛油' })).toHaveClass(/border-chili-500/)
    await expect(page.getByRole('button', { name: '中辣' })).toHaveClass(/border-chili-500/)
  })
})
