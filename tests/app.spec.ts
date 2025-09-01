import { test, expect } from '@playwright/test';

test.describe('英会話アプリ基本機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('アプリが正常に起動する', async ({ page }) => {
    // タイトルの確認
    await expect(page).toHaveTitle(/Eikaiwa Buddy/);
    
    // 主要な要素が表示されているか確認
    const chatArea = page.locator('[class*="chat"]').first();
    await expect(chatArea).toBeVisible();
  });

  test('音声入力ボタンが表示される', async ({ page }) => {
    // 音声入力ボタンの確認
    const voiceButton = page.locator('button[aria-label*="音声入力"]').or(page.locator('button[title*="音声入力"]'));
    await expect(voiceButton).toBeVisible();
  });

  test('設定パネルが開閉できる', async ({ page }) => {
    // 設定ボタンを探す
    const settingsButton = page.locator('button[aria-label*="設定"]').or(page.locator('button[title*="設定"]'));
    
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      
      // 設定パネルが表示されるか確認
      const settingsPanel = page.locator('text=/パーソナリティ|Personality/i');
      await expect(settingsPanel).toBeVisible({ timeout: 5000 });
    }
  });

  test('メッセージの送信ができる', async ({ page }) => {
    // テキスト入力エリアを探す
    const textInput = page.locator('input[type="text"], textarea').first();
    
    if (await textInput.count() > 0) {
      // テストメッセージを入力
      await textInput.fill('Hello, this is a test message');
      
      // Enterキーまたは送信ボタンで送信
      await textInput.press('Enter');
      
      // メッセージが表示されるか確認
      await expect(page.locator('text=Hello, this is a test message')).toBeVisible({ timeout: 10000 });
    }
  });

  test('音声読み上げボタンが機能する', async ({ page, context }) => {
    // ブラウザの権限を設定
    await context.grantPermissions(['microphone']);
    
    // AIメッセージが存在する場合、読み上げボタンを確認
    const aiMessage = page.locator('[class*="bg-white"]').first();
    
    if (await aiMessage.count() > 0) {
      // 読み上げボタンを探す
      const speakerButton = aiMessage.locator('button[aria-label*="読み上げ"], button[title*="読み上げ"]');
      
      if (await speakerButton.count() > 0) {
        // ボタンが表示されているか確認
        await expect(speakerButton.first()).toBeVisible();
        
        // クリックしてエラーが発生しないか確認
        await speakerButton.first().click();
        
        // エラーがないことを確認（コンソールエラーのチェック）
        page.on('console', msg => {
          if (msg.type() === 'error') {
            throw new Error(`Console error: ${msg.text()}`);
          }
        });
        
        await page.waitForTimeout(1000); // 音声再生の開始を待つ
      }
    }
  });

  test('コンソールにエラーがない', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // ページをリロードして初期化エラーを確認
    await page.reload();
    await page.waitForTimeout(3000);
    
    // APIキー関連の警告は除外
    const criticalErrors = errors.filter(err => 
      !err.includes('VITE_GEMINI_API_KEY') && 
      !err.includes('API key') &&
      !err.includes('demo mode')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('音声機能の詳細テスト', () => {
  test('speechSynthesis APIが利用可能', async ({ page }) => {
    const speechAvailable = await page.evaluate(() => {
      return 'speechSynthesis' in window;
    });
    
    expect(speechAvailable).toBeTruthy();
  });
  
  test('音声読み上げが重複しない', async ({ page }) => {
    await page.goto('/');
    
    // speechSynthesisの呼び出し回数をトラッキング
    await page.evaluate(() => {
      let speakCount = 0;
      const originalSpeak = window.speechSynthesis.speak;
      
      window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
        speakCount++;
        (window as any).__speakCount = speakCount;
        return originalSpeak.call(this, utterance);
      };
    });
    
    // ページリロードして初期メッセージを表示
    await page.reload();
    await page.waitForTimeout(2000);
    
    // speak()の呼び出し回数を確認
    const speakCount = await page.evaluate(() => (window as any).__speakCount || 0);
    
    // 初期メッセージで1回だけ呼ばれるはず
    expect(speakCount).toBeLessThanOrEqual(1);
  });
});