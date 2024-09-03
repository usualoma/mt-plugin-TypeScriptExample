import { test, expect } from '@playwright/test';

test('メンバーリスト機能のテスト', async ({ page }) => {
  // ページを開く
  await page.goto('/');

  // メンバー追加ボタンが表示されていることを確認
  const addButton = page.getByText('メンバーを追加');
  await expect(addButton).toBeVisible();

  // メンバーを追加
  await addButton.click();

  // 役割を入力
  const roleInput = page.locator('input').first();
  await roleInput.fill('テストリーダー');

  // 名前を入力
  const nameInput = page.locator('input').nth(1);
  await nameInput.fill('テストユーザー');

  // // 入力されたメンバー情報が表示されていることを確認
  // await expect(page.getByText('テストリーダー')).toBeVisible();
  // await expect(page.getByText('テストユーザー')).toBeVisible();

  // // 削除ボタンが表示されていることを確認
  // const deleteButton = page.getByText('削除');
  // await expect(deleteButton).toBeVisible();

  // // メンバーを削除
  // await deleteButton.click();

  // // メンバーが削除されたことを確認
  // await expect(page.getByText('テストリーダー')).not.toBeVisible();
  // await expect(page.getByText('テストユーザー')).not.toBeVisible();
});
