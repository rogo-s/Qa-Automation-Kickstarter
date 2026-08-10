import { test, expect } from '@playwright/test';
import { DragDropPage } from '../../shared/pages/DragDropPage';
import backofficeData from '../../shared/test-data/backoffice.json';

/**
 * Studi kasus: Back Office - Drag and Drop
 * Target: the-internet.herokuapp.com
 * Data test: shared/test-data/backoffice.json (drag_drop)
 */

const dragDrop = backofficeData.drag_drop;

test.describe('Back Office - Drag and Drop @regression', () => {
  test('Kolom menampilkan header A dan B @smoke', async ({ page }) => {
    const dragDropPage = new DragDropPage(page);
    await dragDropPage.goto();

    expect(await dragDropPage.headerOf(dragDropPage.columnA)).toBe(dragDrop.column_a);
    expect(await dragDropPage.headerOf(dragDropPage.columnB)).toBe(dragDrop.column_b);
  });

  test('Drag kolom A ke B harus menukar posisi @smoke', async ({ page }) => {
    const dragDropPage = new DragDropPage(page);
    await dragDropPage.goto();

    await dragDropPage.dragAtoB();
    await expect(dragDropPage.columnA).toContainText(dragDrop.column_b);
    await expect(dragDropPage.columnB).toContainText(dragDrop.column_a);
  });
});
