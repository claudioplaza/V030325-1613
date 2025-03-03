// Variables globales
let currentUser = null;
let selectedPatient = null;
let testMode = false; // Inicialmente falso, se activará según el código de usuario
let userControlsArray = []; // Almacenar controles del usuario actual en modo de prueba
let pendingControls = []; // Almacenar controles pendientes de confirmación

// Datos de prueba
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

// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const bedSelectionScreen = document.getElementById('bedSelectionScreen');
const nursingControlScreen = document.getElementById('nursingControlScreen');
const recentControlsContainer = document.getElementById('recentControlsContainer');
const userControlsContainer = document.getElementById('userControlsContainer');
const pendingControlsContainer = document.getElementById('pendingControlsContainer');

const loginForm = document.getElementById('loginForm');
const bedSelectionForm = document.getElementById('bedSelectionForm');
const nursingControlForm = document.getElementById('nursingControlForm');

const loginMessage = document.getElementById('loginMessage');
const controlMessage = document.getElementById('controlMessage');

const currentUserSpan = document.getElementById('currentUser');
const nurseUserSpan = document.getElementById('nurseUser');
const currentPatientSpan = document.getElementById('currentPatient');
const currentBedSpan = document.getElementById('currentBed');

const patientBedSelect = document.getElementById('patientBed');
const logoutBtn = document.getElementById('logoutBtn');
const backToSelectionBtn = document.getElementById('backToSelectionBtn');
const exitAppBtn = document.getElementById('exitAppBtn');
const recentControls = document.getElementById('recentControls');
const userControls = document.getElementById('userControls');
const pendingControlsList = document.getElementById('pendingControls');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Configurar fecha y hora actual en el formulario
  updateCurrentDateTime();
  
  // Configurar event listeners
  loginForm.addEventListener('submit', handleLogin);
  bedSelectionForm.addEventListener('submit', handleBedSelection);
  nursingControlForm.addEventListener('submit', handleControlSubmission);
  logoutBtn.addEventListener('click', handleLogout);
  backToSelectionBtn.addEventListener('click', showBedSelectionScreen);
  exitAppBtn.addEventListener('click', confirmExit);
  
  // Configurar manejo de drogas
  setupDrugEntries();
  setupOtherDrugFields();
});

function initTestMode() {
  testMode = true;
  const testModeMessage = document.createElement('div');
  testModeMessage.className = 'test-mode-banner';
  testModeMessage.textContent = '🔍 MODO DE PRUEBA ACTIVO - No se requiere conexión a Google Sheets';
  document.body.insertBefore(testModeMessage, document.body.firstChild);
  
  // Sugerir un código de usuario para facilitar las pruebas
  showMessage(loginMessage, 'Modo de prueba: Use ENF001, ENF002 o MED001 como código de usuario', 'warning');
}

function updateCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  document.getElementById('controlDate').value = currentDateTime;
}

// Funciones de manejo de eventos
async function handleLogin(event) {
  event.preventDefault();
  
  const userCode = document.getElementById('userCode').value.trim();
  
  if (!userCode) {
    showMessage(loginMessage, 'Por favor ingrese su código de usuario', 'error');
    return;
  }
  
  try {
    showMessage(loginMessage, 'Verificando usuario...', 'warning');
    
    // Verificar si el código de usuario está en los datos de prueba
    const testUser = testUsers.find(u => u.id === userCode);
    
    // Si el usuario está en los datos de prueba, activar modo de prueba
    if (testUser) {
      initTestMode();
      
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Guardar información del usuario
      currentUser = testUser;
      
      // Actualizar UI
      currentUserSpan.textContent = `${currentUser.name} (${currentUser.role})`;
      nurseUserSpan.textContent = `${currentUser.name} (${currentUser.role})`;
      
      // Cargar camas/pacientes
      await loadPatientBeds();
      
      // Mostrar pantalla de selección
      showBedSelectionScreen();
    } else {
      // Modo real: conectar con API
      testMode = false;
      
      try {
        const response = await fetch('/api/users/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userCode })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Si el servidor sugiere usar modo de prueba
          if (data.testMode) {
            showMessage(loginMessage, `${data.error} Intente con un usuario de prueba.`, 'warning');
            return;
          }
          
          throw new Error(data.error || 'Error al verificar usuario');
        }
        
        // Verificar si estamos en modo de prueba (respuesta del servidor)
        if (data.message.includes('modo de prueba')) {
          initTestMode();
        }
        
        // Guardar información del usuario
        currentUser = data.user;
        
        // Actualizar UI
        currentUserSpan.textContent = `${currentUser.name} (${currentUser.role})`;
        nurseUserSpan.textContent = `${currentUser.name} (${currentUser.role})`;
        
        // Cargar camas/pacientes
        await loadPatientBeds();
        
        // Mostrar pantalla de selección
        showBedSelectionScreen();
      } catch (error) {
        console.error('Error de login en modo real:', error);
        showMessage(loginMessage, `Error: ${error.message}`, 'error');
      }
    }
  } catch (error) {
    console.error('Error de login:', error);
    showMessage(loginMessage, error.message, 'error');
  }
}

