/* =========================================================================
   CURANDIS — app.js
   Lógica y datos compartidos por TODAS las páginas del sitio.
   Como ahora cada pantalla es un archivo .html real (no una sola SPA),
   el estado que antes vivía en variables de memoria (currentUser,
   familyPostings, mockUsers...) ahora se guarda en localStorage para que
   sobreviva al navegar entre páginas. Sigue siendo un prototipo sin backend:
   los datos viven solo en el navegador de quien lo usa.
   ========================================================================= */

/* =====================================================================
   DISUASIÓN DE INSPECCIÓN (NO ES SEGURIDAD REAL)
   Esto NO protege el código: cualquier persona con conocimientos básicos
   puede saltárselo. Solo pone una barrera ante el usuario casual/curioso.
   Al vivir en app.js, aplica automáticamente a las 13 páginas del sitio.
   La seguridad real de Curandis vive en el servidor (validación,
   autenticación, permisos), nunca en el navegador.
   ===================================================================== */
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  const blocked = k === 'F12' || (e.ctrlKey && e.shiftKey && (k==='I'||k==='J'||k==='C')) || (e.ctrlKey && k==='U');
  if(blocked) e.preventDefault();
});

/* Escapa texto antes de insertarlo como HTML. Se usa en cualquier lugar
   donde se pinte un dato escrito por la persona usuaria (nombre, motivo de
   la solicitud, descripción) para evitar XSS. Nunca quitar esto de los
   innerHTML que muestran texto libre. */
function esc(str){
  return String(str ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

/* ===================== MAPA DE PÁGINAS ===================== */
const PAGES = {
  home: 'index.html',
  login: 'login.html',
  registro: 'registro.html',
  pendiente: 'pendiente.html',
  'client-search': 'buscar.html',
  'client-requests': 'solicitudes.html',
  'client-messages': 'mensajes.html',
  'nurse-jobs': 'trabajos.html',
  'nurse-requests': 'solicitudes-enfermero.html',
  'nurse-chats': 'chats.html',
  'nurse-profile': 'perfil.html',
  'nosotros': 'nosotros.html',
};

/* ===================== ESTADO PERSISTENTE (localStorage) ===================== */
const LS_KEYS = {
  users: 'curandis_users',
  currentUser: 'curandis_current_user',
  postings: 'curandis_family_postings',
  terms: 'curandis_accepted_terms',
  appliedJobs: 'curandis_applied_jobs',
  registrationEmailStatus: 'curandis_registration_email_status',
};
const ADMIN_EMAIL = 'curandissv@gmail.com';

/* ⚠ Estas contraseñas de demo quedan visibles en texto plano en este
   archivo, y cualquier cuenta que se registre desde registro.html también
   se guarda con su contraseña sin cifrar dentro de localStorage. Esto es
   aceptable SOLO porque es un prototipo sin servidor y sin usuarios reales.
   Antes de manejar datos reales, esto DEBE moverse a un backend con hash
   de contraseñas (bcrypt/argon2) — ver el documento "Ciberseguridad
   aplicada", Fase 1. */
const DEFAULT_USERS = [
  {email:'familia@demo.com', password:'Demo1234!', role:'family', name:'Ana Gutiérrez', status:'approved'},
  {email:'pro@demo.com', password:'Demo1234!', role:'professional', name:'Karla Mejía', status:'approved', specialty:'Geriatría', zone:'Santa Tecla'},
  {email:'pendiente@demo.com', password:'Demo1234!', role:'professional', name:'Luis Pérez', status:'pending', specialty:'Enfermería General', zone:'Soyapango'},
];

const DEFAULT_POSTINGS = [];

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw === null) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function saveJSON(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* almacenamiento no disponible */ }
}

function getUsers(){ return loadJSON(LS_KEYS.users, DEFAULT_USERS); }
function saveUsers(users){ saveJSON(LS_KEYS.users, users); }
function getCurrentUser(){ return loadJSON(LS_KEYS.currentUser, null); }
function setCurrentUser(user){ saveJSON(LS_KEYS.currentUser, user); }
function clearCurrentUser(){ localStorage.removeItem(LS_KEYS.currentUser); }
function getPostings(){ return loadJSON(LS_KEYS.postings, DEFAULT_POSTINGS); }
function savePostings(p){ saveJSON(LS_KEYS.postings, p); }
function getAppliedJobs(){ return loadJSON(LS_KEYS.appliedJobs, []); }
function saveAppliedJobs(a){ saveJSON(LS_KEYS.appliedJobs, a); }

