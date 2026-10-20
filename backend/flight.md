# OAG Flight Info Alerts API v1 — Informe Técnico Completo

## Resumen

La OAG Flight Info Alerts API permite recibir en tiempo real cambios en vuelos (schedules y status) sin hacer polling. Los eventos se entregan vía **Azure Event Hub** (push) — OAG empuja los eventos automáticamente, tú solo tienes un listener corriendo. Se usa **una sola cuenta (profile)** por subscription key, y se crean múltiples alertas bajo esa cuenta.

**Lo único que haces activamente con la API es crear y borrar alertas.** Todo lo demás (recibir eventos) es pasivo vía Event Hub.

---

## Autenticación

Todas las llamadas requieren el header:

```
Subscription-Key: <tu_key_de_OAG>
```

En algunos endpoints el `accountId` va como parámetro en la URL (template) o en el body del request.

---

## Flujo General

```
1. Complete Profile (una sola vez, ya hecho)
        → Tienes accountId + connection strings del Event Hub en .env

2. Usuario quiere monitorear un vuelo
        → POST /alerts a OAG → recibes alertId
        → Guardas alertId + número WhatsApp en tu DB

3. OAG detecta cambio en ese vuelo
        → OAG empuja evento al Event Hub automáticamente
        → Tu listener lo recibe, busca el alertId en tu DB,
          encuentra el número WhatsApp y manda el mensaje

4. Vuelo aterrizó o usuario cancela
        → DELETE /alerts/{alertId} en OAG
        → Borras el registro de tu DB
```

**No necesitas consultar OAG para saber si hubo cambios. Los eventos llegan solos.**

---

## Endpoints

Base URL: `https://api.oag.com/flight-info-alerts`
Versión requerida en todos los requests: `?version=v1`

---

## 1. Complete Profile

**Descripción:** Crea el perfil del cliente. Se llama **una sola vez**. Crea el Event Hub dedicado y retorna el `accountId` y las connection strings.

```
POST https://api.oag.com/flight-info-alerts/profile?version=v1
```

**Headers:**
```
Subscription-Key: <tu_key>
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@empresa.com",
  "secondaryEmail": "backup@empresa.com",
  "country": "CO",
  "companyName": "Mi Empresa",
  "content": "seats"
}
```

**Campos obligatorios:** `firstName`, `lastName`, `email`, `country`, `companyName`
**Campos opcionales:** `secondaryEmail`, `content` (para recibir datos de asientos)

**Respuesta 201:**
```json
{
  "accountId": "ce29194a-8218-486b-a3b7-ade791d57423",
  "evtPrimaryConnectionString": "Endpoint=sb://...;SharedAccessKey=...;EntityPath=...",
  "evtSecondaryConnectionString": "Endpoint=sb://...;SharedAccessKey=...;EntityPath=..."
}
```

**⚠️ Importante:** Guardar `accountId` y las connection strings en base de datos o variables de entorno. Son permanentes y se usan en todos los pasos siguientes.

**Errores comunes:**
- `409 Conflict` → Ya existe un perfil para esta subscription key. No crear de nuevo.
- `400 Bad Request` → Falta un campo obligatorio.

---

## 2. Get Account Profile

**Descripción:** Consulta los datos del perfil existente.

```
GET https://api.oag.com/flight-info-alerts/profile/{accountId}?version=v1
```

**Headers:**
```
Subscription-Key: <tu_key>
```

