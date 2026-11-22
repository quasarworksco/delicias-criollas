const {onRequest} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, Timestamp} = require('firebase-admin/firestore');
const {createHash} = require('node:crypto');
initializeApp();
const db = getFirestore();
const invalid = () => { throw new Error('invalid'); };

exports.crearPedido = onRequest({cors:true, maxInstances:5}, async (req,res) => {
  if (req.method !== 'POST') return res.sendStatus(405);
  try {
    const {clave, modalidad, nombre, destino, productos} = req.body;
    if (!/^[a-f0-9-]{36}$/.test(clave) || !['Retiro','En el local','Delivery'].includes(modalidad)
      || typeof nombre !== 'string' || !nombre.trim() || nombre.length > 80
      || typeof destino !== 'string' || destino.length > 250 || (modalidad === 'Delivery' && !destino.trim())
      || !Array.isArray(productos) || !productos.length || productos.length > 80) invalid();
    const ids = new Set();
    for (const item of productos) {
      if (typeof item.id !== 'string' || !/^[\w-]{1,128}$/.test(item.id) || ids.has(item.id)
        || !Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 99) invalid();
      ids.add(item.id);
    }
    const ref = db.collection('pedidos').doc(createHash('sha256').update(clave).digest('hex').slice(0,24));
    const pedido = await db.runTransaction(async tx => {
      const previous = await tx.get(ref);
      if (previous.exists) return previous.data();
      const docs = await tx.getAll(...productos.map(i => db.collection('menuPublico').doc(i.id)));
      const lineas = docs.map((doc,i) => {
        const data = doc.data();
        if (!data || typeof data.nombre !== 'string' || !Number.isSafeInteger(data.precioCentavos) || data.precioCentavos < 0) invalid();
        return {nombre:data.nombre, precio:data.precioCentavos, cantidad:productos[i].cantidad};
      });
      const total = lineas.reduce((n,i) => n+i.precio*i.cantidad,0);
      const recibo = ['Delicias Criollas · Pedido '+ref.id, modalidad+' · '+nombre.trim(),
        ...(modalidad === 'Delivery' ? [destino.trim()] : []),
        ...lineas.map(i => i.cantidad+' × '+i.nombre+' — $'+(i.precio*i.cantidad/100).toFixed(2)),
        'Total de productos: $'+(total/100).toFixed(2)+' USD',
        ...(modalidad === 'Delivery' ? ['Envío por confirmar con el restaurante.'] : [])].join('\n');
      const now = Date.now();
      const data = {recibo, total, estado:'Nuevo', creado:Timestamp.fromMillis(now), expira:Timestamp.fromMillis(now+48*3600000)};
      tx.create(ref,data);
      const resumen = ['Pedido '+ref.id, modalidad,
        ...lineas.map(i => i.cantidad+' × '+i.nombre),
        'Total de productos: $'+(total/100).toFixed(2)+' USD'].join('\n');
      tx.create(db.collection('pedidosPanel').doc(ref.id), {...data, recibo:resumen});
      return data;
    });
    res.json({id:ref.id,recibo:pedido.recibo});
  } catch (error) {
    res.status(error.message === 'invalid' ? 400 : 503).json({error:'No se pudo registrar el pedido. Comprueba la carta e inténtalo otra vez.'});
  }
});

exports.limpiarRecibos = onSchedule('every 5 minutes', async () => {
  const cutoff = Timestamp.now();
  for (;;) {
    const expired = await db.collection('pedidos').where('expira','<=',cutoff).limit(200).get();
    if (expired.empty) return;
    const batch = db.batch();
    expired.docs.forEach(doc => {
      batch.delete(doc.ref);
      batch.delete(db.collection('pedidosPanel').doc(doc.id));
    });
    await batch.commit();
  }
});
