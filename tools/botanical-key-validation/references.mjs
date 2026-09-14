// Reviewed foliar references; filenames are provenance keys, never visual evidence.
export const REPRESENTATIVES = {
  SP001: 'SP001_CA001_hojas_02.jpg',
  SP002: 'SP002_LC001_hojas_01.jpg',
  SP003: 'SP003_KO002_hojas_01.jpg',
  SP004: 'SP004_PM002_hojas_01.jpg',
  SP005: 'SP005_CO001_hojas_01.jpg',
  SP006: 'SP006_QS001_hojas_02.jpg',
};
export function referenceLibrary(dataset) {
  return Object.entries(REPRESENTATIVES).flatMap(([speciesId, file], index) => {
    const owner = dataset.find(i => i.groundTruth.id === speciesId && i.photos.some(p => p.file === file));
    if (!owner) return []; // Never borrow a photograph from another species.
    const photo = owner.photos.find(p => p.file === file);
    if (!photo.structure.includes('hojas')) throw new Error('Reference must be foliar');
    return [{ speciesId, commonName: owner.groundTruth.commonName,
      images: [{ id: `foliar-v1-${index + 1}`, sourcePhotoId: photo.id ?? photo.file,
        file: photo.file, path: photo.path, structure: photo.structure, url: `/reference/foliar-v1-${index + 1}` }] }];
  });
}