async function loadPatientBeds() {
  try {
    if (testMode) {
      // Modo de prueba: usar datos locales
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Limpiar select
      patientBedSelect.innerHTML = '';
      
      // Opción por defecto
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Seleccione una cama/paciente';
      patientBedSelect.appendChild(defaultOption);
      
      // Agregar opciones de camas/pacientes
      testBeds.forEach(bed => {
        const option = document.createElement('option');
        option.value = JSON.stringify({
          id: bed.id,
          bedNumber: bed.bedNumber,
          patientName: bed.patientName
        });
        option.textContent = `Cama ${bed.bedNumber} - ${bed.patientName}`;
        patientBedSelect.appendChild(option);
      });
      
    } else {
      // Modo real: conectar con API
      try {
        const response = await fetch('/api/patients/beds');
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar pacientes');
        }
        
        // Verificar si estamos en modo de prueba (respuesta del servidor)
        if (data.message.includes('modo de prueba')) {
          initTestMode();
        }
        
        // Limpiar select
        patientBedSelect.innerHTML = '';
        
        // Opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione una cama/paciente';
        patientBedSelect.appendChild(defaultOption);
        
        // Agregar opciones de camas/pacientes
        data.beds.forEach(bed => {
          const option = document.createElement('option');
          option.value = JSON.stringify({
            id: bed.id,
            bedNumber: bed.bedNumber,
            patientName: bed.patientName
          });
          option.textContent = `Cama ${bed.bedNumber} - ${bed.patientName}`;
          patientBedSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error al cargar camas/pacientes en modo real:', error);
        showMessage(loginMessage, `Error: ${error.message}`, 'error');
      }
    }
    
  } catch (error) {
    console.error('Error al cargar camas/pacientes:', error);
    showMessage(loginMessage, 'Error al cargar lista de pacientes', 'error');
  }
}

function handleBedSelection(event) {
  event.preventDefault();
  
  const selectedValue = patientBedSelect.value;
  
  if (!selectedValue) {
    alert('Por favor seleccione una cama/paciente');
    return;
  }
  
  // Guardar información del paciente seleccionado
  selectedPatient = JSON.parse(selectedValue);
  
  // Actualizar UI
  currentPatientSpan.textContent = selectedPatient.patientName;
  currentBedSpan.textContent = selectedPatient.bedNumber;
  
  // Cargar controles recientes
  loadRecentControls(selectedPatient.id);
  
  // Mostrar pantalla de registro
  showNursingControlScreen();
}

async function loadRecentControls(patientId) {
  try {
    if (testMode) {
      // Modo de prueba: usar datos locales
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const controls = testControls[patientId] || [];
      
      // Filtrar solo los controles confirmados
      const confirmedControls = controls.filter(control => control.confirmed === true);
      
      // Actualizar UI con controles recientes
      if (confirmedControls.length > 0) {
        recentControls.innerHTML = '';
        
        confirmedControls.forEach(control => {
          const controlEntry = document.createElement('div');
          controlEntry.className = 'control-entry';
          
          const date = new Date(control.controlDate);
          const formattedDate = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          let vitalSigns = `
            <div class="vital-sign">PA: ${control.systolicPressure}/${control.diastolicPressure} mmHg</div>
            <div class="vital-sign">FC: ${control.heartRate} lpm</div>
          `;
          
          if (control.respiratoryRate) {
            vitalSigns += `<div class="vital-sign">FR: ${control.respiratoryRate} rpm${control.isRespSpontaneous ? ' (Espontánea)' : ''}</div>`;
          }
          
          vitalSigns += `<div class="vital-sign">Temp: ${control.temperature} °C${control.isCentralTemp ? ' (Central/Rectal)' : ''}</div>`;
          
          if (control.hemoglucotest) {
            vitalSigns += `<div class="vital-sign">HGT: ${control.hemoglucotest} mg/dl</div>`;
          }
          
          controlEntry.innerHTML = `
            <h3>Control: ${formattedDate}</h3>
            <p>Registrado por: ${control.nurseName}</p>
            <div class="vital-signs">
              ${vitalSigns}
            </div>
            ${control.observations ? `<div class="observations">Observaciones: ${control.observations}</div>` : ''}
          `;
          
          recentControls.appendChild(controlEntry);
        });
        
        recentControlsContainer.style.display = 'block';
      } else {
        recentControls.innerHTML = '<p>No hay registros confirmados para este paciente.</p>';
        recentControlsContainer.style.display = 'block';
      }
      
    } else {
      // Modo real: conectar con API
      try {
        const response = await fetch(`/api/controls/${patientId}`);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar controles recientes');
        }
        
        // Verificar si estamos en modo de prueba (respuesta del servidor)
        if (data.message.includes('modo de prueba')) {
          initTestMode();
        }
        
        // Actualizar UI con controles recientes
        if (data.controls && data.controls.length > 0) {
          recentControls.innerHTML = '';
          
          data.controls.forEach(control => {
            const controlEntry = document.createElement('div');
            controlEntry.className = 'control-entry';
            
            const date = new Date(control.controlDate);
            const formattedDate = date.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            let vitalSigns = `
              <div class="vital-sign">PA: ${control.systolicPressure}/${control.diastolicPressure} mmHg</div>
              <div class="vital-sign">FC: ${control.heartRate} lpm</div>
            `;
            
            if (control.respiratoryRate) {
              vitalSigns += `<div class="vital-sign">FR: ${control.respiratoryRate} rpm${control.isRespSpontaneous ? ' (Espontánea)' : ''}</div>`;
            }
            
            vitalSigns += `<div class="vital-sign">Temp: ${control.temperature} °C${control.isCentralTemp ? ' (Central/Rectal)' : ''}</div>`;
            
            if (control.hemoglucotest) {
              vitalSigns += `<div class="vital-sign">HGT: ${control.hemoglucotest} mg/dl</div>`;
            }
            
            controlEntry.innerHTML = `
              <h3>Control: ${formattedDate}</h3>
              <p>Registrado por: ${control.nurseName}</p>
              <div class="vital-signs">
                ${vitalSigns}
              </div>
              ${control.observations ? `<div class="observations">Observaciones: ${control.observations}</div>` : ''}
            `;
            
            recentControls.appendChild(controlEntry);
          });
          
          recentControlsContainer.style.display = 'block';
        } else {
          recentControls.innerHTML = '<p>No hay registros recientes para este paciente.</p>';
          recentControlsContainer.style.display = 'block';
        }
      } catch (error) {
        console.error('Error al cargar controles recientes en modo real:', error);
        recentControls.innerHTML = `<p>Error al cargar registros recientes: ${error.message}</p>`;
        recentControlsContainer.style.display = 'block';
      }
    }
    
  } catch (error) {
    console.error('Error al cargar controles recientes:', error);
    recentControls.innerHTML = '<p>Error al cargar registros recientes.</p>';
    recentControlsContainer.style.display = 'block';
  }
}

