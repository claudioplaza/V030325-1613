const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003; // Cambia 3000 a 3001 o cualquier otro puerto disponible

// Datos de prueba para modo fallback
const testUsers = [
  { id: "ENF001", name: "María López", role: "Enfermero" },
  { id: "ENF002", name: "Juan Pérez", role: "Enfermero" },
  { id: "MED001", name: "Dr. Carlos Rodríguez", role: "Médico" }
];

const testBeds = [
  { id: "PAC001", bedNumber: "101", patientName: "Ana García" },
  { id: "PAC002", bedNumber: "102", patientName: "Roberto Martínez" },
  { id: "PAC003", bedNumber: "103", patientName: "Elena Sánchez" },
  { id: "PAC004", bedNumber: "104", patientName: "Miguel Fernández" }
];

const testControls = {
  "PAC001": [
    {
      patientId: "PAC001",
      patientName: "Ana García",
      bedNumber: "101",
      userId: "ENF001",
      nurseName: "María López",
      controlDate: "2023-05-15T08:30",
      systolicPressure: "120",
      diastolicPressure: "80",
      heartRate: "72",
      respiratoryRate: "16",
      isRespSpontaneous: true,
      temperature: "36.5",
      isCentralTemp: false,
      hemoglucotest: "110",
      observations: "Paciente estable",
      confirmed: true
    },
    {
      patientId: "PAC001",
      patientName: "Ana García",
      bedNumber: "101",
      userId: "ENF002",
      nurseName: "Juan Pérez",
      controlDate: "2023-05-15T12:30",
      systolicPressure: "125",
      diastolicPressure: "85",
      heartRate: "75",
      respiratoryRate: "18",
      isRespSpontaneous: true,
      temperature: "36.8",
      isCentralTemp: false,
      hemoglucotest: "115",
      observations: "Ligero aumento de PA",
      confirmed: true
    }
  ],
  "PAC002": [
    {
      patientId: "PAC002",
      patientName: "Roberto Martínez",
      bedNumber: "102",
      userId: "ENF001",
      nurseName: "María López",
      controlDate: "2023-05-15T09:00",
      systolicPressure: "140",
      diastolicPressure: "90",
      heartRate: "80",
      respiratoryRate: "20",
      isRespSpontaneous: true,
      temperature: "37.2",
      isCentralTemp: false,
      hemoglucotest: "130",
      observations: "Hipertenso controlado",
      confirmed: true
    }
  ],
  "PAC003": [],
  "PAC004": [
    {
      patientId: "PAC004",
      patientName: "Miguel Fernández",
      bedNumber: "104",
      userId: "ENF002",
      nurseName: "Juan Pérez",
      controlDate: "2023-05-15T10:15",
      systolicPressure: "110",
      diastolicPressure: "70",
      heartRate: "68",
      respiratoryRate: "14",
      isRespSpontaneous: true,
      temperature: "36.2",
      isCentralTemp: false,
      hemoglucotest: "95",
      observations: "Paciente en ayunas",
      confirmed: true
    }
  ]
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Verificar si estamos en modo de prueba
function isTestMode(userCode) {
  return testUsers.some(user => user.id === userCode);
}

// Google Sheets API setup
async function getAuthClient() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    // Intentar obtener un token para verificar que la autenticación funciona
    await auth.authorize();
    
    return auth;
  } catch (error) {
    console.error('Error creating auth client:', error);
    throw new Error('Error de autenticación con Google: ' + error.message);
  }
}

// Configuración de hojas de Google Sheets
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const USERS_SHEET = 'Usuarios!A:C';
const PATIENTS_SHEET = 'Pacientes!A:C';
const CONTROLS_SHEET = 'Controles!A:Z'; // Ampliado para incluir más columnas