**Respuesta 200:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@empresa.com",
  "country": "CO",
  "companyName": "Mi Empresa",
  "content": "seats"
}
```

---

## 3. Get Access Key

**Descripción:** Obtiene las connection strings del Event Hub para un account. Útil si se pierden las originales.

```
GET https://api.oag.com/flight-info-alerts/accounts/{accountId}/accessKey?version=v1
```

**Headers:**
```
Subscription-Key: <tu_key>
```

**Respuesta 200:**
```json
{
  "accountId": "ce29194a-8218-486b-a3b7-ade791d57423",
  "evtPrimaryConnectionString": "Endpoint=sb://...",
  "evtSecondaryConnectionString": "Endpoint=sb://..."
}
```

---

## 4. Update Profile

**Descripción:** Actualiza los datos del perfil.

```
PUT https://api.oag.com/flight-info-alerts/profile/{accountId}?version=v1
```

**Body:** Mismo esquema que Complete Profile.

---

## 5. Create Alert

**Descripción:** Crea una alerta. Cada alerta = un filtro de vuelos que se quiere monitorear. OAG comienza a enviar eventos al Event Hub apenas se crea.

```
POST https://api.oag.com/flight-info-alerts/alerts?version=v1
```

**Headers:**
```
Subscription-Key: <tu_key>
Content-Type: application/json
```

### Tipos de alerta (`alertType`) — OBLIGATORIO

| Valor | Descripción | Campos adicionales requeridos |
|-------|-------------|-------------------------------|
| `Global` | Todos los cambios de OAG | Ninguno |
| `Carrier` | Por aerolínea | `iataCarrierCode` y/o `icaoCarrierCode` |
| `Port` | Por aeropuerto | `departureAirport` y/o `arrivalAirport` |

**⚠️ Nota:** No existe un `alertType` por número de vuelo específico. Para monitorear un vuelo concreto se combina `Carrier` + `flightNumber` + `departureDate`.

### Body mínimo (ejemplo: vuelo específico)

```json
{
  "accountId": "ce29194a-8218-486b-a3b7-ade791d57423",
  "name": "Vuelo AV234 BOG-MIA 2026-06-01",
  "alertType": "Carrier",
  "iataCarrierCode": "AV",
  "flightNumber": 234,
  "departureAirport": "BOG",
  "arrivalAirport": "MIA",
  "departureDate": "2026-06-01",
  "schedules": true,
  "status": true
}
```

### Body completo con todos los parámetros

```json
{
  "accountId": "ce29194a-8218-486b-a3b7-ade791d57423",
  "name": "Nombre descriptivo",
  "description": "Descripción opcional",
  "alertType": "Carrier",
  "iataCarrierCode": "AV",
  "icaoCarrierCode": "AVA",
  "flightNumber": 234,
  "fromFlight": 100,
  "toFlight": 999,
  "departureAirport": "BOG",
  "arrivalAirport": "MIA",
  "departureDate": "2026-06-01",
  "arrivalDate": "2026-06-01",
  "content": "seats, changeindicator",
  "schedules": true,
  "status": true,
  "gaFlights": false,
  "unscheduledFlights": false,
  "codeshare": true,
  "estimatedArrivalTimeThreshold": 10,
  "estimatedDepartureTimeThreshold": -10,
  "statusChangeFilters": {
    "baggage": true,
    "aircraftRegistrationNumber": true,
    "gates": true,
    "terminal": true,
    "seats": true,
    "aircraftType": true
  }
}
```

### Parámetros clave explicados

| Campo | Descripción |
|-------|-------------|
| `flightNumber` | Número de vuelo exacto (ej: 234) |
| `fromFlight` / `toFlight` | Rango de números de vuelo |
| `estimatedArrivalTimeThreshold` | Minutos ±1440. Positivo = llega después del ETA. Negativo = llega antes del ETA |
| `estimatedDepartureTimeThreshold` | Igual pero para salida |
| `schedules` | Incluir cambios de horario programado |
| `status` | Incluir cambios de status operacional (gates, delays, etc.) |
| `codeshare` | Incluir vuelos de marketing (código compartido) |
| `content: "seats, changeindicator"` | Incluir datos de asientos y change indicators |
| `statusChangeFilters` | Si alguno es `false`, ignora eventos donde SOLO cambió ese campo |

**Respuesta 201:**
```json
{
  "alertId": "abc123-...",
  "accountId": "ce29194a-...",
  "alertType": "Carrier",
  "name": "Vuelo AV234",
  "active": true,
  "createdTimestamp": "2026-05-27T10:00:00",
  "lastUpdatedTimestamp": "2026-05-27T10:00:00",
  ...
}
```

**⚠️ Guardar el `alertId`** — se necesita para identificar qué alerta generó cada evento en el Event Hub, y para hacer update/delete.

---

## 6. Get Alerts (listar todas)

```
GET https://api.oag.com/flight-info-alerts/alerts?version=v1
```

**Headers:**
```
Subscription-Key: <tu_key>
accountId: ce29194a-8218-486b-a3b7-ade791d57423
```

**Nota:** El `accountId` va en el **header**, no en la URL ni en el body.

**Respuesta 200:** Array con todas las alertas del account.

---

## 7. Get Alert (una específica)

```
GET https://api.oag.com/flight-info-alerts/alerts/{alertId}?version=v1
```

**Headers:**
```
Subscription-Key: <tu_key>
```

---

## 8. Update Alert

```
PUT https://api.oag.com/flight-info-alerts/alerts/{alertId}?version=v1
```

**Body:** Mismo esquema que Create Alert. Reemplaza los valores existentes.

---

## 9. Delete Alert

```
DELETE https://api.oag.com/flight-info-alerts/alerts/{alertId}?version=v1
```

**Respuesta:** `deleted: true` en el objeto de la alerta. La eliminación puede no ser inmediata.

---

## 10. Status (health check)

```
GET https://api.oag.com/flight-info-alerts/status?version=v1
```

No requiere autenticación. Retorna el estado del servicio.

---

## Event Hub — Recibir Eventos

Los eventos no se consultan por API. Llegan automáticamente al Azure Event Hub configurado en el perfil.

### Connection string

Del `evtPrimaryConnectionString` se extrae:
- **Namespace:** `sb://nsclienteu4c948320f.servicebus.windows.net/`
- **Event Hub Name:** valor de `EntityPath` (ej: `pp3ab123456e`)
- **Shared Access Key:** para autenticarse al leer

### Estructura de un evento recibido

Los eventos incluyen el `alertId` que los generó, datos del vuelo (aerolínea, número, aeropuerto, fechas, status, gates, etc.) y el tipo de cambio.

### Retención

Los eventos se retienen **7 días** en el Event Hub antes de eliminarse.

### Librerías recomendadas

- **Node.js:** `@azure/event-hubs`
- **Python:** `azure-eventhub`
- **Java:** `azure-messaging-eventhubs`

