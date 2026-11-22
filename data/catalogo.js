export const inicial = fetch(new URL('./menu-inicial.json', import.meta.url))
  .then(response => {
    if (!response.ok) throw new Error('No se pudo cargar el catálogo inicial.');
    return response.json();
  });

export function combinar(base, publicados) {
  const productos = new Map(base.map(item => [item.id, item]));
  for (const item of publicados) productos.set(item.id, item);
  return [...productos.values()].filter(item => item.retirado !== true);
}