async function handleControlSubmission(event) {
  event.preventDefault();
  
  // Obtener valores del formulario
  const controlDate = document.getElementById('controlDate').value;
  const systolicPressure = document.getElementById('systolicPressure').value;
  const diastolicPressure = document.getElementById('diastolicPressure').value;
  const heartRate = document.getElementById('heartRate').value;
  const temperature = document.getElementById('temperature').value;
  const isCentralTemp = document.getElementById('isCentralTemp')?.checked || false;
  const respiratoryRate = document.getElementById('respiratoryRate')?.value || '';
  const isRespSpontaneous = document.getElementById('isRespSpontaneous')?.checked || false;
  const hemoglucotest = document.getElementById('hemoglucotest')?.value || '';
  const corrections = document.getElementById('corrections')?.value || '';
  const diuresis = document.getElementById('diuresis')?.value || '';
  const enteralOutput = document.getElementById('enteralOutput')?.value || '';
  const otherOutput = document.getElementById('otherOutput')?.value || '';
  const php = document.getElementById('php')?.value || '';
  const expansions = document.getElementById('expansions')?.value || '';
  const oralIntake = document.getElementById('oralIntake')?.value || '';
  const enteralIntake = document.getElementById('enteralIntake')?.value || '';
  const observations = document.getElementById('observations').value;
  
  // Recopilar datos de drogas
  const drugs = [];
  
  // Recopilar AnalgoSedación
  const analgoSedacionEntries = document.querySelectorAll('#analgoSedacionContainer .drug-entry');
  analgoSedacionEntries.forEach(entry => {
    const nameSelect = entry.querySelector('.drug-name');
    const nameOther = entry.querySelector('.drug-name-other');
    const value = entry.querySelector('.drug-value').value;
    
    if (nameSelect.value && nameSelect.value !== "Ninguna") {
      const drugName = nameSelect.value === 'Otro' ? nameOther.value : nameSelect.value;
      if (drugName && value) {
        drugs.push({
          type: 'AnalgoSedacion',
          name: drugName,
          value: value,
          unit: 'ml/h'
        });
      }
    }
  });
  
  // Recopilar Titulables
  const titulablesEntries = document.querySelectorAll('#titulablesContainer .drug-entry');
  titulablesEntries.forEach(entry => {
    const nameSelect = entry.querySelector('.drug-name');
    const nameOther = entry.querySelector('.drug-name-other');
    const value = entry.querySelector('.drug-value').value;
    
    if (nameSelect.value && nameSelect.value !== "Ninguna") {
      const drugName = nameSelect.value === 'Otro' ? nameOther.value : nameSelect.value;
      if (drugName && value) {
        drugs.push({
          type: 'Titulables',
          name: drugName,
          value: value,
          unit: 'ml/h'
        });
      }
    }
  });
  
  // Validaciones básicas
  if (!controlDate || !systolicPressure || !diastolicPressure || !heartRate || !temperature) {
    showMessage(controlMessage, 'Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  try {
    showMessage(controlMessage, 'Guardando registro...', 'warning');
    
    const controlData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.patientName,
      bedNumber: selectedPatient.bedNumber,
      userId: currentUser.id,
      nurseName: currentUser.name,
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
      recordedAt: new Date().toISOString(),
      confirmed: false // Inicialmente no confirmado
    };
    
    // Agregar a pendientes
    pendingControls.push(controlData);
    
    // Actualizar UI de pendientes
    updatePendingControlsUI();
    
    if (testMode) {
      // Modo de prueba: guardar localmente
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Agregar a los controles de prueba (pero no confirmado aún)
      if (!testControls[selectedPatient.id]) {
        testControls[selectedPatient.id] = [];
      }
      testControls[selectedPatient.id].unshift(controlData);
      
      // Guardar en el array de controles del usuario
      userControlsArray.push(controlData);
      
      // Mostrar mensaje de éxito
      showMessage(controlMessage, 'Control registrado correctamente. Pendiente de confirmación (MODO DE PRUEBA)', 'success');
      
    } else {
      // Modo real: conectar con API
      try {
        const response = await fetch('/api/controls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(controlData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Si el servidor sugiere usar modo de prueba
          if (data.testMode) {
            showMessage(controlMessage, `${data.error} Intente con un usuario de prueba.`, 'warning');
            
            // Eliminar de pendientes si hubo error
            pendingControls = pendingControls.filter(c => c.recordedAt !== controlData.recordedAt);
            updatePendingControlsUI();
            return;
          }
          
          throw new Error(data.error || 'Error al guardar el control');
        }
        
        // Verificar si estamos en modo de prueba (respuesta del servidor)
        if (data.message.includes('modo de prueba')) {
          initTestMode();
        }
        
        // Guardar en el array de controles del usuario
        userControlsArray.push(controlData);
        
        // Mostrar mensaje de éxito
        showMessage(controlMessage, 'Control registrado correctamente. Pendiente de confirmación', 'success');
      } catch (error) {
        console.error('Error al guardar control en modo real:', error);
        showMessage(controlMessage, `Error: ${error.message}`, 'error');
        
        // Eliminar de pendientes si hubo error
        pendingControls = pendingControls.filter(c => c.recordedAt !== controlData.recordedAt);
        updatePendingControlsUI();
        return;
      }
    }
    
    // Limpiar formulario (excepto la fecha)
    document.getElementById('systolicPressure').value = '';
    document.getElementById('diastolicPressure').value = '';
    document.getElementById('heartRate').value = '';
    document.getElementById('temperature').value = '';
    if (document.getElementById('isCentralTemp')) document.getElementById('isCentralTemp').checked = false;
    if (document.getElementById('respiratoryRate')) document.getElementById('respiratoryRate').value = '';
    if (document.getElementById('isRespSpontaneous')) document.getElementById('isRespSpontaneous').checked = false; if (document.getElementById('hemoglucotest')) document.getElementById('hemoglucotest').value = '';
    if (document.getElementById('corrections')) document.getElementById('corrections').value = '';
    if (document.getElementById('diuresis')) document.getElementById('diuresis').value = '';
    if (document.getElementById('enteralOutput')) document.getElementById('enteralOutput').value = '';
    if (document.getElementById('otherOutput')) document.getElementById('otherOutput').value = '';
    if (document.getElementById('php')) document.getElementById('php').value = '';
    if (document.getElementById('expansions')) document.getElementById('expansions').value = '';
    if (document.getElementById('oralIntake')) document.getElementById('oralIntake').value = '';
    if (document.getElementById('enteralIntake')) document.getElementById('enteralIntake').value = '';
    document.getElementById('observations').value = '';
    
    // Limpiar entradas de drogas
    resetDrugEntries();
    
    // Actualizar fecha y hora
    updateCurrentDateTime();
    
  } catch (error) {
    console.error('Error al guardar control:', error);
    showMessage(controlMessage, error.message, 'error');
  }
}

