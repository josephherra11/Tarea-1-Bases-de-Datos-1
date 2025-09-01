require('dotenv').config();
const express = require('express');
const path = require('path');
const sql = require('mssql');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ProyectoDB',
  server: process.env.DB_SERVER || 'PINO',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(dbConfig);
  return pool;
}

app.get('/api/empleados', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().execute('dbo.sp_listarEmpleados');
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, salario } = req.body;
    if (typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }
    const nameOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s-]+$/.test(nombre.trim());
    if (!nameOk) {
      return res.status(400).json({ error: 'Nombre inválido (solo letras y guion)' });
    }
    const num = Number(salario);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ error: 'Salario inválido' });
    }

    const p = await getPool();
    await p.request()
      .input('Nombre', sql.VarChar(128), nombre.trim())
      .input('Salario', sql.Money, num)
      .execute('dbo.sp_insertarEmpleado');

    res.status(201).json({ message: 'Inserción exitosa' });
  } catch (err) {
    const msg = err.originalError?.info?.message || err.message;
    if (msg && msg.toLowerCase().includes('ya existe')) {
      return res.status(409).json({ error: 'Nombre de Empleado ya existe.' });
      }
    if (msg && (msg.includes('Nombre vacío') || msg.includes('Salario inválido'))) {
      return res.status(400).json({ error: msg });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al insertar empleado' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});