// Asegura que exista la semilla de usuarios demo la primera vez que se visita el sitio
if(loadJSON(LS_KEYS.users, null) === null){ saveUsers(DEFAULT_USERS); }

let currentUser = getCurrentUser();
let familyPostings = getPostings();

/* ===================== DATOS ESTÁTICOS DE DEMO (no cambian) ===================== */
const mockNurses = [
  {name:'María José Hernández de López', jvpe:'JVPE-001-2019', spec:'Pediatría', rating:4.9, reviews:47, years:6, rate:18, zone:'Colonia Escalón, San Salvador', dist:15, tuZona:true, disponible:true, desc:'Enfermera especializada en pediatría con 6 años de experiencia. Trabajé en el Hospital Nacional de Niños Benjamín Bloom.', servicios:6},
  {name:'Lucía Fernanda Morales Castillo', jvpe:'JVPE-134-2022', spec:'Oncología', rating:4.7, reviews:12, years:3, rate:19, zone:'Soyapango, San Salvador', dist:10, tuZona:true, disponible:false, desc:'Enfermera oncológica con formación en el manejo de pacientes con cáncer, quimioterapia domiciliaria y cuidados paliativos.', servicios:5},
  {name:'Roberto Carlos Méndez Herrera', jvpe:'JVPE-022-2017', spec:'Geriatría', rating:4.8, reviews:63, years:9, rate:20, zone:'Santa Ana Centro, Santa Ana', dist:20, tuZona:false, disponible:true, desc:'Enfermero geriátrico especializado en cuidados de adultos mayores con 9 años de experiencia en el occidente del país.', servicios:5},
  {name:'Carmen Lisseth Velásquez Portillo', jvpe:'JVPE-045-2020', spec:'Postoperatorio', rating:4.7, reviews:29, years:5, rate:17, zone:'Santa Tecla, La Libertad', dist:10, tuZona:false, disponible:true, desc:'Especialista en cuidados postoperatorios. Brindo atención en recuperación quirúrgica, control de heridas y manejo del dolor.', servicios:5},
  {name:'Jonathan Ruiz', jvpe:'JVPE-201-2015', spec:'Cuidados Intensivos', rating:5.0, reviews:82, years:11, rate:25, zone:'San Miguel Centro, San Miguel', dist:25, tuZona:false, disponible:true, desc:'Enfermero intensivista con 11 años de experiencia en UCI. Manejo avanzado de ventilación, monitoreo hemodinámico y emergencias.', servicios:5},
  {name:'Ana Beatriz Flores', jvpe:'JVPE-087-2021', spec:'Rehabilitación', rating:4.6, reviews:18, years:4, rate:15, zone:'Sonsonate Centro, Sonsonate', dist:15, tuZona:false, disponible:true, desc:'Enfermera rehabilitadora especializada en recuperación funcional de pacientes con ACV, fracturas y cirugías ortopédicas.', servicios:5},
  {name:'Carlos Eduardo Reyes Fuentes', jvpe:'JVPE-112-2018', spec:'Diabetes y Heridas', rating:4.8, reviews:41, years:7, rate:16, zone:'Usulután Centro, Usulután', dist:20, tuZona:false, disponible:true, desc:'Especialista en el manejo de heridas crónicas y pacientes diabéticos. Certificado en pie diabético y terapia de heridas.', servicios:5},
  {name:'Miguel Ángel Torres Guzmán', jvpe:'JVPE-156-2016', spec:'Salud Mental', rating:4.9, reviews:35, years:8, rate:18, zone:'Cojutepeque, Cuscatlán', dist:15, tuZona:false, disponible:true, desc:'Enfermero psiquiátrico con 8 años de experiencia en salud mental comunitaria. Manejo de crisis, acompañamiento terapéutico y más.', servicios:5},
];
const specialties = [...new Set(mockNurses.map(n=>n.spec))];

const mockJobs = [
  {patient:'Adulto mayor con dependencia severa', zone:'Santa Tecla', turno:'Nocturno · 12h', urgencia:'Prioritaria', tasks:'Curación de heridas complejas', pay:66},
  {patient:'Postoperatorio de cadera', zone:'San Salvador Centro', turno:'Diurno · 12h', urgencia:'Programada', tasks:'Acompañamiento y control de signos', pay:42},
  {patient:'Paciente crónico / diabetes tipo 2', zone:'Antiguo Cuscatlán', turno:'Por horas · 8am-12pm', urgencia:'Programada', tasks:'Administración de medicamentos', pay:17},
  {patient:'Hijo/a menor - apoyo pediátrico', zone:'Mejicanos', turno:'Diurno · 8h', urgencia:'Prioritaria', tasks:'Control de signos vitales e higiene', pay:32},
];