function updatePendingControlsUI() {
  if (pendingControls.length === 0) {
    pendingControlsList.innerHTML = '<p>No hay controles pendientes.</p>';
    pendingControlsContainer.style.display = 'none';
    return;
  }
  
  pendingControlsList.innerHTML = '';
  
  pendingControls.forEach((control, index) => {
    const controlEntry = document.createElement('div');
    controlEntry.className = 'pending-control';
    controlEntry.dataset.index = index;
    
    const date = new Date(control.controlDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let vitalSigns = `
      <div class="vital-sign">PA: ${control.systolicPressure}/${control.diastolicPressure} mmHg</div>
      <div class="vital-sign">FC: ${control.heartRate} lpm</div>
    `;
    
    if (control.respiratoryRate) {
      vitalSigns += `<div class="vital-sign">FR: ${control.respiratoryRate} rpm${control.isRespSpontaneous ? ' (Espontánea)' : ''}</div>`;
    }
    
    vitalSigns += `<div class="vital-sign">Temp: ${control.temperature} °C${control.isCentralTemp ? ' (Central/Rectal)' : ''}</div>`;
    
    if (control.hemoglucotest) {
      vitalSigns += `<div class="vital-sign">HGT: ${control.hemoglucotest} mg/dl</div>`;
    }
    
    // Botones para confirmar, editar y eliminar
    const actionButtons = `
      <div class="pending-control-actions">
        <button type="button" class="btn-confirm-record" data-id="${control.recordedAt}">Confirmar</button>
        <button type="button" class="btn-edit-record" data-id="${control.recordedAt}">Editar</button>
        <button type="button" class="btn-delete-record" data-id="${control.recordedAt}">Eliminar</button>
      </div>
    `;
    
    controlEntry.innerHTML = `
      <h3>Control: ${formattedDate}</h3>
      <p>Paciente: ${control.patientName} (Cama ${control.bedNumber})</p>
      <div class="vital-signs">
        ${vitalSigns}
      </div>
      ${control.observations ? `<div class="observations">Observaciones: ${control.observations}</div>` : ''}
      ${actionButtons}
    `;
    
    pendingControlsList.appendChild(controlEntry);
  });
  
  // Configurar event listeners para los botones
  document.querySelectorAll('.btn-confirm-record').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.dataset.id;
      confirmControl(id);
    });
  });
  
  document.querySelectorAll('.btn-edit-record').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.dataset.id;
      editControl(id);
    });
  });
  
  document.querySelectorAll('.btn-delete-record').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.dataset.id;
      deleteControl(id);
    });
  });
  
  pendingControlsContainer.style.display = 'block';
}

