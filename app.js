/* ==================== EL BOHÍO — lógica ==================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- utilidades ---------- */
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('localStorage lleno', e); } }
  };
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const wink = (sec) => {
    sec = typeof sec === 'string' ? document.querySelector(sec) : sec;
    if (!sec) return;
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    sec.classList.add('flash-sec');
    setTimeout(() => sec.classList.remove('flash-sec'), 1800);
  };

  /* ---------- nav móvil ---------- */
  const burger = $('.hamburger'), navLinks = $('.nav-links');
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.addEventListener('click', (e) => { if (e.target.tagName === 'A') navLinks.classList.remove('open'); });

  /* ---------- zonas vivas del SVG (si existe) ---------- */
  const bohioSvg = $('#bohio');
  if (bohioSvg) $$('.hot', bohioSvg).forEach(zone => {
    const go = () => { const id = zone.dataset.sec; if (id) wink(id); };
    zone.addEventListener('click', go);
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* destello del panel objetivo */
  const style = document.createElement('style');
  style.textContent = `.flash-sec{animation:secflash 1.8s ease}`;
  style.textContent += `@keyframes secflash{0%,100%{box-shadow:0 10px 34px var(--shadow)}30%{box-shadow:0 0 0 6px var(--gold),0 10px 34px var(--shadow)}}`;
  document.head.appendChild(style);

  /* ---------- clima: hojas ↔ lluvia ---------- */
  const weatherBtn = $('#weatherBtn');
  const setWeather = (w) => {
    document.body.classList.toggle('rain', w === 'rain');
    document.body.classList.toggle('leaves', w === 'leaves');
    weatherBtn.innerHTML = w === 'rain' ? '🌿 Día soleado' : '🌧️ Lluvia sobre la lámina';
    weatherBtn.setAttribute('aria-pressed', w === 'rain');
    store.set('bohio.weather', w);
  };
  weatherBtn.addEventListener('click', () =>
    setWeather(document.body.classList.contains('rain') ? 'leaves' : 'rain'));
  setWeather(store.get('bohio.weather', 'leaves'));

  /* ---------- círculo de conversación (Jitsi / Discord) ---------- */
  const JITSI_URL = "https://meet.jit.si/bohio-de-los-amigos"; // <-- cambia aquí tu sala
  $('#jitsiLink').setAttribute('href', JITSI_URL);
  $('#entrarBtn').addEventListener('click', () => window.open(JITSI_URL, '_blank', 'noopener'));

  const discordInput = $('#discordInput');
  const discordMsg = $('#discordMsg');
  $('#discordBtn').addEventListener('click', () => {
    let url = discordInput.value.trim();
    if (!url) { url = store.get('bohio.discord', ''); if (!url) { discordMsg.textContent = 'Pega tu enlace de Discord primero ✨'; return; } }
    window.open(url, '_blank', 'noopener');
    store.set('bohio.discord', url);
    discordMsg.textContent = '¡Listo! Enlace guardado y abierto 🤙';
    discordMsg.classList.add('ok');
  });
  const savedDiscord = store.get('bohio.discord', '');
  if (savedDiscord) { discordInput.value = savedDiscord; discordMsg.textContent = 'Enlace guardado ✓'; discordMsg.classList.add('ok'); }

  /* ==================== LA RADIO DEL BOHÍO ==================== */
  const audio = $('#audio');
  const STATIONS = [
    { id: 'groovesalad', name: 'Groove Salad', vibe: 'chill / ambient', icon: '🥬',
      url: 'https://ice1.somafm.com/groovesalad-256-mp3' },
    { id: 'cliqhop', name: 'Cliqhop', vibe: 'idm suavecito', icon: '🎛️',
      url: 'https://ice1.somafm.com/cliqhop-256-mp3' },
    { id: 'dronezone', name: 'Drone Zone', vibe: 'espacio profundo', icon: '🪐',
      url: 'https://ice1.somafm.com/dronezone-256-mp3' },
    { id: 'defcon', name: 'DEF CON', vibe: 'electro oscuro', icon: '🛰️',
      url: 'https://ice1.somafm.com/defcon-256-mp3' },
    { id: 'jazz-lluvia', name: 'Jazz & Lluvia', vibe: 'café, estudiar', icon: '☕',
      url: encodeURI('audio/Rainy Jazz Library  1 Hour Soothing Jazz  Rain Sounds  Studying Music  Work Aid.mp3'),
      local: true },
    { id: 'ac-lluvia', name: 'Cozy AC + Lluvia', vibe: 'relax, cozy', icon: '🌱',
      url: encodeURI('audio/Relaxing Animal Crossing music  rain sounds.mp3'),
      local: true }
  ];

  const stationsBox = $('#stations');
  const playBtn = $('#playBtn'), disc = $('#disc');
  const npTitle = $('#npTitle'), npMeta = $('#npMeta'), npStatus = $('#npStatus'), npDot = $('#npDot');
  const vol = $('#vol');
  let current = null;

  STATIONS.forEach(st => {
    const b = document.createElement('button');
    b.className = 'station';
    b.setAttribute('role', 'option');
    b.innerHTML = `<span class="mini">${st.icon}</span><span>${st.name}<small>${st.vibe}</small></span>`;
    b.addEventListener('click', () => select(st, b));
    stationsBox.appendChild(b);
  });
  const stationBtns = $$('.station');

  function select(st, btn, autoplay = true) {
    current = st;
    stationBtns.forEach(x => x.classList.toggle('active', x === btn));
    npTitle.textContent = st.name;
    npMeta.textContent = st.local
      ? '🎧 música del bohío · 1 hora para estar juntos 🍃'
      : st.vibe + ' · en vivo, sin anuncios 🍃';
    audio.src = st.url;
    playBtn.disabled = false;
    store.set('bohio.station', st.id);
    if (autoplay) play(); else { playBtn.textContent = '▶ Play'; playBtn.dataset.playing = '0'; }
  }

  function play() {
    if (!current) return;
    audio.play().then(() => {
      playBtn.textContent = '⏸ Pausa';
      playBtn.dataset.playing = '1';
      disc.classList.add('spinning');
      npStatus.textContent = 'sonando ahora';
      npDot.classList.add('live');
    }).catch(() => {
      playBtn.textContent = '▶ Play';
      disc.classList.remove('spinning');
      npStatus.textContent = 'hubo un tropiezo con la señal';
      npDot.classList.remove('live');
    });
  }
  function pause() {
    audio.pause();
    playBtn.textContent = '▶ Play';
    disc.classList.remove('spinning');
    npStatus.textContent = 'pausada';
    npDot.classList.remove('live');
  }
  playBtn.addEventListener('click', () => {
    if (playBtn.dataset.playing === '1') pause(); else play();
  });
  audio.addEventListener('error', () => {
    playBtn.textContent = '▶ Play';
    disc.classList.remove('spinning');
    npStatus.textContent = 'señal perdida, probá otra estación';
    npDot.classList.remove('live');
  });
  audio.volume = store.get('bohio.vol', 0.7);
  vol.value = audio.volume;
  vol.addEventListener('input', () => { audio.volume = +vol.value; store.set('bohio.vol', audio.volume); });

  /* restaurar última estación */
  const last = store.get('bohio.station', null);
  if (last) {
    const i = STATIONS.findIndex(s => s.id === last);
    if (i > -1) select(STATIONS[i], stationBtns[i], false);
  }

  /* ==================== EL TABLÓN DE AVISOS ==================== */
  const notesBox = $('#notes');
  const noteForm = $('#noteForm');
  const renderNotes = () => {
    notesBox.innerHTML = '';
    const notes = store.get('bohio.notes', []);
    if (!notes.length) return;
    const rotations = [-2, 2, -1, 1, -3, 0, 3, -2];
    notes.forEach((n, i) => {
      const div = document.createElement('div');
      div.className = 'note';
      div.style.background = n.color;
      div.style.setProperty('--rot', (rotations[i % rotations.length]) + 'deg');
      div.innerHTML = `<span class="tape"></span>
        <p></p>
        <span class="note-when">${fmtDate(n.when)}</span>
        <button class="del" aria-label="Quitar nota">✕</button>`;
      div.querySelector('p').textContent = n.text || '';
      div.querySelector('.del').addEventListener('click', () => {
        const nn = store.get('bohio.notes', []).filter(x => x !== n);
        store.set('bohio.notes', nn);
        renderNotes();
      });
      notesBox.appendChild(div);
    });
  };
  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#noteText').value.trim();
    if (!text) return;
    const color = noteForm.querySelector('input[name=color]:checked').value;
    const notes = store.get('bohio.notes', []);
    notes.unshift({ text, color, when: todayStr() });
    store.set('bohio.notes', notes);
    $('#noteText').value = '';
    renderNotes();
  });
  renderNotes();

  /* ==================== MURO DE FOTOS ==================== */
  const gallery = $('#gallery');
  const photoInput = $('#photoInput');
  const lb = $('#lightbox'), lbImg = $('#lbImg');

  const renderPhotos = () => {
    $$('.pic', gallery).forEach(f => { if (!f.classList.contains('pre')) f.remove(); });
    store.get('bohio.photos', []).forEach(p => {
      const fig = document.createElement('figure');
      fig.className = 'pic';
      fig.innerHTML = `<img src="${p.src}" alt="${p.cap || 'foto vieja'}" loading="lazy">
        <figcaption>${p.cap || 'pegado del álbum 🍃'}</figcaption>`;
      fig.querySelector('img').addEventListener('click', () => openLb(p.src));
      gallery.appendChild(fig);
    });
  };
  const openLb = (src) => { lbImg.src = src; lb.hidden = false; };
  const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
  $('#addPhotoBtn').addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', () => {
    [...photoInput.files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => compress(reader.result, (src, cap) => {
        const photos = store.get('bohio.photos', []);
        photos.push({ src, cap });
        while (photos.length > 12) photos.shift();
        store.set('bohio.photos', photos);
        renderPhotos();
      });
      reader.readAsDataURL(file);
    });
    photoInput.value = '';
  });

  /* ==================== ÁLBUM DEL GRUPO ==================== */
  const albumGrid = $('#albumGrid');
  const renderAlbum = () => {
    if (!albumGrid) return;
    (window.ALBUM || []).forEach(a => {
      const fig = document.createElement('figure');
      fig.className = 'pic';
      const im = document.createElement('img');
      im.src = encodeURI(a.m);
      im.alt = 'foto del álbum del grupo';
      im.loading = 'lazy';
      im.addEventListener('click', () => openLb(encodeURI(a.t)));
      const cap = document.createElement('figcaption');
      cap.textContent = 'álbum del grupo ✦';
      fig.appendChild(im);
      fig.appendChild(cap);
      albumGrid.appendChild(fig);
    });
  };
  renderAlbum();

  function compress(dataUrl, done) {
    const img = new Image();
    img.onload = () => {
      const MAX = 700, ratio = Math.min(1, MAX / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try { done(c.toDataURL('image/jpeg', 0.62)); }
      catch { done(dataUrl); }
    };
    img.onerror = () => done(dataUrl);
    img.src = dataUrl;
  }
  $$('.pic img', gallery).forEach(im => im.addEventListener('click', () => openLb(im.src)));
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  renderPhotos();

  /* ==================== LA BITÁCORA ==================== */
  const log = $('#log');
  const visitForm = $('#visitForm');
  $('#visitDate').value = todayStr();
  const renderLog = () => {
    log.innerHTML = '';
    const visits = store.get('bohio.visits', []);
    if (!visits.length) return;
    visits.sort((a, b) => (b.when || '').localeCompare(a.when || ''));
    visits.forEach(v => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="who"></span><span class="when"></span><span class="say"></span>`;
      li.querySelector('.who').textContent = v.name || 'Alguien';
      li.querySelector('.when').textContent = fmtDate(v.when);
      li.querySelector('.say').textContent = v.msg ? '— ' + v.msg : 'pasó a saludar 👋';
      log.appendChild(li);
    });
  };
  visitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#visitName').value.trim();
    const when = $('#visitDate').value || todayStr();
    const msg = $('#visitMsg').value.trim();
    if (!name) return;
    const visits = store.get('bohio.visits', []);
    visits.push({ name, when, msg });
    store.set('bohio.visits', visits);
    $('#visitName').value = ''; $('#visitMsg').value = '';
    renderLog();
  });
  renderLog();

  /* ==================== EL TOCADISCOS ==================== */
  const MEMBERS = [
    {
      name: 'Laura', initials: 'L', color: '#f2a6c2',
      songs: [
        { type: 'yt', id: 'Ve-rxwKuqtI', title: 'Laura · canción 1' },
        { type: 'yt', id: 'D4Ha40XUE1E', title: 'Laura · canción 2' }
      ],
      playlists: ['37i9dQZF1EIZ1HkjHHzYzZ', '37i9dQZF1EQoqCH7BwIYb7', '6jxJYnjwAvfjSe7GnuWDkw']
    },
    { name: 'Cielo', initials: 'Ci', color: '#a3bce8', playlists: ['74AdZqDvN121D3f417HMat'] },
    { name: 'Sara', initials: 'S', color: '#f2c14e', playlists: ['5GgMe0HXuxtrjL8Nc5BvsI'] },
    { name: 'Maithe', initials: 'M', color: '#9ad1a8', playlists: ['7tMrWTcPymMOhxb4Wu2b7A', '1zJ1lwigqYvIimp71hG2og'] },
    {
      name: 'Marin', initials: 'Ma', color: '#7fd1c8',
      songs: [
        { type: 'yt', id: 'zWytgJy-u8w', title: 'Marin · canción 1' },
        { type: 'yt', id: 'vB0-GUYW_uU', title: 'Marin · canción 2' },
        { type: 'yt', id: 'yBwYaXHhuNg', title: 'Marin · canción 3' },
        { type: 'yt', id: 'QrSV9ZdvYfg', title: 'Marin · canción 4' },
        { type: 'yt', id: 'ZloSpUYNpLw', title: 'Marin · canción 5' },
        { type: 'yt', id: 'VCUDn-B6Ack', title: 'Marin · canción 6' },
        { type: 'yt', id: '7EBE4333MS8', title: 'Marin · canción 7' },
        { type: 'yt', id: '2JXEp2im-LA', title: 'Marin · canción 8' },
        { type: 'yt', id: 'ymJ1svwvpLQ', title: 'Marin · canción 9' },
        { type: 'yt', id: 'WZkd2XUG2VU', title: 'Marin · canción 10' },
        { type: 'yt', id: '15Me8nszoN0', title: 'Marin · canción 11' },
        { type: 'yt', id: 'O6j4W0IdRC4', title: 'Marin · canción 12' },
        { type: 'yt', id: 'sDMxQF18yvA', title: 'Marin · canción 13' }
      ]
    },
    {
      name: 'Camila', initials: 'Ca', color: '#c9a8e8',
      songs: [
        { type: 'yt', id: 'QE1l5wRpxRA', title: 'Camila · canción 1' },
        { type: 'yt', id: '9Xdo1kTrbvM', title: 'Camila · canción 2' }
      ]
    },
    {
      name: 'Maryi', initials: 'My', color: '#ef9f7a',
      songs: [
        { type: 'yt', id: '9GCyD6HexgM', title: 'Maryi · canción 1' },
        { type: 'yt', id: '_6XzJPyAJDI', title: 'Maryi · canción 2' }
      ]
    },
    { name: 'Cesar', initials: 'Ce', color: '#8fa9c9', playlists: ['3F5xJqWbnFp82wBQXf9sEE'] },
    { name: 'Campos', initials: 'Cm', color: '#d9b26b', playlists: ['0xfo135rtL3m8zkfRz7ssK'] },
    {
      name: 'Duque', initials: 'Du', color: '#b392d9',
      songs: [
        { type: 'yt', id: 'LDZX4ooRsWs', title: 'Duque · canción 1' },
        { type: 'yt', id: 'VtLxuWkVaBY', title: 'Duque · canción 2' },
        { type: 'yt', id: 'lsEqmtE9UA0', title: 'Duque · canción 3' }
      ]
    },
    {
      name: 'Valerie', initials: 'V', color: '#e79aa5',
      songs: [
        { type: 'yt', id: 'KJC4BcH_fzs', title: 'Valerie · canción 1' },
        { type: 'yt', id: 'RCtMT8vlM6o', title: 'Valerie · canción 2' },
        { type: 'yt', id: '_xGhK6qgPtM', title: 'Valerie · canción 3' },
        { type: 'yt', id: 'mVcLPuyVyJs', title: 'Valerie · canción 4' },
        { type: 'yt', id: '-sf3cGF4x1c', title: 'Valerie · canción 5' },
        { type: 'yt', id: 'S0Ps_5ABIbE', title: 'Valerie · canción 6' },
        { type: 'yt', id: '1onlpSbzqVQ', title: 'Valerie · canción 7' },
        { type: 'yt', id: 'NemwE1YoTRM', title: 'Valerie · canción 8' },
        { type: 'yt', id: 'KMXQf811aCA', title: 'Valerie · canción 9' }
      ]
    }
  ];

  const rack = $('#rack'), queue = $('#queue');
  const activeDisc = $('#activeDisc'), activeLabel = $('#activeLabel');
  const activeName = $('#activeName');
  let currentMember = null;

  const setActive = (m) => {
    currentMember = m;
    activeLabel.textContent = m.initials;
    activeName.textContent = 'Disco de ' + m.name;
    activeDisc.style.setProperty('--c', m.color);
    activeDisc.classList.add('spinning');

    $$('.tvwrap', rack).forEach(d => d.classList.toggle('active', d.dataset.name === m.name));
    store.set('bohio.tocadiscos', m.name);
    renderQueue(m);
  };

  const renderQueue = (m) => {
    queue.innerHTML = '';
    if (!m) return;
    (m.songs || []).forEach(s => {
      const card = document.createElement('div');
      card.className = 'qcard youtube';
      card.innerHTML = `<h4>▶ ${s.title}</h4>
        <div class="embed"><button class="load-btn" type="button">▶ Cargar y escuchar</button></div>`;
      const embed = card.querySelector('.embed');
      embed.querySelector('.load-btn').addEventListener('click', () => {
        embed.innerHTML = `<iframe src="https://www.youtube.com/embed/${s.id}" title="${s.title}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>`;
      });
      queue.appendChild(card);
    });
    m.playlists.forEach(id => {
      const card = document.createElement('div');
      card.className = 'qcard playlist';
      card.innerHTML = `<h4>🎧 Playlist de ${m.name}</h4>
        <div class="embed"><button class="load-btn" type="button">▶ Cargar playlist</button></div>`;
      const embed = card.querySelector('.embed');
      embed.querySelector('.load-btn').addEventListener('click', () => {
        embed.innerHTML = `<iframe src="https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0"
          width="100%" height="352" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
      });
      queue.appendChild(card);
    });
  };

  MEMBERS.forEach(m => {
    const wrap = document.createElement('button');
    wrap.className = 'tvwrap';
    wrap.dataset.name = m.name;
    wrap.setAttribute('aria-label', 'Poner el disco de ' + m.name);
    const btn = document.createElement('span');
    btn.className = 'tvdisc';
    btn.style.setProperty('--c', m.color);
    const ic = document.createElement('span'); ic.className = 'tvri'; ic.textContent = m.initials;
    btn.appendChild(ic);
    const lb = document.createElement('span'); lb.className = 'tvdl'; lb.textContent = m.name;
    wrap.appendChild(btn);
    wrap.appendChild(lb);
    wrap.addEventListener('click', () => setActive(m));
    rack.appendChild(wrap);
  });

  const savedMember = store.get('bohio.tocadiscos', null);
  const saved = MEMBERS.find(x => x.name === savedMember);
  if (saved) setActive(saved);
  else {
    activeDisc.style.setProperty('--c', '#cfc6ba');
    activeLabel.textContent = '♬';
  }

  /* pausa / reanuda el giro de los discos */
  const pauseDiscBtn = $('#pauseDiscBtn');
  const ttScene = $('#tocadiscos');
  pauseDiscBtn.addEventListener('click', () => {
    const paused = ttScene.classList.toggle('paused');
    pauseDiscBtn.innerHTML = paused ? '▶ Seguir girando' : '⏸ Pausar discos';
  });
})();