// API endpoint para verificar usuario
app.post('/api/users/verify', async (req, res) => {
  try {
    const { userCode } = req.body;
    
    if (!userCode) {
      return res.status(400).json({ error: 'Código de usuario requerido' });
    }
    
    // Verificar si es un usuario de prueba
    const testUser = testUsers.find(u => u.id === userCode);
    if (testUser) {
      console.log('Modo de prueba activado para usuario:', testUser.name);
      return res.status(200).json({
        message: 'Usuario verificado correctamente (modo de prueba)',
        user: testUser
      });
    }
    
    // Si no es un usuario de prueba, intentar verificar con Google Sheets
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Obtener datos de la hoja de usuarios
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: USERS_SHEET
      });
      
      const rows = response.data.values || [];
      
      // Buscar usuario por código
      const userRow = rows.find(row => row[0] === userCode);
      
      if (!userRow) {
        return res.status(401).json({ error: 'Código de usuario inválido' });
      }
      
      // Devolver información del usuario
      const user = {
        id: userRow[0],
        name: userRow[1],
        role: userRow[2] || 'Enfermero'
      };
      
      res.status(200).json({
        message: 'Usuario verificado correctamente',
        user
      });
    } catch (error) {
      console.error('Error al verificar usuario con Google Sheets:', error);
      
      // Si hay un error con Google Sheets, sugerir usar un usuario de prueba
      return res.status(500).json({ 
        error: 'Error al verificar usuario. Por favor, intente con un usuario de prueba (ENF001, ENF002, MED001)', 
        details: error.message,
        testMode: true
      });
    }
  } catch (error) {
    console.error('Error general al verificar usuario:', error);
    res.status(500).json({ error: 'Error al verificar usuario', details: error.message });
  }
});

// API endpoint para obtener camas/pacientes
app.get('/api/patients/beds', async (req, res) => {
  try {
    // Intentar obtener datos de Google Sheets
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Obtener datos de la hoja de pacientes
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: PATIENTS_SHEET
      });
      
      const rows = response.data.values || [];
      
      // Omitir la fila de encabezados
      const dataRows = rows.slice(1);
      
      // Formatear datos de camas/pacientes
      const beds = dataRows.map(row => ({
        id: row[0],
        bedNumber: row[1],
        patientName: row[2]
      }));
      
      res.status(200).json({
        message: 'Camas/pacientes obtenidos correctamente',
        beds
      });
    } catch (error) {
      console.error('Error al obtener camas/pacientes de Google Sheets:', error);
      
      // Devolver datos de prueba
      res.status(200).json({
        message: 'Camas/pacientes obtenidos correctamente (modo de prueba)',
        beds: testBeds
      });
    }
  } catch (error) {
    console.error('Error general al obtener camas/pacientes:', error);
    res.status(500).json({ error: 'Error al obtener camas/pacientes', details: error.message });
  }
});

// API endpoint para obtener controles recientes de un paciente
app.get('/api/controls/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Intentar obtener datos de Google Sheets
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Obtener datos de la hoja de controles
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: CONTROLS_SHEET
      });
      
      const rows = response.data.values || [];
      
      // Obtener encabezados
      const headers = rows[0] || [];
      
      // Omitir la fila de encabezados
      const dataRows = rows.slice(1);
      
      // Filtrar controles por ID de paciente
      const patientControls = dataRows
        .filter(row => row[0] === patientId)
        .map(row => {
          // Crear objeto base con los campos principales
          const control = {
            patientId: row[0],
            patientName: row[1],
            userId: row[2],
            nurseName: row[3],
            controlDate: row[4],
            systolicPressure: row[5],
            diastolicPressure: row[6],
            heartRate: row[7],
            temperature: row[8],
            isCentralTemp: row[9] === 'true',
            observations: row[10] || ''
          };
          
          // Agregar campos adicionales si existen
          if (headers.length > 11) {
            // Índices para los nuevos campos
            const fieldIndices = {
              respiratoryRate: 11,
              isRespSpontaneous: 12,
              hemoglucotest: 13,
              corrections: 14,
              diuresis: 15,
              enteralOutput: 16,
              otherOutput: 17,
              php: 18,
              expansions: 19,
              oralIntake: 20,
              enteralIntake: 21,
              drugs: 22
            };
            
            // Agregar cada campo si existe en la fila
            Object.entries(fieldIndices).forEach(([field, index]) => {
              if (row[index] !== undefined) {
                if (field === 'drugs' && row[index]) {
                  try {
                    control[field] = JSON.parse(row[index]);
                  } catch (e) {
                    console.error('Error al parsear drogas:', e);
                    control[field] = [];
                  }
                } else if (field === 'isRespSpontaneous') {
                  control[field] = row[index] === 'true';
                } else {
                  control[field] = row[index];
                }
              }
            });
          }
          
          return control;
        })
        .sort((a, b) => new Date(b.controlDate) - new Date(a.controlDate))
        .slice(0, 5); // Obtener solo los 5 más recientes
      
      res.status(200).json({
        message: 'Controles obtenidos correctamente',
        controls: patientControls
      });
    } catch (error) {
      console.error('Error al obtener controles de Google Sheets:', error);
      
      // Devolver datos de prueba
      const patientControls = testControls[patientId] || [];
      
      res.status(200).json({
        message: 'Controles obtenidos correctamente (modo de prueba)',
        controls: patientControls
      });
    }
  } catch (error) {
    console.error('Error general al obtener controles:', error);
    res.status(500).json({ error: 'Error al obtener controles', details: error.message });
  }
});

