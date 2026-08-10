import { test, expect } from '@playwright/test';
import { FramesPage } from '../../shared/pages/FramesPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Frames (nested frames & iframe)
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (frames)
 */

const frames = backofficeData.frames;

test.describe('Back Office - Frames @regression', () => {
  test('Nested frame menampilkan teks LEFT/MIDDLE/RIGHT @smoke', async ({ page }) => {
    const framesPage = new FramesPage(page);
    await framesPage.gotoNested();

    await expect(framesPage.nestedFrameBody('left')).toContainText(frames.left);
    await expect(framesPage.nestedFrameBody('middle')).toContainText(frames.middle);
    await expect(framesPage.nestedFrameBody('right')).toContainText(frames.right);
  });

  test('Nested frame bawah menampilkan teks BOTTOM @smoke', async ({ page }) => {
    const framesPage = new FramesPage(page);
    await framesPage.gotoNested();

    await expect(framesPage.bottomFrameBody()).toContainText(frames.bottom);
  });

  test('iFrame editor menampilkan konten default', async ({ page }) => {
    const framesPage = new FramesPage(page);
    await framesPage.gotoIframe();

    await expect(framesPage.editorBody()).toContainText(frames.editor_content);
  });
});