function initials(name){
  return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
}

/* ===================== MODAL LEGAL (solo aparece una vez) ===================== */
function initLegalModal(){
  const overlay = document.getElementById('modal-overlay');
  if(!overlay) return;
  const accepted = loadJSON(LS_KEYS.terms, false);
  if(accepted){ overlay.style.display = 'none'; return; }
  const acceptCheckbox = document.getElementById('accept-terms');
  const acceptBtn = document.getElementById('accept-btn');
  acceptCheckbox.addEventListener('change', () => acceptBtn.disabled = !acceptCheckbox.checked);
  acceptBtn.addEventListener('click', () => {
    saveJSON(LS_KEYS.terms, true);
    overlay.classList.add('hidden');
    setTimeout(() => overlay.style.display='none', 400);
  });
}

/* ===================== NAVEGACIÓN GENERAL ===================== */
function goTo(pageKey){ window.location.href = PAGES[pageKey]; }
function goToDashboard(){ goTo('home'); }
function scrollToTop(){ goTo('home'); }
function scrollToTopDash(){ window.scrollTo({top:0,behavior:'smooth'}); }
function scrollToId(id){
  if(window.location.pathname.endsWith(PAGES.home) || window.location.pathname === '/' || window.location.pathname.endsWith('/')){
    document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
  } else {
    window.location.href = PAGES.home + '#' + id;
  }
}
function scrollToHashOnLoad(){
  if(window.location.hash){
    const id = window.location.hash.slice(1);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({behavior:'smooth'}), 60);
  }
}

function enterFlow(role){
  if(currentUser && currentUser.role === role){ goToOwnDashboard(); return; }
  window.location.href = PAGES.registro + '?role=' + role;
}
function openAuth(){ goTo('login'); }

/* ===================== SIGN IN ===================== */
/* Freno básico contra fuerza bruta: bloquea el formulario 30s tras 5
   intentos fallidos seguidos. Vive en el navegador (se puede evadir
   recargando la página) — en producción esto debe reforzarse del lado
   del servidor. */
let loginAttempts = 0;
let loginLockedUntil = 0;
function doSignIn(){
  const err = document.getElementById('si-error');
  if(Date.now() < loginLockedUntil){
    const secs = Math.ceil((loginLockedUntil - Date.now())/1000);
    err.textContent = `Demasiados intentos. Espera ${secs}s antes de volver a intentar.`;
    err.classList.add('show');
    return;
  }
  const email = document.getElementById('si-email').value.trim();
  const password = document.getElementById('si-password').value;
  const found = getUsers().find(u => u.email === email && u.password === password);
  if(!found){
    loginAttempts++;
    if(loginAttempts >= 5){
      loginLockedUntil = Date.now() + 30000;
      loginAttempts = 0;
      err.textContent = 'Demasiados intentos fallidos. Espera 30 segundos.';
    } else {
      err.textContent = 'No encontramos una cuenta con ese correo y contraseña.';
    }
    err.classList.add('show');
    return;
  }
  loginAttempts = 0;
  err.classList.remove('show');
  currentUser = found;
  setCurrentUser(found);
  routeAfterAuth();
}
function demoLogin(kind){
  const map = {'family':'familia@demo.com','pro-approved':'pro@demo.com','pro-pending':'pendiente@demo.com'};
  currentUser = getUsers().find(u => u.email === map[kind]);
  setCurrentUser(currentUser);
  routeAfterAuth();
}
function watchDemo(){
  currentUser = getUsers().find(u=>u.email==='familia@demo.com');
  setCurrentUser(currentUser);
  routeAfterAuth();
}

/* ===================== AUTH ROUTER ===================== */
function routeAfterAuth(){
  if(currentUser.status !== 'approved'){
    goTo('pendiente');
  } else if(currentUser.role === 'family'){
    goTo('client-search');
  } else {
    goTo('nurse-jobs');
  }
}
function goToOwnDashboard(){
  if(!currentUser){ openAuth(); return; }
  routeAfterAuth();
}
function logout(){
  currentUser = null;
  clearCurrentUser();
  goToDashboard();
}
function updateNavUser(){
  const guest = document.getElementById('nav-guest');
  const user = document.getElementById('nav-user');
  if(!guest || !user) return;
  guest.style.display = currentUser ? 'none' : 'inline-flex';
  user.style.display = currentUser ? 'inline-flex' : 'none';
  if(currentUser){
    document.getElementById('nav-avatar').textContent = initials(currentUser.name);
    document.getElementById('nav-name').textContent = currentUser.name.split(' ')[0];
  }
}

