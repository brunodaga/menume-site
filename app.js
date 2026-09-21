(function(){
  'use strict';

  // =====================================================================
  // SUPABASE CLIENT + AUTH
  // =====================================================================
  var cfg = window.MENUME_CONFIG || {};
  if(!cfg.SUPABASE_URL || cfg.SUPABASE_URL.indexOf('SEU-PROJETO') > -1){
    document.getElementById('authStatus').textContent =
      'Configuração pendente: edite config.js com a URL e a chave do seu projeto Supabase.';
    document.getElementById('authStatus').className = 'auth-status error';
    document.getElementById('authSubmit').disabled = true;
    return;
  }
  var supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  var authScreen = document.getElementById('authScreen');
  var authForm = document.getElementById('authForm');
  var authEmail = document.getElementById('authEmail');
  var authStatus = document.getElementById('authStatus');
  var authSubmit = document.getElementById('authSubmit');
  var appRoot = document.getElementById('appRoot');
  var userEmailEl = document.getElementById('userEmail');
  var signOutBtn = document.getElementById('signOutBtn');

  authForm.addEventListener('submit', function(e){
    e.preventDefault();
    var email = authEmail.value.trim();
    if(!email) return;
    authSubmit.disabled = true;
    authStatus.className = 'auth-status';
    authStatus.textContent = 'Enviando link…';
    supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    }).then(function(res){
      authSubmit.disabled = false;
      if(res.error){
        authStatus.className = 'auth-status error';
        authStatus.textContent = 'Não foi possível enviar o link: ' + res.error.message;
        return;
      }
      authStatus.className = 'auth-status ok';
      authStatus.textContent = 'Link enviado! Confira seu e-mail (' + email + ') e clique para entrar.';
    }).catch(function(){
      authSubmit.disabled = false;
      authStatus.className = 'auth-status error';
      authStatus.textContent = 'Erro de conexão. Tente novamente.';
    });
  });

  signOutBtn.addEventListener('click', function(){
    supabase.auth.signOut();
  });

  supabase.auth.onAuthStateChange(function(event, session){
    if(session && session.user){
      state.userId = session.user.id;
      authScreen.hidden = true;
      appRoot.hidden = false;
      userEmailEl.textContent = session.user.email || '';
      boot();
    } else {
      state.userId = null;
      appRoot.hidden = true;
      authScreen.hidden = false;
    }
  });

  // =====================================================================
  // APP DATA / UI (adaptado do MenuMe original, agora falando com Supabase)
  // =====================================================================
  var RATINGS = [
    {id:'amei', label:'Amei'},
    {id:'gostei', label:'Gostei'},
    {id:'neutro', label:'Neutro'},
    {id:'naogostei', label:'Não gostei'},
    {id:'nuncamais', label:'Nunca mais'}
  ];
  var RATING_LABEL = {}; RATINGS.forEach(function(r){ RATING_LABEL[r.id] = r.label; });
  var CATEGORY_LABEL = {restaurante:'Restaurante', padaria:'Padaria', cafeteria:'Cafeteria', bar:'Bar', lanchonete:'Lanchonete', outro:'Outro'};
  var ICON_STROKE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{path}</svg>';
  var CATEGORY_ICON = {
    restaurante: ICON_STROKE.replace('{path}', '<path d="M7 2v8a2 2 0 0 0 2 2v10"/><path d="M7 2v6M11 2v6"/><path d="M17 2c-1.5 2-2 4-2 7 0 2 1 3 2 3v10"/>'),
    padaria: ICON_STROKE.replace('{path}', '<path d="M4 12c0-4 3-8 8-8s8 4 8 8"/><path d="M4 12h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>'),
    cafeteria: ICON_STROKE.replace('{path}', '<path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2c-.5 1-.5 1.5 0 2.5S8.5 6 8 7"/><path d="M12 2c-.5 1-.5 1.5 0 2.5S12.5 6 12 7"/>'),
    bar: ICON_STROKE.replace('{path}', '<path d="M5 4h14l-6 8v7h3M10 19h3v-7L5 4"/>'),
    lanchonete: ICON_STROKE.replace('{path}', '<path d="M4 11a8 8 0 0 1 16 0z"/><path d="M3 11h18M4 15h16l-1.2 5H5.2z"/>'),
    outro: ICON_STROKE.replace('{path}', '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>')
  };
  var BAD_RATINGS = ['naogostei','nuncamais'];
  var NEAR_METERS = 150;

  // ---- element refs ----
  var listEl = document.getElementById('list');
  var searchEl = document.getElementById('search');
  var filtersEl = document.getElementById('filters');
  var alertBanner = document.getElementById('alertBanner');
  var alertTitle = document.getElementById('alertTitle');
  var alertItems = document.getElementById('alertItems');
  var addBtn = document.getElementById('addBtn');

  var checkinOverlay = document.getElementById('checkinOverlay');
  var ciDetected = document.getElementById('ciDetected');
  var ciDetectedName = document.getElementById('ciDetectedName');
  var ciDetectedMeta = document.getElementById('ciDetectedMeta');
  var ciNotHere = document.getElementById('ciNotHere');
  var ciYesHere = document.getElementById('ciYesHere');
  var ciSearch = document.getElementById('ciSearch');
  var ciResults = document.getElementById('ciResults');
  var ciCancel = document.getElementById('ciCancel');
  var ciNewPlaceForm = document.getElementById('ciNewPlaceForm');
  var ciNewName = document.getElementById('ciNewName');
  var ciNewCategory = document.getElementById('ciNewCategory');
  var ciBackToPicker = document.getElementById('ciBackToPicker');
  var ciBackToPicker2 = document.getElementById('ciBackToPicker2');
  var ciNewCancel = document.getElementById('ciNewCancel');
  var ciActionName = document.getElementById('ciActionName');
  var ciActionMeta = document.getElementById('ciActionMeta');
  var ciRateDish = document.getElementById('ciRateDish');
  var ciRatePlace = document.getElementById('ciRatePlace');
  var ciClose2 = document.getElementById('ciClose2');

  var dishOverlay = document.getElementById('dishOverlay');
  var dishForm = document.getElementById('dishForm');
  var dishSheetTitle = document.getElementById('dishSheetTitle');
  var dishPlaceLine = document.getElementById('dishPlaceLine');
  var dishRatingGrid = document.getElementById('dishRatingGrid');
  var dishDeleteBtn = document.getElementById('dishDeleteBtn');
  var dishCancelBtn = document.getElementById('dishCancelBtn');
  var fDish = document.getElementById('fDish');
  var fDate = document.getElementById('fDate');
  var fNote = document.getElementById('fNote');

  var overallOverlay = document.getElementById('overallOverlay');
  var overallForm = document.getElementById('overallForm');
  var overallPlaceLine = document.getElementById('overallPlaceLine');
  var overallRatingGrid = document.getElementById('overallRatingGrid');
  var overallCancelBtn = document.getElementById('overallCancelBtn');
  var fPlaceCategory = document.getElementById('fPlaceCategory');
  var fOverallNote = document.getElementById('fOverallNote');

  var state = {
    userId: null,
    places: [],
    entries: [],
    loaded: false,
    activeFilter: 'todos',
    query: '',
    dishEditingId: null,
    dishSelectedRating: null,
    overallEditingPlaceId: null,
    overallSelectedRating: null,
    checkin: { coords: null, selectedPlace: null },
    expanded: {}
  };

  // ---- helpers ----
  function todayISO(){
    var d = new Date();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var day = String(d.getDate()).padStart(2,'0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function formatDate(iso){
    if(!iso) return '';
    var parts = iso.split('-');
    if(parts.length !== 3) return iso;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function normalize(s){
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function distanceMeters(lat1, lon1, lat2, lon2){
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function placeById(id){
    for(var i=0;i<state.places.length;i++){ if(state.places[i].id === id) return state.places[i]; }
    return null;
  }
  function dishCountFor(placeId){
    var n = 0;
    for(var i=0;i<state.entries.length;i++){ if(state.entries[i].placeId === placeId) n++; }
    return n;
  }
  function mapPlaceRow(row){
    return {
      id: row.id,
      name: row.name || '',
      nameLower: row.name_lower || normalize(row.name || ''),
      category: row.category || 'outro',
      lat: typeof row.lat === 'number' ? row.lat : null,
      lng: typeof row.lng === 'number' ? row.lng : null,
      overallRating: row.overall_rating || null,
      overallNote: row.overall_note || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || row.created_at || ''
    };
  }
  function mapDishRow(row){
    return {
      id: row.id,
      placeId: row.place_id,
      dish: row.dish || '',
      date: row.date || '',
      rating: row.rating || 'neutro',
      note: row.note || '',
      createdAt: row.created_at || ''
    };
  }

  // ---- rating button builders ----
  function buildRatingGrid(container, onSelect){
    container.innerHTML = '';
    RATINGS.forEach(function(r){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rating-opt ' + r.id;
      b.textContent = r.label;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function(){
        onSelect(r.id);
        Array.prototype.forEach.call(container.children, function(ch){
          ch.setAttribute('aria-pressed', ch === b ? 'true' : 'false');
        });
      });
      container.appendChild(b);
    });
  }
  function setRatingGridValue(container, value){
    Array.prototype.forEach.call(container.children, function(ch, i){
      ch.setAttribute('aria-pressed', RATINGS[i].id === value ? 'true' : 'false');
    });
  }
  buildRatingGrid(dishRatingGrid, function(id){ state.dishSelectedRating = id; });
  buildRatingGrid(overallRatingGrid, function(id){ state.overallSelectedRating = id; });

  // ---- filter chips ----
  var chipsDef = [{id:'todos', label:'Todos'}].concat(RATINGS.map(function(r){ return {id:r.id, label:r.label}; }));
  chipsDef.forEach(function(c){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = c.label;
    b.setAttribute('aria-pressed', c.id === 'todos' ? 'true' : 'false');
    b.addEventListener('click', function(){
      state.activeFilter = c.id;
      Array.prototype.forEach.call(filtersEl.children, function(ch){ ch.setAttribute('aria-pressed', ch === b ? 'true' : 'false'); });
      render();
    });
    filtersEl.appendChild(b);
  });

  // =====================================================================
  // DATA ACCESS (Supabase)
  // =====================================================================
  function refreshAll(){
    var placesQ = supabase.from('places').select('*').order('name');
    var dishesQ = supabase.from('dishes').select('*').order('date', { ascending: false }).limit(1000);
    return Promise.all([placesQ, dishesQ]).then(function(results){
      var placesRes = results[0], dishesRes = results[1];
      if(placesRes.error || dishesRes.error){
        listEl.innerHTML = '<div class="empty"><strong>Erro ao carregar</strong>Não foi possível ler seus registros agora. Recarregue a página.</div>';
        return;
      }
      state.places = (placesRes.data || []).map(mapPlaceRow);
      state.entries = (dishesRes.data || []).map(mapDishRow);
      state.loaded = true;
      render();
    });
  }

  // =====================================================================
  // DISH SHEET
  // =====================================================================
  function openDishSheet(place, entry){
    state.dishEditingId = entry ? entry.id : null;
    state._dishPlace = place;
    dishSheetTitle.textContent = entry ? 'Editar prato' : 'Novo prato';
    dishPlaceLine.textContent = place.name + ' · ' + (CATEGORY_LABEL[place.category] || place.category);
    dishDeleteBtn.hidden = !entry;
    fDish.value = entry ? entry.dish : '';
    fDate.value = entry ? entry.date : todayISO();
    fNote.value = entry ? (entry.note || '') : '';
    state.dishSelectedRating = entry ? entry.rating : null;
    setRatingGridValue(dishRatingGrid, state.dishSelectedRating);
    dishOverlay.hidden = false;
    fDish.focus();
  }
  function closeDishSheet(){
    dishOverlay.hidden = true;
    dishForm.reset();
    state.dishEditingId = null;
    state.dishSelectedRating = null;
    state._dishPlace = null;
  }
  dishCancelBtn.addEventListener('click', closeDishSheet);
  dishOverlay.addEventListener('click', function(e){ if(e.target === dishOverlay) closeDishSheet(); });

  dishForm.addEventListener('submit', function(e){
    e.preventDefault();
    if(!state.dishSelectedRating){ alert('Escolha uma avaliação para o prato.'); return; }
    if(!state._dishPlace || !state.userId){ return; }
    var nowIso = new Date().toISOString();
    var row = {
      user_id: state.userId,
      place_id: state._dishPlace.id,
      dish: fDish.value.trim(),
      date: fDate.value || todayISO(),
      rating: state.dishSelectedRating,
      note: fNote.value.trim(),
      updated_at: nowIso
    };
    if(!row.dish){ return; }
    var submitBtn = dishForm.querySelector('.btn.primary');
    submitBtn.disabled = true;
    var task;
    if(state.dishEditingId){
      task = supabase.from('dishes').update(row).eq('id', state.dishEditingId);
    } else {
      row.created_at = nowIso;
      task = supabase.from('dishes').insert(row);
    }
    task.then(function(res){
      submitBtn.disabled = false;
      if(res.error){ alert('Não foi possível salvar agora. Tente de novo em instantes.'); return; }
      closeDishSheet();
      refreshAll();
    });
  });

  dishDeleteBtn.addEventListener('click', function(){
    if(!state.dishEditingId) return;
    if(!confirm('Excluir este prato?')) return;
    supabase.from('dishes').delete().eq('id', state.dishEditingId).then(function(res){
      if(res.error){ alert('Não foi possível excluir agora.'); return; }
      closeDishSheet();
      refreshAll();
    });
  });

  // =====================================================================
  // OVERALL PLACE SHEET
  // =====================================================================
  function openOverallSheet(place){
    state.overallEditingPlaceId = place.id;
    overallPlaceLine.textContent = place.name;
    fPlaceCategory.value = place.category || 'outro';
    fOverallNote.value = place.overallNote || '';
    state.overallSelectedRating = place.overallRating || null;
    setRatingGridValue(overallRatingGrid, state.overallSelectedRating);
    overallOverlay.hidden = false;
  }
  function closeOverallSheet(){
    overallOverlay.hidden = true;
    overallForm.reset();
    state.overallEditingPlaceId = null;
    state.overallSelectedRating = null;
  }
  overallCancelBtn.addEventListener('click', closeOverallSheet);
  overallOverlay.addEventListener('click', function(e){ if(e.target === overallOverlay) closeOverallSheet(); });

  overallForm.addEventListener('submit', function(e){
    e.preventDefault();
    if(!state.overallSelectedRating){ alert('Escolha uma avaliação geral para o lugar.'); return; }
    if(!state.overallEditingPlaceId){ return; }
    var submitBtn = overallForm.querySelector('.btn.primary');
    submitBtn.disabled = true;
    supabase.from('places').update({
      category: fPlaceCategory.value,
      overall_rating: state.overallSelectedRating,
      overall_note: fOverallNote.value.trim(),
      updated_at: new Date().toISOString()
    }).eq('id', state.overallEditingPlaceId).then(function(res){
      submitBtn.disabled = false;
      if(res.error){ alert('Não foi possível salvar agora. Tente de novo em instantes.'); return; }
      closeOverallSheet();
      refreshAll();
    });
  });

  // =====================================================================
  // CHECK-IN FLOW
  // =====================================================================
  function showCiPanel(name){
    ['ciLocating','ciDetected','ciPicker','ciNewPlaceForm','ciAction'].forEach(function(id){
      document.getElementById(id).hidden = (id !== name);
    });
  }
  function openCheckin(){
    state.checkin = { coords: null, selectedPlace: null, detectedPlace: null };
    checkinOverlay.hidden = false;
    showCiPanel('ciLocating');
    attemptGeolocation();
  }
  function closeCheckin(){
    checkinOverlay.hidden = true;
    ciSearch.value = '';
    ciNewPlaceForm.reset();
  }

  function attemptGeolocation(){
    if(!('geolocation' in navigator)){ showPicker(); return; }
    var settled = false;
    var timer = setTimeout(function(){ if(!settled){ settled = true; showPicker(); } }, 8000);
    try{
      navigator.geolocation.getCurrentPosition(function(pos){
        if(settled) return;
        settled = true;
        clearTimeout(timer);
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        state.checkin.coords = {lat: lat, lng: lng};
        var best = null, bestDist = Infinity;
        state.places.forEach(function(p){
          if(typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
          var d = distanceMeters(lat, lng, p.lat, p.lng);
          if(d < bestDist){ bestDist = d; best = p; }
        });
        if(best && bestDist <= NEAR_METERS){
          state.checkin.detectedPlace = best;
          ciDetectedName.textContent = best.name;
          var count = dishCountFor(best.id);
          var metaBits = [CATEGORY_LABEL[best.category] || best.category, count + (count === 1 ? ' prato registrado' : ' pratos registrados')];
          if(best.overallRating){ metaBits.push('avaliação geral: ' + RATING_LABEL[best.overallRating]); }
          ciDetectedMeta.textContent = metaBits.join(' · ');
          showCiPanel('ciDetected');
        } else {
          showPicker();
        }
      }, function(){
        if(settled) return;
        settled = true;
        clearTimeout(timer);
        showPicker();
      }, { enableHighAccuracy:true, timeout:7500, maximumAge:120000 });
    } catch(err){
      if(!settled){ settled = true; clearTimeout(timer); showPicker(); }
    }
  }

  function showPicker(){
    showCiPanel('ciPicker');
    renderPickerResults('');
    ciSearch.focus();
  }

  function renderPickerResults(q){
    var nq = normalize(q);
    var matches = state.places.filter(function(p){
      return !nq || normalize(p.name).indexOf(nq) > -1;
    }).sort(function(a,b){ return normalize(a.name) < normalize(b.name) ? -1 : 1; });

    var html = matches.slice(0, 30).map(function(p){
      var count = dishCountFor(p.id);
      var meta = [CATEGORY_LABEL[p.category] || p.category, count + (count === 1 ? ' prato' : ' pratos')];
      if(p.overallRating){ meta.push(RATING_LABEL[p.overallRating]); }
      return '<button type="button" class="picker-row" data-id="' + p.id + '">' +
        '<span class="picker-row-main"><span class="picker-row-name">' + escapeHtml(p.name) + '</span>' +
        '<span class="picker-row-meta">' + escapeHtml(meta.join(' · ')) + '</span></span></button>';
    }).join('');

    html += '<button type="button" class="picker-row picker-row-new" id="ciCreateNewRow">+ Criar novo lugar' +
      (q ? ': "' + escapeHtml(q) + '"' : '') + '</button>';

    ciResults.innerHTML = html;

    Array.prototype.forEach.call(ciResults.querySelectorAll('.picker-row[data-id]'), function(row){
      row.addEventListener('click', function(){
        var place = placeById(row.getAttribute('data-id'));
        if(place) goToActionStep(place);
      });
    });
    var createRow = document.getElementById('ciCreateNewRow');
    if(createRow){
      createRow.addEventListener('click', function(){
        ciNewName.value = q;
        ciNewCategory.value = 'restaurante';
        showCiPanel('ciNewPlaceForm');
        ciNewName.focus();
      });
    }
  }

  var ciSearchDebounce;
  ciSearch.addEventListener('input', function(){
    clearTimeout(ciSearchDebounce);
    var v = ciSearch.value;
    ciSearchDebounce = setTimeout(function(){ renderPickerResults(v); }, 100);
  });

  function goToActionStep(place){
    state.checkin.selectedPlace = place;
    ciActionName.textContent = place.name;
    var count = dishCountFor(place.id);
    var meta = [CATEGORY_LABEL[place.category] || place.category, count + (count === 1 ? ' prato registrado' : ' pratos registrados')];
    if(place.overallRating){ meta.push('avaliação geral: ' + RATING_LABEL[place.overallRating]); }
    ciActionMeta.textContent = meta.join(' · ');
    showCiPanel('ciAction');
  }

  ciYesHere.addEventListener('click', function(){
    if(state.checkin.detectedPlace) goToActionStep(state.checkin.detectedPlace);
  });
  ciNotHere.addEventListener('click', showPicker);
  ciCancel.addEventListener('click', closeCheckin);
  ciBackToPicker.addEventListener('click', showPicker);
  ciBackToPicker2.addEventListener('click', showPicker);
  ciNewCancel.addEventListener('click', showPicker);
  checkinOverlay.addEventListener('click', function(e){ if(e.target === checkinOverlay) closeCheckin(); });

  ciNewPlaceForm.addEventListener('submit', function(e){
    e.preventDefault();
    var name = ciNewName.value.trim();
    if(!name || !state.userId) return;
    var nowIso = new Date().toISOString();
    var row = {
      user_id: state.userId,
      name: name,
      name_lower: normalize(name),
      category: ciNewCategory.value,
      created_at: nowIso,
      updated_at: nowIso
    };
    if(state.checkin.coords){
      row.lat = state.checkin.coords.lat;
      row.lng = state.checkin.coords.lng;
    }
    var submitBtn = ciNewPlaceForm.querySelector('.btn.primary');
    submitBtn.disabled = true;
    supabase.from('places').insert(row).select().single().then(function(res){
      submitBtn.disabled = false;
      if(res.error || !res.data){ alert('Não foi possível criar o lugar agora.'); return; }
      var localPlace = mapPlaceRow(res.data);
      state.places.push(localPlace);
      goToActionStep(localPlace);
    });
  });

  ciRateDish.addEventListener('click', function(){
    var place = state.checkin.selectedPlace;
    closeCheckin();
    if(place) openDishSheet(place, null);
  });
  ciRatePlace.addEventListener('click', function(){
    var place = state.checkin.selectedPlace;
    closeCheckin();
    if(place) openOverallSheet(place);
  });
  ciClose2.addEventListener('click', closeCheckin);

  addBtn.addEventListener('click', openCheckin);

  // =====================================================================
  // MAIN LIST / SEARCH / STATS
  // =====================================================================
  var searchDebounce;
  searchEl.addEventListener('input', function(){
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function(){
      state.query = searchEl.value.trim();
      render();
    }, 120);
  });

  function placeMatchesQuery(place, nq){
    if(!nq) return true;
    return normalize(place.name).indexOf(nq) > -1 ||
           normalize(place.overallNote || '').indexOf(nq) > -1;
  }
  function dishMatchesQuery(dish, nq){
    if(!nq) return true;
    return normalize(dish.dish).indexOf(nq) > -1 || normalize(dish.note || '').indexOf(nq) > -1;
  }

  function renderStats(){
    document.getElementById('statTotal').textContent = state.entries.length;
    document.getElementById('statPlaces').textContent = state.places.length;
    var avoidPlaces = {};
    state.places.forEach(function(p){ if(p.overallRating === 'nuncamais') avoidPlaces[p.id] = true; });
    state.entries.forEach(function(e){ if(e.rating === 'nuncamais') avoidPlaces[e.placeId] = true; });
    document.getElementById('statAvoid').textContent = Object.keys(avoidPlaces).length;
  }

  function renderAlert(nq){
    if(!nq || nq.length < 2){ alertBanner.hidden = true; return; }
    var items = [];
    state.places.forEach(function(place){
      if(!placeMatchesQuery(place, nq) && !state.entries.some(function(e){ return e.placeId === place.id && dishMatchesQuery(e, nq); })){
        return;
      }
      if(BAD_RATINGS.indexOf(place.overallRating) > -1){
        items.push({place: place.name, label: 'Avaliação geral: ' + RATING_LABEL[place.overallRating], date: place.updatedAt || ''});
      }
      state.entries.filter(function(e){ return e.placeId === place.id && BAD_RATINGS.indexOf(e.rating) > -1; })
        .forEach(function(e){ items.push({place: place.name, label: e.dish + ' — ' + RATING_LABEL[e.rating], date: e.date}); });
    });
    if(items.length === 0){ alertBanner.hidden = true; return; }
    items.sort(function(a,b){ return (a.date < b.date) ? 1 : -1; });
    alertTitle.textContent = 'Atenção — antes já não curtiu isso aqui:';
    alertItems.innerHTML = items.slice(0, 4).map(function(it){
      return '<div class="alert-item"><span><b>' + escapeHtml(it.place) + '</b> — ' + escapeHtml(it.label) + '</span></div>';
    }).join('');
    alertBanner.hidden = false;
  }

  function render(){
    renderStats();
    var nq = normalize(state.query);
    renderAlert(nq);

    if(!state.loaded){ return; }

    var groups = state.places.map(function(place){
      var dishes = state.entries.filter(function(e){ return e.placeId === place.id; })
        .filter(function(e){ return state.activeFilter === 'todos' || e.rating === state.activeFilter; })
        .filter(function(e){ return dishMatchesQuery(e, nq); })
        .sort(function(a,b){ return (a.date < b.date) ? 1 : -1; });

      var placeMatchesSearch = placeMatchesQuery(place, nq);
      var placeMatchesFilter = state.activeFilter === 'todos' || place.overallRating === state.activeFilter;

      var include;
      if(!nq){
        include = dishes.length > 0 || placeMatchesFilter;
      } else {
        include = dishes.length > 0 || (placeMatchesSearch && placeMatchesFilter);
      }
      if(!include) return null;

      var lastDate = dishes.length ? dishes[0].date : (place.updatedAt || place.createdAt || '');
      return { place: place, dishes: dishes, lastDate: lastDate };
    }).filter(Boolean);

    groups.sort(function(a,b){ return (a.lastDate < b.lastDate) ? 1 : -1; });

    if(groups.length === 0){
      listEl.innerHTML = '<div class="empty"><strong>Nada por aqui ainda</strong>' +
        (state.places.length === 0
          ? 'Toque em "+" para registrar seu primeiro lugar.'
          : 'Nenhum lugar ou prato bate com essa busca ou filtro.') +
        '</div>';
      return;
    }

    listEl.innerHTML = groups.map(function(g){
      var p = g.place;
      var count = dishCountFor(p.id);
      var headerRight = p.overallRating
        ? '<button type="button" class="stamp stamp-btn ' + p.overallRating + '" data-rate-place="' + p.id + '" aria-label="Editar avaliação geral">' + escapeHtml(RATING_LABEL[p.overallRating]) + '</button>'
        : '<button type="button" class="rate-chip" data-rate-place="' + p.id + '">Avaliar lugar</button>';

      var hasBadDish = g.dishes.some(function(e){ return BAD_RATINGS.indexOf(e.rating) > -1; });
      var stripeVar = p.overallRating ? 'var(--r-' + p.overallRating + ')' : (hasBadDish ? 'var(--r-naogostei)' : 'var(--accent-cool)');

      var isOpen = !!state.expanded[p.id];
      if((state.query || state.activeFilter !== 'todos') && g.dishes.length) isOpen = true;

      var dishesHtml = '';
      if(isOpen){
        dishesHtml = '<div class="dishes-wrap">' +
          g.dishes.map(function(e){
            return '<div class="dish-row" tabindex="0" data-dish-id="' + e.id + '">' +
              '<div class="dish-row-top"><span class="dish-name">' + escapeHtml(e.dish) + '</span>' +
              '<span class="stamp ' + e.rating + '">' + escapeHtml(RATING_LABEL[e.rating]) + '</span></div>' +
              (e.note ? '<div class="dish-note">“' + escapeHtml(e.note) + '”</div>' : '') +
              '<div class="dish-date mono">' + formatDate(e.date) + '</div>' +
            '</div>';
          }).join('') +
          '<button type="button" class="dish-row add-dish-row" data-add-dish="' + p.id + '">+ Adicionar prato</button>' +
        '</div>';
      }

      var disclosure = count > 0
        ? '<span class="disclosure' + (isOpen ? ' open' : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'
        : '<span class="disclosure disclosure-spacer" aria-hidden="true"></span>';

      return '<div class="place-group" style="--stripe:' + stripeVar + '" data-place-id="' + p.id + '">' +
        '<div class="place-header">' +
          '<div class="place-header-left" tabindex="0" role="button" aria-expanded="' + isOpen + '" data-toggle="' + p.id + '">' +
            disclosure +
            '<div class="place-icon">' + (CATEGORY_ICON[p.category] || CATEGORY_ICON.outro) + '</div>' +
            '<div class="place-header-main"><div class="place-name">' + escapeHtml(p.name) + '</div>' +
            '<div class="place-meta">' + escapeHtml(CATEGORY_LABEL[p.category] || p.category) + ' · ' + count + (count === 1 ? ' prato' : ' pratos') + '</div></div>' +
          '</div>' +
          '<div class="place-actions">' + headerRight + '</div>' +
        '</div>' + dishesHtml +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(listEl.querySelectorAll('[data-toggle]'), function(el){
      var toggle = function(){
        var id = el.getAttribute('data-toggle');
        state.expanded[id] = !state.expanded[id];
        render();
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); toggle(); } });
    });
    Array.prototype.forEach.call(listEl.querySelectorAll('[data-rate-place]'), function(el){
      el.addEventListener('click', function(ev){
        ev.stopPropagation();
        var place = placeById(el.getAttribute('data-rate-place'));
        if(place) openOverallSheet(place);
      });
    });
    Array.prototype.forEach.call(listEl.querySelectorAll('[data-add-dish]'), function(el){
      el.addEventListener('click', function(ev){
        ev.stopPropagation();
        var place = placeById(el.getAttribute('data-add-dish'));
        if(place) openDishSheet(place, null);
      });
    });
    Array.prototype.forEach.call(listEl.querySelectorAll('[data-dish-id]'), function(el){
      var open = function(){
        var id = el.getAttribute('data-dish-id');
        var entry = state.entries.find(function(e){ return e.id === id; });
        var place = entry ? placeById(entry.placeId) : null;
        if(entry && place) openDishSheet(place, entry);
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); open(); } });
    });
  }

  // =====================================================================
  // BOOT (chamado a cada login)
  // =====================================================================
  function boot(){
    state.loaded = false;
    state.expanded = {};
    listEl.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    refreshAll();
  }
})();
