import { chromium } from 'playwright';

const runTest = async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console messages and errors tracking
  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    console.log(`[${msg.type()}]`, text);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[PAGE ERROR]', error.message);
  });

  page.on('response', response => {
    if (response.url().includes('generativelanguage.googleapis.com')) {
      console.log(`[API Response] ${response.url()} - Status: ${response.status()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('Page loaded successfully');

    // Wait for the app to render
    await page.waitForSelector('h1', { timeout: 5000 });
    const appTitle = await page.textContent('h1');
    console.log('App title:', appTitle);

    // Check for initial AI greeting
    console.log('Waiting for initial AI message...');
    try {
      await page.waitForSelector('[data-testid="ai-message"], .bg-emerald-50 .p-4', { 
        timeout: 10000 
      });
      console.log('Initial AI message appeared');
    } catch (e) {
      console.log('No initial AI message found within 10 seconds');
    }

    // Check if personality selector is present
    const personalitySelector = await page.$('#personality-select');
    if (personalitySelector) {
      const selectedPersonality = await personalitySelector.inputValue();
      console.log('Current personality:', selectedPersonality);
    }

    // Check if topic selector is present
    const topicSelector = await page.$('#topic-select');
    if (topicSelector) {
      const selectedTopic = await topicSelector.inputValue();
      console.log('Current topic:', selectedTopic);
    }

    // Try to send a test message
    console.log('Testing message input...');
    const translatorInput = await page.$('textarea[placeholder*="日本語"]');
    if (translatorInput) {
      await translatorInput.fill('こんにちは');
      console.log('Filled Japanese text');
      
      // Click translate button
      const translateButton = await page.$('button:has-text("Translate")');
      if (translateButton) {
        await translateButton.click();
        console.log('Clicked translate button');
        await page.waitForTimeout(2000);
      }
    }

    // Check for API errors in console
    console.log('\n=== Console Log Summary ===');
    const apiErrors = consoleLogs.filter(log => 
      log.text.toLowerCase().includes('api') || 
      log.text.toLowerCase().includes('error') ||
      log.text.toLowerCase().includes('failed')
    );
    
    if (apiErrors.length > 0) {
      console.log('Found API-related messages:');
      apiErrors.forEach(log => console.log(`  - [${log.type}] ${log.text}`));
    } else {
      console.log('No API errors detected in console');
    }

    // Check if API key is configured
    const apiKeyCheck = consoleLogs.find(log => 
      log.text.includes('API Key:')
    );
    if (apiKeyCheck) {
      console.log('\nAPI Key status:', apiKeyCheck.text);
    }

    // Keep browser open for manual inspection
    console.log('\n=== Test Complete ===');
    console.log('Browser will remain open for manual inspection.');
    console.log('Press Ctrl+C to exit.');
    
    // Keep the script running
    await new Promise(() => {});

  } catch (error) {
    console.error('Test failed:', error);
  }
};

runTest();