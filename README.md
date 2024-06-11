# Proyecto Angular
## Descripción

Este proyecto es una aplicación de Front End desarrollada utilizando Angular como framework principal. Se centra en la creación de un sistema de autenticación que incluye funcionalidades de login y registro, con la implementación de tokens JWT para la seguridad. Además, se emplea un formulario reactivo para la entrada de datos, con validaciones integradas para garantizar la integridad de la información.

## Tecnologías Utilizadas

- **Angular Standalone**: Como framework principal para el desarrollo del Front End, proporcionando una estructura robusta y modular para la aplicación.
- **Formulario Reactivo**: Se implementa un formulario reactivo para capturar y validar los datos de usuario de manera eficiente.
- **Validación de Formularios**: Se realizan validaciones tanto en el Front End como en el Back End para garantizar la precisión de los datos ingresados por el usuario.
- **Framework CSS Bulma**: Se utiliza Bulma como framework CSS para el diseño y estilización de la interfaz de usuario, ofreciendo una apariencia moderna y responsive.
- **Dependencias Utilizadas**:
  - `ag-grid-angular`: Para la visualización y manipulación de datos en forma de tablas, proporcionando una interfaz dinámica y flexible.
  - `jwt-decode`: Para decodificar tokens JWT y obtener información de usuario en el cliente de forma segura.
  - `ngx-cookie-service`: Para la manipulación de cookies en Angular, utilizado en la gestión de sesiones y almacenamiento de tokens JWT.

## Funcionalidades Principales
- **Login y Registro**: La aplicación permite a los usuarios autenticarse mediante un proceso de inicio de sesión seguro. Además, ofrece la posibilidad de registrarse como nuevos usuarios.
- **Tokens JWT**: Se emplean tokens JWT para la autenticación de usuarios, proporcionando un mecanismo seguro para el intercambio de información entre el cliente y el servidor.
- **Validación de Formularios**: Se realizan validaciones en los formularios de login y registro para garantizar la integridad de los datos ingresados por el usuario.
- **Interceptores y Guards**: Se implementan interceptores para agregar tokens JWT a las solicitudes HTTP y guards para proteger rutas y asegurar que solo los usuarios autenticados tengan acceso a ciertas partes de la aplicación.
- **Tablas Dinámicas**: Se incluyen dos formas de visualización de datos en forma de tabla, una utilizando la tabla estándar de Angular y otra utilizando la biblioteca `ag-grid-angular`, que ofrece funcionalidades avanzadas de manipulación y filtrado de datos.
---
