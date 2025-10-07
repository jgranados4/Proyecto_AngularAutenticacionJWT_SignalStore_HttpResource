# 🛡️ Proyecto Angular 20 – Autenticación JWT, SignalStore y HttpResource

Aplicación web moderna desarrollada con **Angular 20**, que implementa un sistema completo de **autenticación con JWT**, **gestión de estado con Signals**, y una arquitectura HTTP optimizada con la nueva API **HttpResource**.
El proyecto utiliza **Bun** como gestor de dependencias, mejorando la velocidad de instalación y ejecución.

---

## 🚀 Tecnologías Principales

- **Angular 20** → Framework moderno con soporte para `signals` y `httpResource`.
- **Bun** → Gestor de paquetes ultrarrápido (reemplazo de npm).
- **HttpResource / HttpClient** → Nuevo modelo reactivo de peticiones HTTP.
- **SignalStore + Signals** → Estado global reactivo sin NgRx.
- **JWT + Refresh Token** → Autenticación segura y renovación automática.
- **Bulma** → Estilos limpios, ligeros y responsive.
- **Toastr + FontAwesome** → Notificaciones e iconografía modernas.
- **Ngx-cookie-service** → Manejo de cookies seguras para tokens.

---

## ⚙️ Dependencias Clave

```json
"@angular/core": "^20.0.0",
"@angular/common": "^20.0.0",
"bulma": "^1.0.0",
"jwt-decode": "^4.0.0",
"ngx-cookie-service": "^17.0.0",
"ngx-toastr": "^20.0.0"
```

---

## 📦 Instalación y Ejecución

```bash
# Instalar dependencias
bun install

# Servidor de desarrollo
bun run start

# Compilar para producción
bun run build
```

---

## 🌐 Implementación de HttpResource (Angular 20)

Se incorporó el nuevo sistema **`HttpResource`** introducido en **Angular 20**, modernizando la capa de comunicación con la API.

**Principales mejoras aplicadas:**

- Uso de **`httpResource`** para solicitudes **GET** reactivas y declarativas.
- Definición de recursos HTTP completamente **tipados y configurables**.
- Integración fluida con el sistema de **Signals** para manejo automático de estado.
- Reutilización y normalización de configuración (headers, params, URL) dentro de un **servicio genérico**.
- Mantenimiento de `HttpClient` para mutaciones (`POST`, `PUT`, `PATCH`, `DELETE`).

Este nuevo enfoque elimina gran parte del código repetitivo y hace que las peticiones sean más predecibles, seguras y eficientes.

---

## 🔐 Autenticación JWT + Refresh Token

El sistema de autenticación implementa:

- **Login y registro** con generación de tokens de acceso y refresco.
- **Renovación automática** del token antes de su expiración.
- **Intercepción de peticiones HTTP** para incluir el token activo en cada solicitud.
- **Almacenamiento seguro** de tokens mediante cookies cifradas.

Con esto se garantiza una sesión estable, protegida y completamente automatizada.

---

## ⚡ Gestión de Estado con SignalStore

El proyecto utiliza **SignalStore** con **Signals puros** para manejar el estado global, eliminando la necesidad de NgRx o Subjects.

**Ventajas:**

- Estado completamente reactivo y sincronizado.
- Menor complejidad y dependencias.
- Actualizaciones instantáneas en la interfaz.
- Código más limpio y mantenible.

---

## 🖥️ Interfaz


![alt text](image.png)
---

## 🧠 Características Clave

- 🔐 Autenticación segura con JWT y Refresh Token
- ⚡ Gestión global del estado con SignalStore
- 🌐 Peticiones HTTP reactivas con HttpResource
- 💾 Cookies seguras con ngx-cookie-service
- 🎨 UI moderna y responsive con Bulma
- ⚙️ Estructura optimizada para Angular 20 y Bun

---

**Desarrollado con ❤️ usando Angular 20, HttpResource y Bun.**
