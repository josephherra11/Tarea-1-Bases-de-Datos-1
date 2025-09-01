const listaSection = document.getElementById('listaSection');
const insertSection = document.getElementById('insertSection');
const btnIrInsertar = document.getElementById('btnIrInsertar');
const btnRegresar = document.getElementById('btnRegresar');
const gridBody = document.getElementById('gridBody');
const listaMensaje = document.getElementById('listaMensaje');

const formInsertar = document.getElementById('formInsertar');
const txtNombre = document.getElementById('txtNombre');
const txtSalario = document.getElementById('txtSalario');
const insertMensaje = document.getElementById('insertMensaje');

function mostrarLista() {
  insertSection.classList.add('hidden');
  listaSection.classList.remove('hidden');
  cargarEmpleados();
}
function mostrarInsertar() {
  listaSection.classList.add('hidden');
  insertSection.classList.remove('hidden');
  insertMensaje.textContent = '';
  formInsertar.reset();
}

btnIrInsertar?.addEventListener('click', mostrarInsertar);
btnRegresar?.addEventListener('click', mostrarLista);

async function cargarEmpleados() {
  listaMensaje.textContent = 'Cargando...';
  gridBody.innerHTML = '';
  try {
    const resp = await fetch('/api/empleados');
    if (!resp.ok) throw new Error('Error en la carga');
    const data = await resp.json();
    for (const emp of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${emp.id}</td>
        <td>${emp.Nombre}</td>
        <td>${Number(emp.Salario).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</td>
      `;
      gridBody.appendChild(tr);
    }
    listaMensaje.textContent = data.length ? '' : 'No hay empleados todavía.';
  } catch (e) {
    console.error(e);
    listaMensaje.textContent = 'No se pudo cargar la lista.';
  }
}

function validarNombre(nombre) {
  const re = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s-]+$/;
  return re.test(nombre.trim());
}
function validarSalario(s) {
  const num = Number(s);
  return Number.isFinite(num) && num > 0;
}

formInsertar?.addEventListener('submit', async (e) => {
  e.preventDefault();
  insertMensaje.textContent = '';

  const nombre = txtNombre.value;
  const salario = txtSalario.value;

  if (!validarNombre(nombre)) {
    insertMensaje.textContent = 'Nombre inválido (solo letras y guion).';
    return;
  }
  if (!validarSalario(salario)) {
    insertMensaje.textContent = 'Salario inválido (debe ser positivo).';
    return;
  }

  try {
    const resp = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, salario })
    });
    const body = await resp.json();
    if (!resp.ok) {
      insertMensaje.textContent = body.error || 'No se pudo insertar.';
      return;
    }
    alert('Inserción exitosa');
    mostrarLista();
  } catch (e) {
    console.error(e);
    insertMensaje.textContent = 'Error de red.';
  }
});

// Cuando carga la página
cargarEmpleados();
