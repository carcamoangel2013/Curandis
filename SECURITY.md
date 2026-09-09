# Seguridad del repositorio de Curandis en GitHub

Esto protege lo que sí se puede proteger de verdad: el código fuente completo
(historial incluido), las credenciales, y quién puede modificar el proyecto.
Nada de esto evita ver el HTML/CSS/JS ya cargado en el navegador — eso es
inevitable en cualquier sitio web y no depende de GitHub.

## 1. Repositorio: público mientras sea solo una demo con datos ficticios
Este proyecto usa GitHub Pages (gratuito) como hosting, lo cual exige que el
repositorio sea público para publicarse sin costo. Esto es aceptable
**solo** porque hoy el sitio no contiene ningún dato real de ninguna
familia ni profesional — únicamente cuentas y solicitudes de ejemplo.
En cuanto exista un backend real con datos de personas reales, el código
que maneje esos datos debe pasar a un repositorio privado (o a un plan de
GitHub que permita Pages privado).

### Qué significa que el repositorio sea público
Si el repositorio es público, cualquier persona puede leer, descargar y
clonar `index.html`, `app.js`, `styles.css` y el resto del código. Esto no se
puede evitar con JavaScript, CSP, `.gitignore` ni con la disuasión de F12:
una página web necesita entregar su HTML, CSS y JavaScript al navegador.
`.gitignore` solo evita agregar archivos no rastreados; no oculta archivos
que ya están en Git ni elimina su historial.

Si no quieres que el código sea visible, cambia el repositorio a **Private**
en Settings → General → Danger Zone → Change repository visibility. Para
seguir usando GitHub Pages con un repositorio privado puede ser necesario un
plan de GitHub compatible. Aunque el repositorio sea privado, la web publicada
seguirá siendo pública si la aplicación está disponible en Internet.

## 2. Nunca subir secretos
- Ninguna contraseña real, clave de API, ni credencial va en el código.
- Cuando exista backend, usa un archivo `.env` (ya está en `.gitignore`).
- Si alguna vez subes una clave real por error, cámbiala de inmediato
  (borrarla del código no la borra del historial de Git).

## 3. Secret scanning + push protection
Settings → Code security and analysis → activar:
- **Secret scanning** (avisa si detecta una clave filtrada)
- **Push protection** (bloquea el push si detecta una clave antes de subirla)
Disponible gratis incluso en repositorios públicos.

## 4. Dependabot
Settings → Code security and analysis → activar:
- **Dependabot alerts**
- **Dependabot security updates**
Hoy el proyecto no tiene dependencias de Node.js, pero conviene activarlo
desde ya para cuando se agregue un backend.

## 5. Protección de la rama principal (main)
Settings → Branches → Add branch protection rule → rama `main`:
- Exigir Pull Request antes de fusionar (nadie sube directo a main).
- Exigir al menos 1 revisión aprobada antes de fusionar.
Así ningún cambio a `app.js` (login, registro, datos) se publica sin que
otra persona del equipo lo revise.

## 6. Autenticación de dos factores (2FA) en tu cuenta de GitHub
Settings de tu cuenta (no del repo) → Password and authentication →
Two-factor authentication → activar.

## 7. Quién tiene acceso de escritura
Settings → Collaborators and teams → revisar periódicamente que solo las
personas del equipo activo tengan acceso.

## 8. Publicar con GitHub Pages (el "dominio" gratuito)
Settings → Pages → Branch: main → carpeta raíz (donde está index.html) →
Save. GitHub entrega una dirección del tipo
`https://usuario.github.io/nombre-del-repo/` con HTTPS automático e
incluido, sin comprar dominio ni certificado.

## Nota sobre los documentos subidos en el registro (registro.html)
El formulario de registro de enfermero pide fotos del título profesional y
de antecedentes penales. Hoy esas imágenes se guardan en el propio
navegador (localStorage), no en GitHub ni en ningún servidor — pero por
seguridad, **nunca subas al repositorio ni pruebes el formulario con
documentos reales de una persona real** mientras esto siga siendo un
prototipo sin backend.

Importante: que los documentos no se suban a GitHub no significa que estén
protegidos. Cualquier script de la misma página, extensión del navegador o
persona con acceso al perfil del navegador puede leer `localStorage`. Para
documentos reales se necesita un backend con autenticación, autorización,
cifrado en tránsito y almacenamiento privado; no deben guardarse como base64
en el navegador.
