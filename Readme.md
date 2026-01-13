# 📱💻 Proyecto Universal (Web & Móvil) - Proyecto01-DS

Este proyecto utiliza **React Native** con **Expo** y **Expo Router**. Así, el mismo funciona tanto en navegadores web como en dispositivos iOS y Android desde una misma base de código en **TypeScript**.

## 🚀 Inicio Rápido

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/NathaliaAlf/Proyecto01-DS.git
   cd Proyecto01-DS/Dev-Web-Mob
   ```

2. **Trabajar en la rama de development**
   ```bash
   git checkout development
   ```

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Ejecutar el proyecto:**
    - **Para Web:** `npx expo start --web`
    - **Para Móvil (Expo Go):** `npx expo start`

---

## 📂 Estructura del Proyecto y Guía de Carpetas

### 1. `app/` (El corazón del proyecto - Ruteo)
*   **`(tabs)/`**: Contiene las pantallas que tienen la barra de navegación inferior.
    *   `index.tsx`: Es la pantalla de inicio (Home).
    *   `two.tsx`: Segunda pantalla de ejemplo.
    *   `_layout.tsx`: Define cómo se ven las pestañas (iconos, colores).
*   **`_layout.tsx` (Raíz)**: Es el diseño global de la aplicación. Aquí se configuran los temas y proveedores de datos.
*   **`modal.tsx`**: Una pantalla de ejemplo que se abre como un modal sobre las demás.
*   **`+html.tsx`**: Configuración específica del HTML para la versión Web (SEO, meta tags).

### 2. `components/` (Componentes reutilizables)
*   Los archivos `.web.ts` indican lógica que **solo** se ejecutará en el navegador.

### 3. `constants/` (Configuraciones)
*   **`Colors.ts`**: Aquí definimos la paleta de colores para modo claro y oscuro. **Usa siempre este archivo** en lugar de escribir colores a mano para mantener la consistencia.

### 4. `assets/` (Recursos estáticos)
*   **`fonts/`**: Tipografías personalizadas.
*   **`images/`**: Logos, iconos y fotos locales.

---

## 🛠️ Reglas de Oro para Trabajar

1.  **TypeScript:** Es obligatorio tipar las propiedades de los componentes y las respuestas de APIs. No uses `any`.
2.  **Componentes de React Native:** Siempre usa componentes de `react-native` (como `View`, `Text`, `Pressable`) en lugar de etiquetas HTML (`div`, `p`, `button`). Esto garantiza que el código funcione en Android e iOS.
3.  **Estilos:** Usamos el sistema de estilos nativo o librerías compatibles. Evita usar CSS puro a menos que sea estrictamente necesario en archivos `.web.tsx`.
4.  **Nuevas Rutas:** Si quieres crear una pantalla nueva, simplemente crea un archivo `.tsx` dentro de `app/` y Expo creará la ruta automáticamente.

---

## 🌳 Estrategia de Ramas (Git Workflow)

Para este proyecto utilizaremos un flujo de trabajo de tres niveles para asegurar la estabilidad del código:

### 1. Las Ramas Principales
*   **`production` (rama `main`)**: Es el código que ya funciona perfectamente. Nadie sube código aquí directamente. Solo se recibe código de *Staging*.
*   **`staging`**: Es la rama de pre-producción. Aquí se hacen las pruebas finales y el control de calidad (QA). Solo recibe código de *Development*.
*   **`development`**: Es la rama principal de integración. Aquí se une el trabajo de todos los desarrolladores. Es la rama "viva" de donde salen las nuevas versiones.

### 2. ¿Cómo trabajar en una nueva tarea? (Flujo diario)

Cuando vayas a programar algo nuevo, **nunca** lo hagas directamente en `development`. Sigue estos pasos:

1.  **Crea una rama de tarea** desde `development`:
    ```bash
    git checkout development
    git pull origin development
    git checkout -b feature/nombre-de-tu-tarea
    ```
2.  **Trabaja y haz commits** en tu rama:
    ```bash
    git add .
    git commit -m "feat: descripción de lo que hiciste"
    ```
3.  **Sube tu rama y crea un Pull Request (PR)** hacia `development`:
    ```bash
    git push origin feature/nombre-de-tu-tarea
    ```
4.  Una vez aprobado el PR y fusionado en `development`, puedes borrar tu rama local.

### 3. El Ciclo de Lanzamiento
1.  Cuando tenemos suficientes cambios en `development` y el proyecto es estable, el encargado hará un merge de **Development → Staging**.
2.  Se prueba en **Staging**. Si hay errores, se corrigen en *development* y se vuelven a pasar a *staging*.
3.  Cuando todo está perfecto, se hace el merge final de **Staging → Production**.

---

## 🌐 Publicación Web en Hostinger 

Este proyecto puede publicarse como **aplicación web** usando Expo + React Native Web.

### Desde la raíz del proyecto:

```bash
npx expo export
````

Se generará la carpeta:

```
dist/
```

---

### Subir a Hostinger

1. Entra a **hPanel → Administrador de archivos → public_html**
2. Sube **todo el contenido de la carpeta `dist/`** dentro de `public_html`

Debe quedar así:

```
public_html/
 ├── index.html
 ├── assets/
 └── ...
```

---

### Acceso

La app estará disponible en:

```
https://powderblue-rhinoceros-189093.hostingersite.com/
```

