const archivo = document.querySelector('#archivo-foto');
const enlace = document.querySelector('[name="fotoUrl"]');
const vista = document.querySelector('#vista-foto');
let local = '';
let anterior = '';

function mostrar() {
  if (local) URL.revokeObjectURL(local);
  local = archivo.files[0] ? URL.createObjectURL(archivo.files[0]) : '';
  const src = local || enlace.value.trim() || anterior;
  vista.hidden = !src;
  if (src) vista.src = src;
  else vista.removeAttribute('src');
}

archivo.onchange = () => {
  if (archivo.files.length) enlace.value = '';
  mostrar();
};
enlace.oninput = () => {
  archivo.value = '';
  mostrar();
};

export function prepararFoto(url = '', respaldo = '') {
  archivo.value = '';
  enlace.value = url;
  anterior = respaldo;
  mostrar();
}

export async function guardarFoto() {
  const file = archivo.files[0];
  if (!file) return enlace.value.trim();
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', 'deliciascriollas');
  const response = await fetch('https://api.cloudinary.com/v1_1/do4fpfwlb/image/upload', {
    method: 'POST', body, signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error('No se pudo cargar la imagen. Reintenta o pega un enlace.');
  const {secure_url} = await response.json();
  if (!secure_url?.startsWith('https://')) throw new Error('La carga no devolvió un enlace válido.');
  return secure_url;
}