function confirmControl(id) {
  // Buscar el control en pendientes
  const controlIndex = pendingControls.findIndex(c => c.recordedAt === id);
  
  if (controlIndex === -1) {
    showMessage(controlMessage, 'Control no encontrado', 'error');
    return;
  }
  
  // Marcar como confirmado
  pendingControls[controlIndex].confirmed = true;
  
  // Actualizar en userControlsArray
  const userControlIndex = userControlsArray.findIndex(c => c.recordedAt === id);
  if (userControlIndex !== -1) {
    userControlsArray[userControlIndex].confirmed = true;
  }
  
  // Actualizar en testControls si estamos en modo de prueba
  if (testMode) {
    const patientId = pendingControls[controlIndex].patientId;
    const testControlIndex = testControls[patientId]?.findIndex(c => c.recordedAt === id);
    if (testControlIndex !== -1) {
      testControls[patientId][testControlIndex].confirmed = true;
    }
  }
  
  // Eliminar de pendientes
  pendingControls.splice(controlIndex, 1);
  
  // Actualizar UI
  updatePendingControlsUI();
  
  // Recargar controles recientes si estamos viendo el mismo paciente
  if (selectedPatient && pendingControls[controlIndex]?.patientId === selectedPatient.id) {
    loadRecentControls(selectedPatient.id);
  }
  
  showMessage(controlMessage, 'Control confirmado correctamente', 'success');
}

function editControl(id) {
  // Implementación básica - simplemente mostrar mensaje
  alert('Funcionalidad de edición no implementada');
}

function deleteControl(id) {
  // Buscar el control en pendientes
  const controlIndex = pendingControls.findIndex(c => c.recordedAt === id);
  
  if (controlIndex === -1) {
    showMessage(controlMessage, 'Control no encontrado', 'error');
    return;
  }
  
  // Confirmar eliminación
  if (confirm('¿Está seguro que desea eliminar este control?')) {
    // Eliminar de userControlsArray
    const userControlIndex = userControlsArray.findIndex(c => c.recordedAt === id);
    if (userControlIndex !== -1) {
      userControlsArray.splice(userControlIndex, 1);
    }
    
    // Eliminar de testControls si estamos en modo de prueba
    if (testMode) {
      const patientId = pendingControls[controlIndex].patientId;
      const testControlIndex = testControls[patientId]?.findIndex(c => c.recordedAt === id);
      if (testControlIndex !== -1) {
        testControls[patientId].splice(testControlIndex, 1);
      }
    }
    
    // Eliminar de pendientes
    pendingControls.splice(controlIndex, 1);
    
    // Actualizar UI
    updatePendingControlsUI();
    
    showMessage(controlMessage, 'Control eliminado correctamente', 'success');
  }
}

