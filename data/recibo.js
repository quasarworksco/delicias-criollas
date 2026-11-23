// El identificador completo sigue siendo la clave del documento en Firestore.
export function referenciaVisible(texto) {
  return texto.replace(/^((?:Delicias Criollas · )?Pedido )([a-f0-9]{24})(?=\n|$)/i,
    (_, titulo, id) => titulo + '#' + Number.parseInt(id.slice(0, 8), 16)
      .toString(36).toUpperCase().padStart(7, '0'));
}
