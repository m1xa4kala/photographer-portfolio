/**
 * Показывает диалог подтверждения удаления.
 * Возвращает true, если пользователь подтвердил.
 */
export const confirmDelete = (label: string): boolean =>
  window.confirm(`Удалить "${label}"? Это действие нельзя отменить.`);