### Ejemplo básico Node.js

```javascript
const { EventHubConsumerClient } = require("@azure/event-hubs");

const connectionString = "Endpoint=sb://...;SharedAccessKey=...;EntityPath=...";
const eventHubName = "pp3ab123456e"; // EntityPath de la connection string

const client = new EventHubConsumerClient("$Default", connectionString, eventHubName);

const subscription = client.subscribe({
  processEvents: async (events, context) => {
    for (const event of events) {
      console.log("Evento recibido:", JSON.stringify(event.body));
      // event.body contiene alertId + datos del vuelo
    }
  },
  processError: async (err, context) => {
    console.error("Error:", err);
  }
});
```

---

## Arquitectura del Sistema

```
Variables de entorno (.env)
├── OAG_SUBSCRIPTION_KEY     → tu key de OAG
├── OAG_ACCOUNT_ID           → el accountId del profile (fijo, no cambia)
└── OAG_EVENT_HUB_CONNECTION_STRING  → evtPrimaryConnectionString del profile
```

### Tabla en base de datos: `flight_alerts`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | ID interno |
| `oag_alert_id` | string | alertId que retorna OAG al crear la alerta. Clave para buscar en el Event Hub |
| `phone_number` | string | Número WhatsApp al que notificar (ej: +573001234567) |
| `carrier` | string | Código IATA de la aerolínea (ej: AV) |
| `flight_number` | integer | Número de vuelo (ej: 234) |
| `departure_airport` | string | IATA aeropuerto salida (ej: BOG) |
| `arrival_airport` | string | IATA aeropuerto llegada (ej: MIA) |
| `departure_date` | date | Fecha del vuelo |
| `notified` | boolean | false = pendiente, true = WhatsApp ya enviado |
| `notified_at` | timestamp | Cuándo se mandó el mensaje |
| `created_at` | timestamp | Cuándo se creó la alerta |

### Flujo del Event Hub listener

```
Evento llega del Event Hub
        │
        ├─ event.body.alertId = "abc-123"
        │
        ▼
SELECT * FROM flight_alerts WHERE oag_alert_id = 'abc-123'
        │
        ├─ phone_number = "+573001234567"
        ├─ notified = false
        │
        ▼
Mandar WhatsApp → UPDATE notified = true, notified_at = NOW()
```

### Servicios necesarios

- **AlertService** → `POST /alerts` al crear, `DELETE /alerts/{alertId}` al cancelar
- **EventHubListener** → proceso corriendo 24/7 escuchando el Event Hub

---

## Casos de Uso Típicos

### Monitorear un vuelo específico de un usuario
```json
{
  "accountId": "...",
  "alertType": "Carrier",
  "iataCarrierCode": "AV",
  "flightNumber": 234,
  "departureDate": "2026-06-01",
  "schedules": true,
  "status": true
}
```

### Monitorear toda una aerolínea
```json
{
  "accountId": "...",
  "alertType": "Carrier",
  "iataCarrierCode": "AV",
  "schedules": true,
  "status": true
}
```

### Monitorear todo lo que sale/llega a un aeropuerto
```json
{
  "accountId": "...",
  "alertType": "Port",
  "departureAirport": "BOG",
  "schedules": true,
  "status": true
}
```

### Global (todo OAG — usar con cuidado, volumen alto)
```json
{
  "accountId": "...",
  "alertType": "Global"
}
```

---

## Restricciones y Advertencias

- **Una sola alerta Global activa a la vez.** Si existe una Global, no se pueden crear otras. Hay que borrarla primero.
- **No existe alertType por vuelo individual.** Se simula con `Carrier` + `flightNumber` + `departureDate`.
- **El perfil se crea una sola vez.** Si se intenta crear de nuevo, responde `409 Conflict`.
- **`changeIndicator` está deprecado.** Usar `content: "seats, changeindicator"` en su lugar.
- **CORS no está habilitado.** Las llamadas deben hacerse server-side, nunca desde el frontend directamente.
- **Los eventos duran 7 días** en el Event Hub. Procesar y persistir los relevantes.

---

## Referencia Rápida de Endpoints

| Operación | Método | URL |
|-----------|--------|-----|
| Crear perfil | POST | `/flight-info-alerts/profile` |
| Ver perfil | GET | `/flight-info-alerts/profile/{accountId}` |
| Actualizar perfil | PUT | `/flight-info-alerts/profile/{accountId}` |
| Obtener access key | GET | `/flight-info-alerts/accounts/{accountId}/accessKey` |
| Crear alerta | POST | `/flight-info-alerts/alerts` |
| Listar alertas | GET | `/flight-info-alerts/alerts` (header: accountId) |
| Ver alerta | GET | `/flight-info-alerts/alerts/{alertId}` |
| Actualizar alerta | PUT | `/flight-info-alerts/alerts/{alertId}` |
| Eliminar alerta | DELETE | `/flight-info-alerts/alerts/{alertId}` |
| Health check | GET | `/flight-info-alerts/status` |

Todos los endpoints: `+ ?version=v1` y header `Subscription-Key: <tu_key>`