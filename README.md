# Aplicación de Controles de Enfermería

Esta aplicación permite a los enfermeros registrar controles de pacientes y guardarlos directamente en una hoja de cálculo de Google Sheets.

## Características

- Sistema de login por código de usuario
- Selección de cama/paciente desde una lista
- Registro de parámetros de enfermería (presión arterial, frecuencia cardíaca, temperatura)
- Visualización de registros recientes por paciente
- Diseño responsivo

## Estructura de la Aplicación

La aplicación consta de tres pantallas principales:
1. **Login**: Verificación del código de usuario
2. **Selección de Cama/Paciente**: Elección del paciente a controlar
3. **Registro de Controles**: Ingreso de parámetros de enfermería

## Estructura del Directorio

```
/
├── index.js             # Servidor principal
├── package.json         # Dependencias y scripts
├── .env                 # Variables de entorno (no incluido en el repositorio)
├── .env.example         # Ejemplo de variables de entorno
├── README.md            # Documentación
└── public/              # Archivos estáticos
    ├── index.html       # Página principal
    ├── styles.css       # Estilos CSS
    └── script.js        # JavaScript del cliente
```

## Instrucciones de Configuración

### 1. Configuración de la API de Google Sheets

1. Vaya a la [Consola de Google Cloud](https://console.cloud.google.com/)
2. Cree un nuevo proyecto
3. Habilite la API de Google Sheets
4. Cree una cuenta de servicio y descargue el archivo de clave JSON
5. Cree una hoja de cálculo de Google Sheets y compártala con el correo electrónico de la cuenta de servicio (con permisos de Editor)
6. Anote el ID de la hoja de cálculo (de la URL: `https://docs.google.com/spreadsheets/d/ID_DE_LA_HOJA_DE_CALCULO/edit`)

### 2. Configurar las Hojas de Cálculo

Cree las siguientes hojas en su documento de Google Sheets:

1. **Usuarios** (Usuarios!A:C):
   - A: Código de Usuario
   - B: Nombre
   - C: Rol

2. **Pacientes** (Pacientes!A:C):
   - A: ID
   - B: Número de Cama
   - C: Nombre del Paciente

3. **Controles** (Controles!A:J):
   - A: ID del Paciente
   - B: Nombre del Paciente
   - C: ID del Usuario
   - D: Nombre del Enfermero
   - E: Fecha y Hora del Control
   - F: Presión Arterial Sistólica
   - G: Presión Arterial Diastólica
   - H: Frecuencia Cardíaca
   - I: Temperatura
   - J: Observaciones
   - K: Fecha y Hora de Registro

### 3. Configurar Variables de Entorno

Copie el archivo `.env.example` a `.env` y actualice con sus credenciales:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=su-cuenta-de-servicio-email@su-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSu clave privada aquí\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=id-de-su-hoja-de-calculo
PORT=3000
```

### 4. Instalar Dependencias y Ejecutar

```bash
npm install
npm start
```

La aplicación estará disponible en http://localhost:3000

## Uso

1. Ingrese su código de usuario para iniciar sesión
2. Seleccione la cama/paciente de la lista desplegable
3. Registre los parámetros de enfermería (presión arterial, frecuencia cardíaca, temperatura)
4. Guarde el registro
5. Visualice los registros recientes del paciente seleccionado