function resetDrugEntries() {
  // Reiniciar AnalgoSedación
  const analgoSedacionContainer = document.getElementById('analgoSedacionContainer');
  if (analgoSedacionContainer) {
    analgoSedacionContainer.innerHTML = `
      <div class="drug-entry">
        <select class="drug-name" aria-label="Nombre de la droga">
          <option value="">Seleccionar droga</option>
          <option value="Ninguna">Ninguna</option>
          <option value="Midazolam">Midazolam</option>
          <option value="Fentanilo">Fentanilo</option>
          <option value="Propofol">Propofol</option>
          <option value="Dexmedetomidina">Dexmedetomidina</option>
          <option value="Ketamina">Ketamina</option>
          <option value="Remifentanilo">Remifentanilo</option>
          <option value="Morfina">Morfina</option>
          <option value="Lorazepam">Lorazepam</option>
          <option value="Clonidina">Clonidina</option>
          <option value="Otro">Otro (especificar)</option>
        </select>
        <input type="text" class="drug-name-other" placeholder="Especificar otro" style="display: none;">
        <input type="number" class="drug-value" placeholder="Valor (ml)" min="0" step="0.01" aria-label="Valor de la droga">
        <button type="button" class="btn-icon add-drug">+</button>
      </div>
    `;
  }
  
  // Reiniciar Titulables
  const titulablesContainer = document.getElementById('titulablesContainer');
  if (titulablesContainer) {
    titulablesContainer.innerHTML = `
      <div class="drug-entry">
        <select class="drug-name" aria-label="Nombre de la droga">
          <option value="">Seleccionar droga</option>
          <option value="Ninguna">Ninguna</option>
          <!-- Vasopresores/Vasoactivos -->
          <optgroup label="Vasopresores/Vasoactivos">
            <option value="Noradrenalina">Noradrenalina</option>
            <option value="Adrenalina">Adrenalina</option>
            <option value="Dopamina">Dopamina</option>
            <option value="Dobutamina">Dobutamina</option>
            <option value="Vasopresina">Vasopresina</option>
            <option value="Milrinona">Milrinona</option>
            <option value="Levosimendan">Levosimendan</option>
            <option value="Nitroglicerina">Nitroglicerina</option>
            <option value="Nitroprusiato">Nitroprusiato</option>
          </optgroup>
          <!-- Antiarrítmicos -->
          <optgroup label="Antiarrítmicos">
            <option value="Amiodarona">Amiodarona</option>
            <option value="Lidocaína">Lidocaína</option>
            <option value="Esmolol">Esmolol</option>
            <option value="Diltiazem">Diltiazem</option>
          </optgroup>
          <!-- Diuréticos -->
          <optgroup label="Diuréticos">
            <option value="Furosemida">Furosemida</option>
          </optgroup>
          <!-- Otros -->
          <optgroup label="Otros">
            <option value="Insulina">Insulina</option>
            <option value="Heparina">Heparina</option>
            <option value="Bicarbonato">Bicarbonato</option>
            <option value="Labetalol">Labetalol</option>
            <option value="Otro">Otro (especificar)</option>
          </optgroup>
        </select>
        <input type="text" class="drug-name-other" placeholder="Especificar otro" style="display: none;">
        <input type="number" class="drug-value" placeholder="Valor (ml)" min="0" step="0.01" aria-label="Valor de la droga">
        <button type="button" class="btn-icon add-drug">+</button>
      </div>
    `;
  }
  
  // Reconfigurar el manejo de drogas
  setupDrugEntries();
  setupOtherDrugFields();
}

