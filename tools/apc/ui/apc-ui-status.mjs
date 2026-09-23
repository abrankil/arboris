export function derivePhotoUiStatus(photo, session) {
  const photoId = photo?.photoId ?? null;
  if (!photoId) return 'sin revisar';

  const evidence = (session?.evidence ?? []).filter(item =>
    item.current === true && item.photoId === photoId
  );
  const hasDraft = evidence.some(item => item.lifecycleStatus === 'DRAFT');
  const hasConfirmed = evidence.some(item => item.lifecycleStatus === 'CONFIRMED');
  const hasPhotoRequiredPending = (session?.pending ?? []).some(item =>
    item.kind === 'UNRESOLVED_REQUIREMENT' &&
    item.status === 'OPEN' &&
    item.scopeLevel === 'PHOTO' &&
    item.scopeRef === photoId
  );

  if (hasPhotoRequiredPending) return 'required pendiente';
  if (hasDraft && hasConfirmed) return 'revisada parcialmente';
  if (hasDraft) return 'DRAFT';
  if (hasConfirmed) return 'CONFIRMED';
  return 'sin revisar';
}
