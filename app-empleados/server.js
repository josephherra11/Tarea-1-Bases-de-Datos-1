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
      .output('outResultCode', sql.Int)
      .execute('dbo.sp_listarEmpleados');

    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// ---------------------
// Endpoint: Insertar empleado con manejo de SP
// ---------------------
app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, salario } = req.body;
    const num = Number(salario);

    const p = await getPool();
    const r = await p.request()
      .input('inNombre', sql.VarChar(128), nombre)
      .input('inSalario', sql.Money, num)
      .output('outResultCode', sql.Int)
      .execute('dbo.sp_insertarEmpleado');

    const code = r.output.outResultCode;

    if (code === 0) {
      // Inserción exitosa
      return res.status(201).json({ message: 'Empleado insertado correctamente' });
    } else if (code === 50001) {
      // Ya existe
      return res.status(400).json({ error: 'El empleado ya está registrado.' });
    } else if (code === 50003) {
      // Error general desde SP
      return res.status(500).json({ error: 'Error al ingresar al sistema.' });
    } else {
      // Cualquier otro código inesperado
      return res.status(500).json({ error: 'Error general al insertar.' });
    }

  } catch (err) {
    console.error(err);
    // Solo para errores de conexión u otros no previstos
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

const PORT = process.env.PORT || 10029;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
}
