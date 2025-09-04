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
  server: process.env.DB_SERVER || 'mssql-201669-0.cloudclusters.net',
  port: Number(process.env.DB_PORT) || 10029,
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

// ---------------------
// Endpoint: Listar empleados
// ---------------------
app.get('/api/empleados', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request()
      .output('outResultCode', sql.Int) // Declaramos parámetro de salida
      .execute('dbo.sp_listarEmpleados');

    // Podés revisar r.output.outResultCode si necesitás
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// ---------------------
// Endpoint: Insertar empleado con error general
// ---------------------
app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, salario } = req.body;
    const num = Number(salario);

    const p = await getPool();
    await p.request()
      .input('inNombre', sql.VarChar(128), nombre)
      .input('inSalario', sql.Money, num)
      .output('outResultCode', sql.Int)
      .execute('dbo.sp_insertarEmpleado');

    res.status(201).json({ message: 'Empleado insertado correctamente' });
  } catch (err) {
    console.error(err);
    // Mostrar solo error general
    res.status(400).json({ error: 'No se puede ingresar el usuario.' });
  }
});

const PORT = process.env.PORT || 10029;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