function confirmExit() {
  // Verificar si hay registros pendientes
  if (pendingControls && pendingControls.length > 0) {
    // Mostrar diálogo de confirmación personalizado
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
      <div class="confirm-dialog-content">
        <h3>Atención</h3>
        <p>Tiene ${pendingControls.length} registro(s) pendiente(s) de confirmación.</p>
        <p>¿Qué desea hacer?</p>
        <div class="confirm-dialog-buttons">
          <button id="confirmAllBtn" class="btn-submit">Confirmar todos</button>
          <button id="reviewBtn" class="btn-secondary">Revisar pendientes</button>
          <button id="exitAnywayBtn" class="btn-reset">Salir sin confirmar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(confirmDialog);
    
    // Configurar event listeners
    document.getElementById('confirmAllBtn').addEventListener('click', function() {
      // Confirmar todos los registros pendientes
      const pendingIds = [...pendingControls].map(c => c.recordedAt);
      pendingIds.forEach(id => confirmControl(id));
      
      // Cerrar diálogo
      document.body.removeChild(confirmDialog); 
      // Salir
      handleLogout();
    });
    
    document.getElementById('reviewBtn').addEventListener('click', function() {
      // Cerrar diálogo
      document.body.removeChild(confirmDialog);
      
      // Hacer scroll a los pendientes
      if (pendingControlsContainer) {
        pendingControlsContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    document.getElementById('exitAnywayBtn').addEventListener('click', function() {
      // Cerrar diálogo
      document.body.removeChild(confirmDialog);
      
      // Salir sin confirmar
      handleLogout();
    });
    
  } else {
    // No hay pendientes, mostrar diálogo simple
    if (confirm('¿Está seguro que desea salir de la aplicación?')) {
      handleLogout();
    }
  }
}

function handleLogout() {
  // Mostrar los controles del usuario actual antes de cerrar sesión
  showUserControls();
  
  // Limpiar datos después de mostrar los controles
  setTimeout(() => {
    // Limpiar datos
    currentUser = null;
    selectedPatient = null;
    userControlsArray = [];
    pendingControls = [];
    
    // Limpiar formularios
    loginForm.reset();
    bedSelectionForm.reset();
    nursingControlForm.reset();
    
    // Ocultar mensajes
    loginMessage.textContent = '';
    loginMessage.className = 'message';
    controlMessage.textContent = '';
    controlMessage.className = 'message';
    
    // Mostrar pantalla de login
    showLoginScreen();
    
    // Eliminar banner de modo de prueba si existe
    const testModeBanner = document.querySelector('.test-mode-banner');
    if (testModeBanner) {
      testModeBanner.remove();
    }
    
    // Restablecer modo de prueba
    testMode = false;
    
    // Eliminar contenedor de pendientes si existe
    if (pendingControlsContainer) {
      pendingControlsContainer.style.display = 'none';
    }
  }, 5000); // Dar tiempo para revisar los controles
}

// Función para mostrar los controles del usuario actual
function showUserControls() {
  userControls.innerHTML = '';
  
  // Filtrar solo los controles confirmados
  const confirmedControls = userControlsArray.filter(control => control.confirmed === true);
  
  if (confirmedControls.length === 0) {
    userControls.innerHTML = '<p>No ha registrado controles confirmados en esta sesión.</p>';
    userControlsContainer.style.display = 'block';
    return;
  }
  
  // Ordenar controles por fecha (más recientes primero)
  confirmedControls.sort((a, b) => new Date(b.controlDate) - new Date(a.controlDate));
  
  confirmedControls.forEach((control, index) => {
    const controlEntry = document.createElement('div');
    controlEntry.className = 'control-entry';
    controlEntry.dataset.index = index;
    
    const date = new Date(control.controlDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let vitalSigns = `
      <div class="vital-sign">PA: ${control.systolicPressure}/${control.diastolicPressure} mmHg</div>
      <div class="vital-sign">FC: ${control.heartRate} lpm</div>
    `;
    
    if (control.respiratoryRate) {
      vitalSigns += `<div class="vital-sign">FR: ${control.respiratoryRate} rpm${control.isRespSpontaneous ? ' (Espontánea)' : ''}</div>`;
    }
    
    vitalSigns += `<div class="vital-sign">Temp: ${control.temperature} °C${control.isCentralTemp ? ' (Central/Rectal)' : ''}</div>`;
    
    // Sección de glucemia
    let glucemiaSection = '';
    if (control.hemoglucotest || control.corrections) {
      glucemiaSection = '<div class="section"><h4>Glucemia</h4><div class="vital-signs">';
      if (control.hemoglucotest) {
        glucemiaSection += `<div class="vital-sign">HGT: ${control.hemoglucotest} mg/dl</div>`;
      }
      if (control.corrections) {
        glucemiaSection += `<div class="vital-sign">Correcciones: ${control.corrections} UIsc o ml/h BIC</div>`;
      }
      glucemiaSection += '</div></div>';
    }
    
    // Sección de ingresos y egresos
    let inOutSection = '';
    if (control.diuresis || control.php || control.expansions || control.oralIntake || 
        control.enteralIntake || control.enteralOutput || control.otherOutput) {
      inOutSection = '<div class="section"><h4>Ingresos y Egresos</h4><div class="vital-signs">';
      
      if (control.diuresis) {
        inOutSection += `<div class="vital-sign">Diuresis: ${control.diuresis} ml</div>`;
      }
      if (control.enteralOutput) {
        inOutSection += `<div class="vital-sign">Débitos enterales: ${control.enteralOutput} ml</div>`;
      }
      if (control.otherOutput) {
        inOutSection += `<div class="vital-sign">Otros débitos: ${control.otherOutput} ml</div>`;
      }
      if (control.php) {
        inOutSection += `<div class="vital-sign">PHP: ${control.php} ml</div>`;
      }
      if (control.expansions) {
        inOutSection += `<div class="vital-sign">Expansiones: ${control.expansions} ml</div>`;
      }
      if (control.oralIntake) {
        inOutSection += `<div class="vital-sign">VO: ${control.oralIntake} ml</div>`;
      }
      if (control.enteralIntake) {
        inOutSection += `<div class="vital-sign">Enteral: ${control.enteralIntake} ml</div>`;
      }
      
      inOutSection += '</div></div>';
    }
    
    // Sección de drogas
    let drugsSection = '';
    if (control.drugs && control.drugs.length > 0) {
      drugsSection = '<div class="section"><h4>Drogas IV</h4>';
      
      // Separar por tipo
      const analgoSedacion = control.drugs.filter(drug => drug.type === 'AnalgoSedacion');
      const titulables = control.drugs.filter(drug => drug.type === 'Titulables');
      
      if (analgoSedacion.length > 0) {
        drugsSection += '<div class="subsection"><h5>AnalgoSedación</h5><div class="vital-signs">';
        analgoSedacion.forEach(drug => {
          drugsSection += `<div class="vital-sign">${drug.name}: ${drug.value} ${drug.unit}</div>`;
        });
        drugsSection += '</div></div>';
      }
      
      if (titulables.length > 0) {
        drugsSection += '<div class="subsection"><h5>Titulables</h5><div class="vital-signs">';
        titulables.forEach(drug => {
          drugsSection += `<div class="vital-sign">${drug.name}: ${drug.value} ${drug.unit}</div>`;
        });
        drugsSection += '</div></div>';
      }
      
      drugsSection += '</div>';
    }
    
    controlEntry.innerHTML = `
      <h3>Control: ${formattedDate}</h3>
      <p>Paciente: ${control.patientName} (Cama ${control.bedNumber})</p>
      <div class="vital-signs">
        ${vitalSigns}
      </div>
      ${glucemiaSection}
      ${inOutSection}
      ${drugsSection}
      ${control.observations ? `<div class="observations">Observaciones: ${control.observations}</div>` : ''}
    `;
    
    userControls.appendChild(controlEntry);
  });
  
  userControlsContainer.style.display = 'block';
  
  // Mostrar mensaje informativo
  showMessage(controlMessage, 'Revisando sus registros confirmados antes de cerrar sesión...', 'warning');
}

// Funciones para manejar las entradas de drogas
function setupDrugEntries() {
  document.querySelectorAll('.add-drug').forEach(button => {
    button.addEventListener('click', addDrugEntry);
  });
  
  // Configurar botones de eliminación existentes
  document.querySelectorAll('.remove-drug').forEach(button => {
    button.addEventListener('click', removeDrugEntry);
  });
}

function addDrugEntry(event) {
  const button = event.target;
  const container = button.closest('.drugs-container');
  const drugEntry = button.closest('.drug-entry');
  
  // Cambiar el botón + por -
  button.textContent = '-';
  button.classList.remove('add-drug');
  button.classList.add('remove-drug');
  button.removeEventListener('click', addDrugEntry);
  button.addEventListener('click', removeDrugEntry);
  
  // Crear nueva entrada
  const newEntry = document.createElement('div');
  newEntry.className = 'drug-entry';
  
  // Copiar el contenido del select
  const selectContent = drugEntry.querySelector('select').innerHTML;
  
  newEntry.innerHTML = `
    <select class="drug-name" aria-label="Nombre de la droga">${selectContent}</select>
    <input type="text" class="drug-name-other" placeholder="Especificar otro" style="display: none;">
    <input type="number" class="drug-value" placeholder="Valor (ml)" min="0" step="0.01" aria-label="Valor de la droga">
    <button type="button" class="btn-icon add-drug">+</button>
  `;
  
  container.appendChild(newEntry);
  
  // Configurar el nuevo botón de agregar
  newEntry.querySelector('.add-drug').addEventListener('click', addDrugEntry);
  
  // Configurar el campo "otro"
  setupOtherDrugField(newEntry);
}

function removeDrugEntry(event) {
  const button = event.target;
  const entry = button.closest('.drug-entry');
  entry.remove();
}

function setupOtherDrugFields() {
  document.querySelectorAll('.drug-entry').forEach(entry => {
    setupOtherDrugField(entry);
  });
}

function setupOtherDrugField(entry) {
  const select = entry.querySelector('.drug-name');
  const otherField = entry.querySelector('.drug-name-other');
  
  select.addEventListener('change', function() {
    if (this.value === 'Otro') {
      otherField.style.display = 'block';
      otherField.required = true;
    } else {
      otherField.style.display = 'none';
      otherField.required = false;
    }
  });
}

// Funciones de navegación
function showLoginScreen() {
  loginScreen.style.display = 'block';
  bedSelectionScreen.style.display = 'none';
  nursingControlScreen.style.display = 'none';
  recentControlsContainer.style.display = 'none';
  userControlsContainer.style.display = 'none';
  if (pendingControlsContainer) {
    pendingControlsContainer.style.display = 'none';
  }
}

function showBedSelectionScreen() {
  loginScreen.style.display = 'none';
  bedSelectionScreen.style.display = 'block';
  nursingControlScreen.style.display = 'none';
  recentControlsContainer.style.display = 'none';
  userControlsContainer.style.display = 'none';
  if (pendingControlsContainer) {
    pendingControlsContainer.style.display = 'none';
  }
}

function showNursingControlScreen() {
  loginScreen.style.display = 'none';
  bedSelectionScreen.style.display = 'none';
  nursingControlScreen.style.display = 'block';
  // recentControlsContainer se maneja por separado
  userControlsContainer.style.display = 'none';
}

// Funciones de utilidad
function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
  
  // Hacer scroll al mensaje
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}