// API endpoint para registrar un nuevo control
app.post('/api/controls', async (req, res) => {
  try {
    const {
      patientId,
      userId,
      controlDate,
      systolicPressure,
      diastolicPressure,
      heartRate,
      respiratoryRate,
      isRespSpontaneous,
      temperature,
      isCentralTemp,
      hemoglucotest,
      corrections,
      diuresis,
      enteralOutput,
      otherOutput,
      php,
      expansions,
      oralIntake,
      enteralIntake,
      drugs,
      observations,
      recordedAt
    } = req.body;
    
    if (!patientId || !userId || !controlDate || !systolicPressure || !diastolicPressure || !heartRate || !temperature) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    // Verificar si estamos en modo de prueba
    if (isTestMode(userId)) {
      console.log('Registrando control en modo de prueba');
      
      // Simular éxito en modo de prueba
      return res.status(200).json({
        message: 'Control registrado correctamente (modo de prueba)',
        result: {
          patientId,
          patientName: req.body.patientName,
          userId,
          nurseName: req.body.nurseName,
          controlDate,
          recordedAt
        }
      });
    }
    
    // Intentar registrar en Google Sheets
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Obtener información del paciente
      const patientResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: PATIENTS_SHEET
      });
      
      const patientRows = patientResponse.data.values || [];
      const patientRow = patientRows.find(row => row[0] === patientId);
      
      if (!patientRow) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      
      const patientName = patientRow[2];
      
      // Obtener información del usuario
      const userResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: USERS_SHEET
      });
      
      const userRows = userResponse.data.values || [];
      const userRow = userRows.find(row => row[0] === userId);
      
      if (!userRow) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const nurseName = userRow[1];
      
      // Convertir el array de drogas a JSON string para almacenamiento
      const drugsJson = drugs && drugs.length > 0 ? JSON.stringify(drugs) : '';
      
      // Registrar el control en la hoja de controles
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: CONTROLS_SHEET,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[
            patientId,
            patientName,
            userId,
            nurseName,
            controlDate,
            systolicPressure,
            diastolicPressure,
            heartRate,
            temperature,
            isCentralTemp,
            observations,
            respiratoryRate || '',
            isRespSpontaneous || '',
            hemoglucotest || '',
            corrections || '',
            diuresis || '',
            enteralOutput || '',
            otherOutput || '',
            php || '',
            expansions || '',
            oralIntake || '',
            enteralIntake || '',
            drugsJson,
            recordedAt
          ]]
        }
      });
      
      res.status(200).json({
        message: 'Control registrado correctamente',
        result: response.data
      });
    } catch (error) {
      console.error('Error al registrar control en Google Sheets:', error);
      
      // Sugerir usar modo de prueba
      res.status(500).json({ 
        error: 'Error al registrar control. Por favor, intente con un usuario de prueba (ENF001, ENF002, MED001)', 
        details: error.message,
        testMode: true
      });
    }
  } catch (error) {
    console.error('Error general al registrar control:', error);
    res.status(500).json({ error: 'Error al registrar control', details: error.message });
  }
});

// Servir la página HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejar todas las demás rutas para SPA
app.get('*', (req, res) => {
  // Intentar servir desde public
  const publicPath = path.join(__dirname, 'public', req.path);
  
  // Verificar si la ruta existe en public
  try {
    if (fs.existsSync(publicPath)) {
      return res.sendFile(publicPath);
    }
  } catch (error) {
    console.error('Error al verificar existencia de archivo:', error);
  }
  
  // Si no existe en public, servir la página principal
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Visite http://localhost:${PORT} para acceder a la aplicación`);
  console.log(`Usuarios de prueba disponibles: ENF001, ENF002, MED001`);
});