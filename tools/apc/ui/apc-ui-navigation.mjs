export function derivePhotoNavigationTarget({ visiblePhotoIds, activePhotoId, delta }) {
  if (delta !== -1 && delta !== 1) {
    throw new RangeError('delta must be -1 or +1');
  }

  const ids = visiblePhotoIds ?? [];
  if (!ids.length) return null;

  const index = ids.indexOf(activePhotoId);
  if (index < 0) return delta === 1 ? ids[0] : ids[ids.length - 1];

  return ids[(index + delta + ids.length) % ids.length];
}