/* Protege páginas internas: si no hay sesión, manda a login.
   Se llama al inicio de cada página de la app (buscar, solicitudes, trabajos, etc.) */
function requireAuth(expectedRole){
  if(!currentUser){ openAuth(); return false; }
  if(expectedRole && currentUser.role !== expectedRole){ goToOwnDashboard(); return false; }
  if(currentUser.status !== 'approved' && window.location.pathname.endsWith(PAGES.pendiente) === false){
    goTo('pendiente'); return false;
  }
  return true;
}

/* ===================== SELECCIÓN VISUAL DE OPCIONES (usado en formularios) ===================== */
function wireOptionCards(){
  document.querySelectorAll('.option-card input').forEach(inp => {
    inp.addEventListener('change', () => {
      const card = inp.closest('.option-card');
      if(inp.type === 'radio'){
        card.closest('.option-grid').querySelectorAll('.option-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
      } else { card.classList.toggle('selected', inp.checked); }
    });
  });
  document.querySelectorAll('.weekday-chip input').forEach(inp => {
    inp.addEventListener('change', () => inp.closest('.weekday-chip').classList.toggle('selected', inp.checked));
  });
}

/* ===================== WIZARD GENÉRICO (barra de progreso) ===================== */
function buildProgress(containerId, total){
  const el = document.getElementById(containerId); if(!el) return; el.innerHTML='';
  for(let i=0;i<total;i++){ const d=document.createElement('div'); d.className='dot'; el.appendChild(d); }
}
function updateProgress(containerId, current){
  document.querySelectorAll('#'+containerId+' .dot').forEach((d,i)=>d.classList.toggle('done', i<=current));
}

/* ===================== WIZARD DE REGISTRO (rol → 2 pasos) — registro.html ===================== */
let wizardRole = 'family';
let wizardStep = 0;
function selectWizardRole(role){
  wizardRole = role;
  document.getElementById('wiz-role-family').classList.toggle('selected', role==='family');
  document.getElementById('wiz-role-professional').classList.toggle('selected', role==='professional');
  document.getElementById('wiz-continue-btn').textContent = role==='family' ? 'Continuar como Cliente →' : 'Continuar como Enfermero/a →';
}
function startSignupWizard(){
  wizardStep = 0;
  document.getElementById('screen-role-select').style.display = 'none';
  document.getElementById('screen-signup-wizard').style.display = 'block';
  buildProgress('wiz-progress', 2);
  updateProgress('wiz-progress', 0);
  showWizardStep();
}
function backToRoleSelect(){
  document.getElementById('screen-signup-wizard').style.display = 'none';
  document.getElementById('screen-role-select').style.display = 'block';
}
function showWizardStep(){
  document.querySelectorAll('#screen-signup-wizard .form-step').forEach(s=>s.classList.remove('active'));
  if(wizardStep === 0){
    document.querySelector('#screen-signup-wizard .form-step[data-wizstep="0"]').classList.add('active');
  } else {
    document.querySelector(`#screen-signup-wizard .form-step[data-wizstep="1"][data-wizrole="${wizardRole}"]`).classList.add('active');
  }
  updateProgress('wiz-progress', wizardStep);
}
function wizardNext(){
  const nombre = document.getElementById('w-nombre').value.trim();
  const apellidos = document.getElementById('w-apellidos').value.trim();
  const email = document.getElementById('w-email').value.trim();
  const telefono = document.getElementById('w-telefono').value.trim();
  const err = document.getElementById('wiz-error-1');
  if(!nombre || !apellidos || !email || !telefono){ err.classList.add('show'); return; }
  err.classList.remove('show');
  wizardStep = 1; showWizardStep();
}
function wizardPrev(){ wizardStep = 0; showWizardStep(); }
/* ⚠ AVISO IMPORTANTE: estas fotos (título profesional y antecedentes
   penales) se convierten a texto (base64) y se guardan sin cifrar dentro
   de localStorage, junto con el resto del usuario. Son documentos de
   identidad reales y sensibles. Mientras el proyecto sea una demo/tarea,
   NO subas documentos reales de nadie para probar este formulario — usa
   cualquier imagen de ejemplo. Antes de manejar documentos reales, esto
   DEBE subirse a almacenamiento cifrado del lado del servidor (Firebase
   Storage / Supabase Storage con reglas de acceso), nunca al navegador. */
function readFileAsDataURL(file){
  if(!file) return Promise.resolve('');
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
async function notifyAdminOfRegistration(user){
  const fields = [
    `Nombre: ${user.name}`,
    `Correo del usuario: ${user.email}`,
    `Teléfono: ${user.phone || 'No indicado'}`,
    `Rol: ${user.role === 'professional' ? 'Enfermero/a' : 'Cliente'}`,
    `Zona: ${user.zone || 'No indicada'}`,
    user.role === 'professional' ? `Registro JVPE: ${user.jvpm || 'No indicado'}` : '',
    user.role === 'professional' ? `Especialidad: ${user.specialty || 'No indicada'}` : '',
    user.role === 'professional' ? `Años de experiencia: ${user.years || 'No indicados'}` : '',
    '',
    'Esta es una solicitud de demostración. No se adjuntan contraseñas ni documentos.'
  ].filter(Boolean).join('\n');
  try{
    const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', Accept:'application/json'},
      body: JSON.stringify({
        _subject: `Nueva solicitud de registro: ${user.name}`,
        name: user.name,
        email: user.email,
        message: fields,
        _replyto: user.email,
        _template: 'table',
        _captcha: 'false',
      }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.success !== false;
  }catch(error){
    return false;
  }
}
async function retryRegistrationEmail(){
  if(!currentUser) return;
  const sent = await notifyAdminOfRegistration(currentUser);
  saveJSON(LS_KEYS.registrationEmailStatus, sent ? 'sent' : 'failed');
  updateRegistrationEmailStatus();
}
function updateRegistrationEmailStatus(){
  const status = document.getElementById('registration-email-status');
  if(!status) return;
  const result = loadJSON(LS_KEYS.registrationEmailStatus, '');
  if(result === 'sent'){
    status.textContent = 'Solicitud enviada. Revisa curandissv@gmail.com y la carpeta de spam. Si es la primera vez, confirma el correo de FormSubmit.';
    status.style.color = 'var(--blue-deep)';
  } else if(result === 'failed'){
    status.textContent = 'No se pudo enviar la solicitud. Comprueba que estés usando la web publicada y pulsa reenviar.';
    status.style.color = 'var(--danger)';
  } else {
    status.textContent = 'La solicitud se enviará a curandissv@gmail.com.';
  }
}
async function finishWizard(){
  const nombre = document.getElementById('w-nombre').value.trim();
  const apellidos = document.getElementById('w-apellidos').value.trim();
  const email = document.getElementById('w-email').value.trim();
  const telefono = document.getElementById('w-telefono').value.trim();
  let user;
  if(wizardRole === 'family'){
    const pass = document.getElementById('w-pass').value;
    const pass2 = document.getElementById('w-pass2').value;
    const depto = document.getElementById('w-depto').value;
    const err = document.getElementById('wiz-error-2f');
    if(!depto || pass.length<6 || pass!==pass2){ err.classList.add('show'); return; }
    err.classList.remove('show');
    user = {email, password:pass, name:nombre+' '+apellidos, role:'family', status:'pending', phone:telefono, zone:depto+', '+document.getElementById('w-municipio').value, radius:document.getElementById('w-radio').value};
  } else {
    const pass = document.getElementById('w-pass-pro').value;
    const pass2 = document.getElementById('w-pass2-pro').value;
    const jvpe = document.getElementById('w-jvpe').value.trim();
    const err = document.getElementById('wiz-error-2p');
    if(!jvpe || pass.length<6 || pass!==pass2){ err.classList.add('show'); return; }
    err.classList.remove('show');
    const titlePhoto = await readFileAsDataURL(document.getElementById('w-title-photo').files[0]);
    const criminalRecordPhoto = await readFileAsDataURL(document.getElementById('w-criminal-photo').files[0]);
    user = {email, password:pass, name:nombre+' '+apellidos, role:'professional', phone:telefono, jvpm:jvpe,
      years:document.getElementById('w-anios').value, specialty:document.getElementById('w-especialidad').value,
      zone:document.getElementById('w-depto-pro').value+', '+document.getElementById('w-municipio-pro').value,
      radius:document.getElementById('w-radio-pro').value, status:'pending',
      titlePhoto, criminalRecordPhoto};
  }
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  currentUser = user;
  setCurrentUser(user);
  const emailSent = await notifyAdminOfRegistration(user);
  saveJSON(LS_KEYS.registrationEmailStatus, emailSent ? 'sent' : 'failed');
  routeAfterAuth();
}

/* ===================== TAB BAR DE APP (post-login) — usada en las 8 páginas internas ===================== */
function tabBarHTML(active){
  const roleLabel = currentUser.role === 'family' ? 'Cliente' : 'Enfermero/a';
  const tabs = currentUser.role === 'family'
    ? [['Buscar','client-search'],['Solicitudes','client-requests'],['Mensajes','client-messages'],['Nosotros','nosotros']]
    : [['Trabajos','nurse-jobs'],['Solicitudes','nurse-requests'],['Chats','nurse-chats'],['Mi Perfil','nurse-profile'],['Nosotros','nosotros']];
  return `
    <nav class="app-topbar">
      <div class="app-topbar-inner">
        <div class="app-greeting"><span class="avatar-dot">${esc(initials(currentUser.name))}</span><div>Buenas tardes,<br><strong>${esc(currentUser.name)}</strong></div></div>
        <div class="app-topbar-right"><span class="role-chip">${roleLabel}</span><a class="logout-link" onclick="logout()">↪ Salir</a></div>
      </div>
      <div class="app-tabs">${tabs.map(t=>`<a class="app-tab ${active===t[1]?'active':''}" href="${PAGES[t[1]]}">${t[0]}</a>`).join('')}</div>
    </nav>`;
}
function renderTabbar(active){
  const slot = document.querySelector('.tabbar-slot');
  if(slot) slot.innerHTML = tabBarHTML(active);
}

/* ===================== DASHBOARD ENFERMERO — trabajos.html ===================== */
function renderNurseDashboard(){
  renderJobBoard();
  renderAgenda();
}
function renderJobBoard(){
  const list = document.getElementById('job-list');
  if(!list) return;
  const applied = getAppliedJobs();
  list.innerHTML = mockJobs.map((job, idx) => `
    <div class="job-card">
      <div class="jc-top">
        <div><h4>${job.patient}</h4><p>${job.tasks}</p></div>
        <div class="pay">$${job.pay}</div>
      </div>
      <div class="tags">
        <span class="tag">${job.zone}</span><span class="tag">${job.turno}</span>
        <span class="tag ${job.urgencia==='Prioritaria'?'urgent':''}">${job.urgencia}</span>
      </div>
      <div class="privacy-note">🔒 La dirección exacta se revela solo si la familia confirma tu postulación.</div>
      <div style="margin-top:12px;text-align:right;"><button class="btn-apply ${applied.includes(idx)?'applied':''}" id="apply-${idx}" ${applied.includes(idx)?'disabled':''} onclick="applyJob(${idx})">${applied.includes(idx)?'Postulado ✓':'Postularme'}</button></div>
    </div>`).join('');
}
function applyJob(idx){
  const applied = getAppliedJobs();
  if(!applied.includes(idx)){ applied.push(idx); saveAppliedJobs(applied); }
  const btn = document.getElementById('apply-'+idx);
  btn.textContent = 'Postulado ✓'; btn.classList.add('applied'); btn.disabled = true;
}
function renderAgenda(){
  const grid = document.getElementById('agenda-grid');
  if(!grid) return;
  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const slots = ['AM','PM','Noche'];
  const busy = {'Lun-AM':1,'Mié-AM':1,'Vie-AM':1,'Mar-Noche':1,'Jue-Noche':1};
  let html = '<div class="ag-label"></div>' + days.map(d=>'<div class="ag-head">'+d+'</div>').join('');
  slots.forEach(slot => {
    html += '<div class="ag-label">'+slot+'</div>';
    days.forEach(d => {
      const key = d+'-'+slot;
      html += '<div class="ag-cell '+(busy[key]?'busy':'')+'"></div>';
    });
  });
  grid.style.gridTemplateColumns = 'auto repeat(7,1fr)';
  grid.innerHTML = html;
}

/* ===================== BUSCADOR DE ENFERMEROS (CLIENTE) — buscar.html ===================== */
function nurseCardHTML(n){
  const statusClass = n.disponible ? 'available' : 'unavailable';
  const statusLabel = n.disponible ? 'Disponible' : 'No disponible';
  const stars = '★'.repeat(Math.round(n.rating)) + '☆'.repeat(5-Math.round(n.rating));
  return `
    <div class="nurse-card ${statusClass}">
      <div class="nc-top">
        <div class="nc-who">
          <div class="nc-avatar">👩‍⚕️</div>
          <div><div class="nc-name">${esc(n.name)}</div><div class="nc-reg">✓ ${esc(n.jvpe)}</div></div>
        </div>
        <span class="status-pill ${statusClass}">${statusLabel}</span>
      </div>
      <div class="nc-tags"><span class="nc-tag">${esc(n.spec)}</span>${n.tuZona?'<span class="nc-tag zone">Tu zona</span>':''}</div>
      <div class="nc-stats">
        <div class="nc-stat"><b>${stars} ${n.rating}</b>${n.reviews} reseñas</div>
        <div class="nc-stat"><b>${n.years} años</b>experiencia</div>
        <div class="nc-stat"><b>$${n.rate}/hr</b>tarifa aprox.</div>
      </div>
      <div class="nc-loc">📍 ${esc(n.zone)} &nbsp;±${n.dist} km</div>
      <p class="nc-desc">${esc(n.desc)}</p>
      <span class="nc-services">Ver ${n.servicios} servicios ⌄</span>
      ${n.disponible
        ? `<button class="nc-btn" onclick='openRequestModal(${esc(JSON.stringify(n.name))})'>📶 Enviar Solicitud de Servicio</button>`
        : `<button class="nc-btn disabled" disabled>✕ No disponible actualmente</button>`}
    </div>`;
}
function renderNurseSearch(){
  const filterSelect = document.getElementById('nurse-search-filter');
  if(filterSelect && filterSelect.options.length <= 1){
    specialties.forEach(s => { const o=document.createElement('option'); o.value=s; o.textContent=s; filterSelect.appendChild(o); });
  }
  document.getElementById('sb-disponibles').textContent = mockNurses.filter(n=>n.disponible).length;
  document.getElementById('sb-total').textContent = mockNurses.length;
  document.getElementById('sb-zona').textContent = mockNurses.filter(n=>n.tuZona).length;

  const q = (document.getElementById('nurse-search-input')?.value || '').toLowerCase();
  const spec = document.getElementById('nurse-search-filter')?.value || '';
  const filtered = mockNurses.filter(n =>
    (n.name.toLowerCase().includes(q) || n.spec.toLowerCase().includes(q)) && (!spec || n.spec === spec)
  );
  const enZona = filtered.filter(n=>n.tuZona);
  const otros = filtered.filter(n=>!n.tuZona);
  let html = '';
  if(enZona.length){
    html += `<div class="zone-heading">📍 En San Salvador <span class="count">${enZona.length} cerca</span></div><div class="nurse-grid">${enZona.map(nurseCardHTML).join('')}</div>`;
  }
  if(otros.length){
    html += `<div class="zone-heading">〰️ Otros departamentos <span class="count">${otros.length}</span></div><div class="nurse-grid">${otros.map(nurseCardHTML).join('')}</div>`;
  }
  if(!filtered.length) html = '<div class="app-empty"><div class="ae-icon">🔍</div><h3>Sin resultados</h3><p>Prueba con otro nombre o especialidad.</p></div>';
  document.getElementById('nurse-search-results').innerHTML = html;
}

/* ===================== SOLICITUDES DEL CLIENTE — solicitudes.html ===================== */
function toggleTimeline(idx){
  document.getElementById('tl-detail-'+idx).classList.toggle('open');
}
function renderClientRequests(){
  const el = document.getElementById('client-requests-list');
  if(!el) return;
  familyPostings = getPostings();
  if(!familyPostings.length){ el.innerHTML = '<div class="app-empty"><div class="ae-icon">📋</div><h3>Todavía no has publicado ninguna solicitud</h3><p>Usa "Buscar" para enviar una solicitud a un enfermero, o publica un trabajo abierto.</p></div>'; return; }
  el.innerHTML = familyPostings.map((p, idx) => `
    <div class="timeline-item" onclick="toggleTimeline(${idx})">
      <div class="ti-top">
        <div><h4>${esc(p.paciente || p.relation || 'Solicitud')}</h4><p>${esc(p.tipo || p.turno || '')}${p.fecha? ' · '+esc(p.fecha) : ''}</p></div>
        <span class="tag ${p.urgencia==='urgente'||p.urgencia==='Prioritaria/Urgente'?'urgent':''}">${esc(p.urgencia) || '—'}</span>
      </div>
      <div class="tags"><span class="tag">${p.nurseName ? 'Para: '+esc(p.nurseName) : 'Solicitud abierta'}</span></div>
      <div class="timeline-detail" id="tl-detail-${idx}">
        <p style="font-size:13px;">${esc(p.desc) || 'Sin descripción adicional.'}</p>
      </div>
    </div>`).join('');
}

/* ===================== MI PERFIL (ENFERMERO) — perfil.html ===================== */
function renderNurseProfile(){
  if(!currentUser) return;
  document.getElementById('prof-avatar').textContent = initials(currentUser.name);
  document.getElementById('prof-name').textContent = currentUser.name;
  document.getElementById('prof-specialty').textContent = currentUser.specialty || 'Enfermería General';
  document.getElementById('prof-reg').textContent = '✓ JVPE: ' + (currentUser.jvpm || '001-2025');
  document.getElementById('prof-rating').textContent = '5.0';
  document.getElementById('prof-years').textContent = currentUser.years || '1';
  document.getElementById('prof-rate').textContent = '$15';
  document.getElementById('prof-email').textContent = currentUser.email;
  document.getElementById('prof-phone').textContent = currentUser.phone || '—';
  document.getElementById('prof-location').textContent = currentUser.zone || '—';
  document.getElementById('prof-radius').textContent = (currentUser.radius || '15') + ' km de cobertura';
  document.getElementById('prof-spec2').textContent = currentUser.specialty || 'Enfermería General';
  document.getElementById('prof-reg2').textContent = 'JVPE: ' + (currentUser.jvpm || '001-2025');
}

/* ===================== MODAL: NUEVA SOLICITUD / TRABAJO ABIERTO — usado en buscar.html ===================== */
let requestTargetNurse = null;
function selectUrgency(kind){
  document.getElementById('req-urg-normal').classList.toggle('selected', kind==='normal');
  document.getElementById('req-urg-urgente').classList.toggle('selected', kind==='urgente');
}
function openRequestModal(nurseName){
  requestTargetNurse = mockNurses.find(n=>n.name===nurseName) || null;
  document.getElementById('req-modal-title').textContent = 'Nueva Solicitud';
  document.getElementById('req-modal-sub').textContent = 'Completa los datos del servicio que necesitas';
  document.getElementById('req-open-note').style.display = 'none';
  document.getElementById('req-submit-btn').textContent = '📶 Enviar Solicitud';
  if(requestTargetNurse){
    const stars = '★'.repeat(Math.round(requestTargetNurse.rating));
    document.getElementById('req-nurse-chip-slot').innerHTML = `
      <div class="req-nurse-chip"><div class="nc-avatar">👩‍⚕️</div><div><div class="n-name">${esc(requestTargetNurse.name)}</div><div class="n-meta">${esc(requestTargetNurse.spec)} · ${stars} ${requestTargetNurse.rating} (${requestTargetNurse.reviews} reseñas) · $${requestTargetNurse.rate}/hr</div></div></div>`;
  } else {
    document.getElementById('req-nurse-chip-slot').innerHTML = '';
  }
  resetRequestForm();
  document.getElementById('request-modal-overlay').classList.add('show');
}
function openOpenJobModal(){
  requestTargetNurse = null;
  document.getElementById('req-modal-title').textContent = 'Publicar Trabajo Abierto';
  document.getElementById('req-modal-sub').textContent = 'Cualquier enfermero/a disponible podrá aceptarlo';
  document.getElementById('req-nurse-chip-slot').innerHTML = '';
  document.getElementById('req-open-note').style.display = 'flex';
  document.getElementById('req-submit-btn').textContent = '📶 Publicar Trabajo';
  resetRequestForm();
  document.getElementById('request-modal-overlay').classList.add('show');
}
function resetRequestForm(){
  selectUrgency('normal');
  document.getElementById('req-fecha').value='';
  document.getElementById('req-horario').value='';
  document.getElementById('req-tipo').value='';
  document.getElementById('req-paciente').value='';
  document.getElementById('req-desc').value='';
}
function closeRequestModal(){ document.getElementById('request-modal-overlay').classList.remove('show'); }
function submitRequest(){
  const urgencia = document.getElementById('req-urg-urgente').classList.contains('selected') ? 'urgente' : 'normal';
  familyPostings = getPostings();
  familyPostings.unshift({
    id: Date.now(),
    nurseName: requestTargetNurse ? requestTargetNurse.name : null,
    urgencia, fecha: document.getElementById('req-fecha').value, horario: document.getElementById('req-horario').value,
    tipo: document.getElementById('req-tipo').value, paciente: document.getElementById('req-paciente').value,
    desc: document.getElementById('req-desc').value,
  });
  savePostings(familyPostings);
  closeRequestModal();
  goTo('client-requests');
}

/* ===================== INICIALIZACIÓN COMÚN ===================== */
document.addEventListener('DOMContentLoaded', () => {
  initLegalModal();
  updateNavUser();
  updateRegistrationEmailStatus();
  wireOptionCards();
});
