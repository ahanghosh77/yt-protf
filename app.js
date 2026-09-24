// ==========================================================================
// AHAN TECH (@ahantech) & ALPHA 2026 PORTFOLIO APP
// WITH DYNAMIC VIDEO ENGINE & PERSONAL USER PANEL
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Default Channel Videos Data (@ahantech)
  // --------------------------------------------------------------------------
  // Authentic videos currently published on the channel and database
  const DEFAULT_VIDEOS = [
    {
      id: "v_1790142138903",
      title: "🔥 Get Free AI API Access with Microsoft Azure + Codex Setup!",
      thumb: "https://img.youtube.com/vi/Y4djQ1p5TXk/hqdefault.jpg",
      desc: "Tutorial & developer resources for 🔥 Get Free AI API Access with Microsoft Azure + Codex Setup!. Includes source code scripts, setup configs, and Alpha 2026 community materials.",
      duration: "HD Video",
      views: "New • Just now",
      author: "Ahan Tech",
      category: "claude gpt free",
      url: "https://youtube.com/watch?v=Y4djQ1p5TXk",
      resources: [
        {
          name: "Microsoft Azure AI Free Credits & Setup Guide.pdf",
          type: "pdf",
          ext: "PDF",
          icon: "file-pdf",
          file: "Microsoft Azure AI Free Credits & Setup Guide.pdf"
        },
        {
          name: "Alpha 2026 VIP Telegram Community Drop",
          type: "link",
          ext: "LINK",
          icon: "telegram",
          url: "https://t.me/alpha2026start",
          file: "https://t.me/alpha2026start"
        }
      ]
    }
  ];

  // --------------------------------------------------------------------------
  // State & LocalStorage Management (Videos & User Auth)
  // --------------------------------------------------------------------------
  const ADMIN_EMAIL = 'ahanghosh77@gmail.com'; // Creator / Founder Account

  // Central check: STRICTLY only ahanghosh77@gmail.com can access the admin panel and studio features
  function isUserAdmin(user) {
    if (!user || !user.email) return false;
    return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
  const STORAGE_KEY = 'ahantech_creator_videos';
  const USERS_STORAGE_KEY = 'ahantech_registered_users';
  const CURRENT_USER_KEY = 'ahantech_current_user';

  // Cache migration: purge any stale dummy items or old data in localStorage
  try {
    const APP_CACHE_VERSION = 'ahantech_v12_real_only';
    if (localStorage.getItem('ahantech_cache_version') !== APP_CACHE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem('ahantech_cache_version', APP_CACHE_VERSION);
      console.log('⚡ Purged old cache. Loaded authentic channel videos.');
    }
  } catch (e) {
    console.warn('Cache check:', e);
  }

  // --------------------------------------------------------------------------
  // Supabase Cloud Database Client Configuration
  // --------------------------------------------------------------------------
  const SUPABASE_URL = 'https://ubyfoaiklfqdktqmunuo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieWZvYWlrbGZxZGt0cW11bnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjA5NzAsImV4cCI6MjA5NTY5Njk3MH0.KNS4HFUiE8f04MNSIgy4eI919mVama1susWq8hvTMNw';
  
  let supabaseClient = null;
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('⚡ Connected to Supabase Cloud Database (ubyfoaiklfqdktqmunuo)');
    }
  } catch (e) {
    console.warn('Supabase initialization fallback:', e);
  }

  // Supabase Storage Cloud Upload Helper for PDF Files
  async function uploadPdfToSupabase(file, filename) {
    const cleanName = `${Date.now()}_${(filename || 'guide.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    // SDK Upload Attempt
    if (supabaseClient && supabaseClient.storage) {
      try {
        const { data, error } = await supabaseClient.storage.from('pdfs').upload(cleanName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf'
        });
        if (!error && data) {
          const { data: publicUrlData } = supabaseClient.storage.from('pdfs').getPublicUrl(cleanName);
          const pubUrl = publicUrlData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/pdfs/${cleanName}`;
          console.log('⚡ Supabase PDF uploaded via SDK:', pubUrl);
          return { path: cleanName, publicUrl: pubUrl };
        } else if (error) {
          console.warn('Supabase storage SDK upload warning:', error);
        }
      } catch (e) {
        console.warn('Supabase storage SDK error:', e);
      }
    }

    // Direct REST API Fallback
    try {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/pdfs/${cleanName}`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true'
        },
        body: file
      });
      if (res.ok) {
        const pubUrl = `${SUPABASE_URL}/storage/v1/object/public/pdfs/${cleanName}`;
        console.log('⚡ Supabase PDF uploaded via REST:', pubUrl);
        return { path: cleanName, publicUrl: pubUrl };
      }
    } catch (err) {
      console.warn('Supabase REST upload fallback error:', err);
    }

    return { path: cleanName, publicUrl: '' };
  }

  // Seed Default Accounts (Creator and Member)
  const DEFAULT_USERS = [
    {
      id: 'usr_founder',
      name: 'Ahan Ghosh',
      email: 'ahanghosh77@gmail.com',
      password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 hashed
      role: 'admin',
      joinedAt: 'Sept 2026',
      bookmarks: []
    },
    {
      id: 'usr_member',
      name: 'Community Developer',
      email: 'user@ahantech.com',
      password: '0b9c2625dc21ef05f6ad44edd611f363acbad3b97366e279707d130602d35ea2', // SHA-256 hashed
      role: 'user',
      joinedAt: 'Sept 2026',
      bookmarks: []
    }
  ];

  let registeredUsers = loadRegisteredUsers();
  let currentUser = loadCurrentUser();

  function loadRegisteredUsers() {
    let users = [];
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) users = parsed;
      }
    } catch (e) {
      console.warn('Error reading registered users:', e);
    }
    if (users.length === 0) users = [...DEFAULT_USERS];

    // Clean out any legacy dummy bookmark references
    const dummyIds = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'];
    users.forEach(u => {
      if (Array.isArray(u.bookmarks)) {
        u.bookmarks = u.bookmarks.filter(b => !dummyIds.includes(b));
      } else {
        u.bookmarks = [];
      }
      if (isUserAdmin(u)) {
        u.role = 'admin';
      } else {
        u.role = 'user';
        delete u.isAdmin;
      }
    });

    const hasFounder = users.some(u => isUserAdmin(u));
    if (!hasFounder) {
      users.unshift(DEFAULT_USERS[0]);
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return users;
  }

  function saveRegisteredUsers() {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }

  function loadCurrentUser() {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          const existing = registeredUsers.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
          const userObj = existing || parsed;
          if (Array.isArray(userObj.bookmarks)) {
            userObj.bookmarks = userObj.bookmarks.filter(b => !['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'].includes(b));
          }
          if (isUserAdmin(userObj)) {
            userObj.role = 'admin';
          } else {
            userObj.role = 'user';
            delete userObj.isAdmin;
          }

          // Synchronously extract Google account profile photo from Supabase OAuth token if available
          if (!userObj.avatarUrl) {
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.includes('-auth-token') || k.startsWith('sb-'))) {
                  const sbData = JSON.parse(localStorage.getItem(k));
                  const sbUser = sbData?.user;
                  const photo = sbUser?.user_metadata?.avatar_url || 
                                sbUser?.user_metadata?.picture || 
                                sbUser?.identities?.[0]?.identity_data?.avatar_url ||
                                sbUser?.identities?.[0]?.identity_data?.picture;
                  if (photo && (sbUser?.email || '').toLowerCase() === userObj.email.toLowerCase()) {
                    userObj.avatarUrl = photo;
                    break;
                  }
                }
              }
            } catch (err) {}
          }

          return userObj;
        }
      }
    } catch (e) {
      console.warn('Error reading current user:', e);
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // Global Access & Authentication Guard
  // --------------------------------------------------------------------------
  function requireAuth(actionDesc = 'access this resource', tab = 'signup') {
    if (!currentUser) {
      openAuthModal(tab);
      showToast(`Please Sign Up or Log In to ${actionDesc}!`, 'lock');
      return false;
    }
    return true;
  }

  function checkAuthViewState() {
    document.body.classList.remove('landing-active');
    const mainWebsiteApp = document.getElementById('mainWebsiteApp');
    if (mainWebsiteApp) {
      mainWebsiteApp.style.display = 'flex';
      mainWebsiteApp.classList.add('unlocked');
    }
  }

  function setCurrentUser(user) {
    currentUser = user;
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Error setting current user:', e);
    }
    checkAuthViewState();
    updateNavAuthUI();
    renderVideos();
    if (user && document.getElementById('userPanelModalOverlay')?.classList.contains('open')) {
      updateUserPanelHeader();
      renderUserBookmarks();
    }
  }

  function updateUserInStorage(user) {
    if (!user) return;
    const idx = registeredUsers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx > -1) {
      registeredUsers[idx] = { ...registeredUsers[idx], ...user };
    } else {
      registeredUsers.push(user);
    }
    saveRegisteredUsers();
    if (currentUser && (currentUser.id === user.id || currentUser.email.toLowerCase() === user.email.toLowerCase())) {
      currentUser = { ...currentUser, ...user };
      try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } catch (e) {}
    }

    // Direct Realtime Sync to Supabase Cloud Database (user_profiles)
    if (supabaseClient && user && user.email) {
      supabaseClient.from('user_profiles').upsert({
        id: user.id || ('usr_' + Date.now()),
        name: user.name || 'Community Member',
        email: user.email.toLowerCase(),
        role: user.role || 'user',
        avatar_url: user.avatarUrl || '',
        bookmarks: user.bookmarks || [],
        downloaded_pdfs: user.downloadedPdfs || []
      }, { onConflict: 'email' }).then(({ error }) => {
        if (!error) console.log(`⚡ User profile synced to Supabase Cloud (${user.email})`);
      }).catch(err => console.warn('Supabase profile sync warning:', err));
    }
  }

  // --------------------------------------------------------------------------
  // Realtime Supabase Auth Listener (Detects Google OAuth Redirect & Sign-Ins)
  // --------------------------------------------------------------------------
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('⚡ Supabase Auth Event:', event, session?.user?.email);
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const authUser = session.user;
        const email = (authUser.email || '').toLowerCase();
        if (!email) return;

        const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
        const isCreator = isUserAdmin({ email, name: fullName });

        // Extract Google Account Profile Photo URL
        const avatarUrl = authUser.user_metadata?.avatar_url || 
                          authUser.user_metadata?.picture || 
                          authUser.identities?.[0]?.identity_data?.avatar_url ||
                          authUser.identities?.[0]?.identity_data?.picture || '';

        let targetUser = registeredUsers.find(u => u.email.toLowerCase() === email);
        if (!targetUser) {
          targetUser = {
            id: authUser.id || ('google_' + Date.now()),
            name: fullName,
            email: email,
            password: 'google_oauth_session',
            role: isCreator ? 'admin' : 'user',
            avatarUrl: avatarUrl,
            joinedAt: 'Sept 2026',
            bookmarks: [],
            downloadedPdfs: []
          };
          registeredUsers.push(targetUser);
          saveRegisteredUsers();
        } else {
          if (isCreator && targetUser.role !== 'admin') {
            targetUser.role = 'admin';
          }
          if (avatarUrl) {
            targetUser.avatarUrl = avatarUrl;
          }
          if (fullName && (!targetUser.name || targetUser.name === 'Community Member')) {
            targetUser.name = fullName;
          }
          saveRegisteredUsers();
        }

        updateUserInStorage(targetUser);
        setCurrentUser(targetUser);

        // Only display notification on an actual fresh OAuth redirect from Google, never on normal page refreshes
        const isFreshOAuthRedirect = window.location.hash.includes('access_token=') || window.location.search.includes('code=');
        if (isFreshOAuthRedirect) {
          showToast(`Welcome, ${targetUser.name}! Successfully signed in.`, 'circle-check');
        }

        // Clean up hash or code from URL cleanly
        if (window.location.hash || window.location.search.includes('code=')) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    });

    // Proactively check active Supabase Auth Session on startup to extract Google photo
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser = session.user;
        const photoUrl = authUser.user_metadata?.avatar_url || 
                         authUser.user_metadata?.picture || 
                         authUser.identities?.[0]?.identity_data?.avatar_url ||
                         authUser.identities?.[0]?.identity_data?.picture || '';
        const userEmail = (authUser.email || '').toLowerCase();
        if (photoUrl) {
          let updated = false;
          if (currentUser && currentUser.email && currentUser.email.toLowerCase() === userEmail) {
            if (currentUser.avatarUrl !== photoUrl) {
              currentUser.avatarUrl = photoUrl;
              updateUserInStorage(currentUser);
              updateUserPanelHeader();
              updateNavAuthUI();
              updated = true;
            }
          }
          const regUser = registeredUsers.find(u => u.email.toLowerCase() === userEmail);
          if (regUser && regUser.avatarUrl !== photoUrl) {
            regUser.avatarUrl = photoUrl;
            saveRegisteredUsers();
            updated = true;
          }
          if (updated) {
            console.log('⚡ Auto-synced Google Account Profile Photo:', photoUrl);
          }
        }
      }
    }).catch(e => console.warn('Supabase profile photo startup check:', e));
  }

  // Check for OAuth error query parameters returned from Supabase / Google
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const oauthErrorDesc = urlParams.get('error_description');
    if (oauthError || oauthErrorDesc) {
      const readableError = oauthErrorDesc ? oauthErrorDesc.replace(/\+/g, ' ') : (oauthError || 'OAuth failure');
      console.warn('⚡ OAuth callback notification:', readableError);
      setTimeout(() => {
        showToast('OAuth: ' + readableError, 'triangle-exclamation');
      }, 350);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (e) {}

  let currentVideos = loadVideosFromStorage();
  let currentFilter = 'all';
  let currentSearchQuery = '';
  let isGridView = false;

  // --------------------------------------------------------------------------
  // Secure Password Hashing (SHA-256 via Web Crypto API)
  // --------------------------------------------------------------------------
  async function hashPassword(plainText) {
    if (!plainText) return '';
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback for environments without crypto.subtle (e.g. non-HTTPS)
      console.warn('crypto.subtle unavailable, using basic hash fallback');
      let hash = 0;
      for (let i = 0; i < plainText.length; i++) {
        const char = plainText.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'fallback_' + Math.abs(hash).toString(16);
    }
  }

  function loadVideosFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove old dummy seed videos (v1 through v8)
          const dummyIds = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'];
          parsed = parsed.filter(v => !dummyIds.includes(v.id));

          // Normalize resources: strictly PDF and Link only
          parsed = parsed.map(v => {
            const rawResources = Array.isArray(v.resources) ? v.resources : [];
            const normalized = rawResources.map(r => {
              const isPdf = r.type === 'pdf' || (r.ext && r.ext.toLowerCase().includes('pdf')) || (r.file && r.file.toLowerCase().endsWith('.pdf'));
              if (isPdf) {
                return {
                  name: r.name || 'Tutorial Guide.pdf',
                  type: 'pdf',
                  ext: 'PDF',
                  icon: 'file-pdf',
                  file: r.file && r.file.toLowerCase().endsWith('.pdf') ? r.file : `${(r.name || 'Tutorial-Guide').replace(/\.[^/.]+$/, '')}.pdf`,
                  dataUrl: r.dataUrl || ''
                };
              } else {
                const linkVal = r.url || (r.file && r.file.startsWith('http') ? r.file : 'https://t.me/alpha2026start');
                return {
                  name: r.name || 'Alpha 2026 Community Link',
                  type: 'link',
                  ext: 'LINK',
                  icon: 'link',
                  url: linkVal,
                  file: linkVal
                };
              }
            });
            return { ...v, resources: normalized };
          });
          if (parsed.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Error reading stored videos:', err);
    }
    return [...DEFAULT_VIDEOS];
  }

  function saveVideosToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentVideos));
    } catch (err) {
      console.error('Error saving videos to localStorage:', err);
    }
  }

  // --------------------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------------------
  const collabBtn = document.getElementById('collabBtn');
  const collabModalOverlay = document.getElementById('collabModalOverlay');
  const closeCollabModalBtn = document.getElementById('closeCollabModalBtn');
  const collabForm = document.getElementById('collabForm');
  const drawerCollabLink = document.getElementById('drawerCollabLink');

  const videoModalOverlay = document.getElementById('videoModalOverlay');
  const closeVideoModalBtn = document.getElementById('closeVideoModalBtn');
  const videoModalTitle = document.getElementById('videoModalTitle');
  const videoModalIframe = document.getElementById('videoModalIframe');
  const modalVideoDescBox = document.getElementById('modalVideoDescBox');
  const downloadModalAssetsBtn = document.getElementById('downloadModalAssetsBtn');

  const gridMenuBtn = document.getElementById('gridMenuBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchDropdown');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const searchClearBtn = document.getElementById('searchClearBtn');

  const paletteBtn = document.getElementById('paletteBtn');
  const filterBtn = document.getElementById('filterBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Video Shelf & Controls
  const videoShelfContainer = document.getElementById('videoShelfContainer');
  const carouselPrevBtn = document.getElementById('carouselPrevBtn');
  const carouselNextBtn = document.getElementById('carouselNextBtn');
  const carouselArrowGroup = document.getElementById('carouselArrowGroup');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const viewShelfBtn = document.getElementById('viewShelfBtn');
  const viewGridBtn = document.getElementById('viewGridBtn');
  const videoTotalCount = document.getElementById('videoTotalCount');

  // Auth & User Panel DOM Elements
  const authModalOverlay = document.getElementById('authModalOverlay');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const authTabSignup = document.getElementById('authTabSignup');
  const authTabLogin = document.getElementById('authTabLogin');
  const authPaneSignup = document.getElementById('authPaneSignup');
  const authPaneLogin = document.getElementById('authPaneLogin');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const btnGoToLogin = document.getElementById('btnGoToLogin');
  const btnGoToSignup = document.getElementById('btnGoToSignup');


  // --------------------------------------------------------------------------
  // Real Google OAuth Handler (Direct to accounts.google.com via Supabase)
  // --------------------------------------------------------------------------
  async function handleGoogleSignIn() {
    closeModal(authModalOverlay);

    if (supabaseClient && supabaseClient.auth) {
      showToast('Redirecting to Google Sign-In...', 'circle-notch');
      try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) {
          console.warn('Google OAuth error:', error);
          showToast('Google Sign-In: ' + error.message, 'triangle-exclamation');
          openModal(authModalOverlay);
        }
      } catch (err) {
        console.error('Google Sign-In exception:', err);
        showToast('Google sign-in error. Please use email below.', 'triangle-exclamation');
        openModal(authModalOverlay);
      }
    } else {
      showToast('Please sign in or register with email below.', 'envelope');
      openModal(authModalOverlay);
    }
  }

  // Attach Google triggers across modal
  document.querySelectorAll('.auth-trigger-google').forEach(btn => {
    btn.addEventListener('click', handleGoogleSignIn);
  });



  const userPanelModalOverlay = document.getElementById('userPanelModalOverlay');
  const closeUserPanelBtn = document.getElementById('closeUserPanelBtn');
  const userPanelLogoutBtn = document.getElementById('userPanelLogoutBtn');
  const userTabBtns = document.querySelectorAll('.user-tab-btn');
  const userTabPanes = document.querySelectorAll('.user-tab-pane');
  const userSettingsForm = document.getElementById('userSettingsForm');

  const drawerUserLink = document.getElementById('drawerUserLink');
  const drawerAuthLink = document.getElementById('drawerAuthLink');
  const btnRefreshUsers = document.getElementById('btnRefreshUsers');

  // --------------------------------------------------------------------------
  // Automated Theme Mood Switcher (4 Colors: Midnight Navy, Cobalt Bloom, Tangerine Petal, Dusty Taupe)
  // Silky Smooth Dual-Layer Crossfade with Ease-in/Ease-out transitions
  // --------------------------------------------------------------------------
  const THEMES = [
    {
      id: 'midnight-navy',
      name: 'Midnight Navy (#0B1020)',
      hex: '#0B1020',
      heroGradient: 'linear-gradient(135deg, #050811 0%, #0B1020 50%, #162447 100%)',
      viewportGradient: 'linear-gradient(135deg, #050811 0%, #0B1020 35%, #152238 70%, #070b16 100%)'
    },
    {
      id: 'cobalt-bloom',
      name: 'Cobalt Bloom (#4A6ED1)',
      hex: '#4A6ED1',
      heroGradient: 'linear-gradient(135deg, #12214d 0%, #294cb0 50%, #4A6ED1 100%)',
      viewportGradient: 'linear-gradient(135deg, #0b1429 0%, #172d5c 35%, #4A6ED1 70%, #15254a 100%)'
    },
    {
      id: 'tangerine-petal',
      name: 'Tangerine Petal (#FF7A2A)',
      hex: '#FF7A2A',
      heroGradient: 'linear-gradient(135deg, #5c2005 0%, #b84307 50%, #FF7A2A 100%)',
      viewportGradient: 'linear-gradient(135deg, #240d04 0%, #4a1c09 35%, #8c3509 70%, #291004 100%)'
    },
    {
      id: 'dusty-taupe',
      name: 'Dusty Taupe (#B59A90)',
      hex: '#B59A90',
      heroGradient: 'linear-gradient(135deg, #2d2421 0%, #574640 50%, #B59A90 100%)',
      viewportGradient: 'linear-gradient(135deg, #1b1513 0%, #362a26 35%, #594640 70%, #231b18 100%)'
    }
  ];
  let currentThemeIndex = 0;
  let autoThemeTimer = null;
  let activeHeroLayerIndex = 0; // 0 for A, 1 for B
  let isFirstThemeApply = true;
  const AUTO_THEME_INTERVAL_MS = 8000; // 8 seconds per automated transition

  function applyTheme(index, isUserManual = false) {
    currentThemeIndex = index % THEMES.length;
    const active = THEMES[currentThemeIndex];

    const allThemeClasses = [
      'theme-midnight-navy', 'theme-cobalt-bloom', 'theme-tangerine-petal', 'theme-dusty-taupe',
      'theme-cyber', 'theme-sapphire', 'theme-emerald', 'theme-crimson'
    ];
    allThemeClasses.forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(`theme-${active.id}`);

    // Smooth Dual-Layer Crossfade for Hero Stage and App Viewport (Ease-in/Ease-out)
    const heroLayerA = document.getElementById('heroStageBgA');
    const heroLayerB = document.getElementById('heroStageBgB');
    const vpLayerA = document.getElementById('viewportBgA');
    const vpLayerB = document.getElementById('viewportBgB');

    if (heroLayerA && heroLayerB) {
      if (isFirstThemeApply) {
        heroLayerA.style.background = active.heroGradient;
        heroLayerA.classList.add('active');
        heroLayerB.classList.remove('active');
        if (vpLayerA && vpLayerB) {
          vpLayerA.style.background = active.viewportGradient;
          vpLayerA.classList.add('active');
          vpLayerB.classList.remove('active');
        }
        activeHeroLayerIndex = 0;
        isFirstThemeApply = false;
      } else {
        const nextLayerIdx = 1 - activeHeroLayerIndex;
        const currentHero = activeHeroLayerIndex === 0 ? heroLayerA : heroLayerB;
        const nextHero = nextLayerIdx === 0 ? heroLayerA : heroLayerB;
        const currentVp = activeHeroLayerIndex === 0 ? vpLayerA : vpLayerB;
        const nextVp = nextLayerIdx === 0 ? vpLayerA : vpLayerB;

        // Set the incoming layer to the new gradient
        nextHero.style.background = active.heroGradient;
        if (nextVp) nextVp.style.background = active.viewportGradient;

        // Force browser layout flush so the new background is prepared
        void nextHero.offsetWidth;
        if (nextVp) void nextVp.offsetWidth;

        // Trigger buttery smooth crossfade with ease-in/out
        nextHero.classList.add('active');
        currentHero.classList.remove('active');

        if (nextVp && currentVp) {
          nextVp.classList.add('active');
          currentVp.classList.remove('active');
        }

        activeHeroLayerIndex = nextLayerIdx;
      }
    }

    const navBtn = document.getElementById('navPaletteQuickBtn');
    const stageBtn = document.getElementById('paletteBtn');
    if (navBtn) {
      navBtn.title = `Color Mood: ${active.name} (Smooth cross-fade • click to jump)`;
      navBtn.classList.add('auto-active');
    }
    if (stageBtn) {
      stageBtn.title = `Color Mood: ${active.name} (Smooth cross-fade • click to jump)`;
    }

    if (isUserManual) {
      showToast(`Color mood switched to ${active.name}!`, 'palette');
      restartAutoThemeTimer();
    }
  }

  function cycleTheme(isUserManual = true) {
    applyTheme((currentThemeIndex + 1) % THEMES.length, isUserManual);
  }

  function startAutoThemeTimer() {
    if (autoThemeTimer) clearInterval(autoThemeTimer);
    autoThemeTimer = setInterval(() => {
      cycleTheme(false); // Automated smooth cycle
    }, AUTO_THEME_INTERVAL_MS);
  }

  function restartAutoThemeTimer() {
    startAutoThemeTimer();
  }

  const navPaletteQuickBtn = document.getElementById('navPaletteQuickBtn');
  if (paletteBtn) paletteBtn.addEventListener('click', () => cycleTheme(true));
  if (navPaletteQuickBtn) navPaletteQuickBtn.addEventListener('click', () => cycleTheme(true));

  // Initialize with the first color palette theme (Midnight Navy) immediately
  applyTheme(0, false);
  startAutoThemeTimer();

  const navHomeLink = document.getElementById('navHomeLink');
  if (navHomeLink) {
    navHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --------------------------------------------------------------------------
  // Navigation Auth UI & Session Management
  // --------------------------------------------------------------------------
  function updateNavAuthUI() {
    const navAuthGroup = document.getElementById('navAuthGroup');
    if (!navAuthGroup) return;

    if (currentUser) {
      const initials = (currentUser.name || 'User')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const avatarHtml = currentUser.avatarUrl
        ? `<img src="${escapeHtml(currentUser.avatarUrl)}" alt="${escapeHtml(currentUser.name || 'User')}" class="user-nav-avatar-img" referrerpolicy="no-referrer" onerror="this.onerror=null; this.parentElement.textContent='${initials}'">`
        : initials;

      navAuthGroup.innerHTML = `
        <div class="user-nav-profile-pill" id="userNavPill" title="Open My User Panel">
          <span class="user-nav-avatar">${avatarHtml}</span>
          <span class="user-nav-name">${escapeHtml(currentUser.name || 'Member')}</span>
        </div>
      `;

      const pill = document.getElementById('userNavPill');
      if (pill) pill.addEventListener('click', openUserPanel);
    } else {
      navAuthGroup.innerHTML = `
        <button class="btn-nav-auth" id="navLoginBtn" title="Sign In or Register">
          <i class="fa-solid fa-user-circle"></i>
          <span>Sign In</span>
        </button>
      `;

      const loginBtn = document.getElementById('navLoginBtn');
      if (loginBtn) loginBtn.addEventListener('click', () => openAuthModal('login'));
    }

    const isCreator = isUserAdmin(currentUser);
    const btnManageCategories = document.getElementById('btnManageCategories');
    if (btnManageCategories) {
      btnManageCategories.style.display = isCreator ? 'inline-flex' : 'none';
    }
  }

  function handleLogout() {
    const userName = currentUser ? currentUser.name : 'User';
    setCurrentUser(null);
    closeModal(userPanelModalOverlay);
    showToast(`Signed out successfully. See you soon, ${userName}!`, 'right-from-bracket');
  }

  // --------------------------------------------------------------------------
  // Authentication Modal Controller (Sign Up & Log In)
  // --------------------------------------------------------------------------
  function openAuthModal(tab = 'signup') {
    openModal(authModalOverlay);
    switchAuthTab(tab);
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      if (authTabSignup) { authTabSignup.classList.remove('active'); authTabSignup.style.color = '#94a3b8'; authTabSignup.style.borderBottomColor = 'transparent'; authTabSignup.style.fontWeight = '600'; }
      if (authTabLogin) { authTabLogin.classList.add('active'); authTabLogin.style.color = '#6366f1'; authTabLogin.style.borderBottomColor = '#6366f1'; authTabLogin.style.fontWeight = '700'; }
      if (authPaneSignup) authPaneSignup.classList.remove('active');
      if (authPaneLogin) authPaneLogin.classList.add('active');
      const heading = document.getElementById('authModalHeading');
      if (heading) heading.textContent = 'Sign In to Account';
      const emailInput = document.getElementById('loginEmail');
      if (emailInput) setTimeout(() => emailInput.focus(), 120);
    } else {
      if (authTabLogin) { authTabLogin.classList.remove('active'); authTabLogin.style.color = '#94a3b8'; authTabLogin.style.borderBottomColor = 'transparent'; authTabLogin.style.fontWeight = '600'; }
      if (authTabSignup) { authTabSignup.classList.add('active'); authTabSignup.style.color = '#6366f1'; authTabSignup.style.borderBottomColor = '#6366f1'; authTabSignup.style.fontWeight = '700'; }
      if (authPaneLogin) authPaneLogin.classList.remove('active');
      if (authPaneSignup) authPaneSignup.classList.add('active');
      const heading = document.getElementById('authModalHeading');
      if (heading) heading.textContent = 'Create Ahan Tech Account';
      const nameInput = document.getElementById('signupName');
      if (nameInput) setTimeout(() => nameInput.focus(), 120);
    }
  }

  if (authTabSignup) authTabSignup.addEventListener('click', () => switchAuthTab('signup'));
  if (authTabLogin) authTabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (btnGoToLogin) btnGoToLogin.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('login'); });
  if (btnGoToSignup) btnGoToSignup.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('signup'); });

  if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', () => closeModal(authModalOverlay));
  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeModal(authModalOverlay);
    });
  }

  // Sign Up Form Submission (passwords hashed with SHA-256)
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim().toLowerCase();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;

      if (password !== confirmPassword) {
        showToast('Passwords do not match. Please re-enter.', 'triangle-exclamation');
        return;
      }

      // Check if email already registered
      const existing = registeredUsers.find(u => u.email.toLowerCase() === email);
      if (existing) {
        showToast('An account with this email already exists! Please log in.', 'circle-info');
        switchAuthTab('login');
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) loginEmail.value = email;
        return;
      }

      const hashedPass = await hashPassword(password);
      const isCreator = isUserAdmin({ email, name });
      const newUser = {
        id: 'usr_' + Date.now(),
        name: name || 'Community Member',
        email,
        password: hashedPass,
        role: isCreator ? 'admin' : 'user',
        joinedAt: 'Just now',
        bookmarks: [],
        downloadedPdfs: []
      };

      registeredUsers.push(newUser);
      saveRegisteredUsers();
      setCurrentUser(newUser);

      closeModal(authModalOverlay);
      signupForm.reset();
      showToast(`Welcome to Ahan Tech, ${escapeHtml(name)}! Your User Panel is ready.`, 'user-check');
      openUserPanel();
    });
  }

  // Log In Form Submission (secure hash comparison)
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      if (!email) {
        showToast('Please enter your email address.', 'triangle-exclamation');
        return;
      }

      const hashedPass = await hashPassword(password);

      // Match by email + hashed password, OR legacy plaintext for migration
      let user = registeredUsers.find(u => u.email.toLowerCase() === email && (u.password === hashedPass || u.password === password));

      // Migrate legacy plaintext password to hash on successful login
      if (user && user.password === password && user.password !== hashedPass) {
        user.password = hashedPass;
        updateUserInStorage(user);
      }

      if (user) {
        if (isUserAdmin(user)) {
          user.role = 'admin';
          updateUserInStorage(user);
        }
        setCurrentUser(user);
        closeModal(authModalOverlay);
        loginForm.reset();
        showToast(`Welcome back, ${escapeHtml(user.name)}!`, 'circle-check');
        openUserPanel();
      } else {
        showToast('Invalid email or password. Please check your credentials or Sign Up!', 'triangle-exclamation');
      }
    });
  }


  // --------------------------------------------------------------------------
  // User Panel Controller (Personal Dashboard & Bookmarks)
  // --------------------------------------------------------------------------
  function openUserPanel() {
    if (!currentUser) {
      openAuthModal('login');
      showToast('Please sign in to access your User Panel', 'user');
      return;
    }

    const isCreator = isUserAdmin(currentUser);
    const addVideoTabBtn = document.getElementById('userTabAddVideoBtn');
    const inquiriesTabBtn = document.getElementById('userTabInquiriesBtn');
    const categoriesTabBtn = document.getElementById('userTabCategoriesBtn');
    if (addVideoTabBtn) {
      addVideoTabBtn.style.display = isCreator ? 'inline-flex' : 'none';
    }
    if (inquiriesTabBtn) {
      inquiriesTabBtn.style.display = isCreator ? 'inline-flex' : 'none';
    }
    if (categoriesTabBtn) {
      categoriesTabBtn.style.display = isCreator ? 'inline-flex' : 'none';
    }
    const adminPdfVaultUploadCard = document.getElementById('adminPdfVaultUploadCard');
    if (adminPdfVaultUploadCard) {
      adminPdfVaultUploadCard.style.display = isCreator ? 'block' : 'none';
    }

    // If non-creator, make sure creator-only tabs are never shown or active
    if (!isCreator) {
      ['addvideo', 'inquiries', 'categories'].forEach(tabName => {
        const pane = document.getElementById(`userPane-${tabName}`);
        if (pane) pane.classList.remove('active');
        const tabBtn = document.querySelector(`.user-tab-btn[data-usertab="${tabName}"]`);
        if (tabBtn) {
          tabBtn.classList.remove('active');
          tabBtn.style.display = 'none';
        }
      });
      const defaultTabBtn = document.querySelector('.user-tab-btn[data-usertab="bookmarks"]');
      const defaultPane = document.getElementById('userPane-bookmarks');
      if (defaultTabBtn) defaultTabBtn.classList.add('active');
      if (defaultPane) defaultPane.classList.add('active');
    } else {
      loadSponsorInquiries();
      if (typeof renderCategoryFoldersManager === 'function') renderCategoryFoldersManager();
    }

    openModal(userPanelModalOverlay);
    updateUserPanelHeader();
    renderUserBookmarks();

    // Populate Settings Form
    const nameSetting = document.getElementById('settingDisplayName');
    const emailSetting = document.getElementById('settingEmail');
    const avatarSetting = document.getElementById('settingAvatarUrl');
    if (nameSetting) nameSetting.value = currentUser.name || '';
    if (emailSetting) emailSetting.value = currentUser.email || '';
    if (avatarSetting) avatarSetting.value = currentUser.avatarUrl || '';
  }

  function updateUserPanelHeader() {
    if (!currentUser) return;
    const avatar = document.getElementById('userPanelAvatar');
    const name = document.getElementById('userPanelName');
    const email = document.getElementById('userPanelEmail');
    const roleBadge = document.getElementById('userPanelRoleBadge');
    const joined = document.getElementById('userPanelJoined');

    const initials = (currentUser.name || 'User')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    if (avatar) {
      if (currentUser.avatarUrl) {
        avatar.innerHTML = `<img src="${escapeHtml(currentUser.avatarUrl)}" alt="${escapeHtml(currentUser.name || 'User')}" class="user-avatar-img" referrerpolicy="no-referrer" onerror="this.onerror=null; this.parentElement.textContent='${initials}'">`;
      } else {
        avatar.textContent = initials;
      }
    }
    if (name) name.textContent = currentUser.name || 'Community Member';
    if (email) email.textContent = currentUser.email || '';
    if (joined) joined.textContent = `Member since ${currentUser.joinedAt || 'Sept 2026'}`;

    if (roleBadge) {
      const isOwner = isUserAdmin(currentUser);
      if (isOwner) {
        roleBadge.textContent = 'Channel Creator';
        roleBadge.className = 'user-role-badge role-admin';
      } else {
        roleBadge.textContent = 'Community Member';
        roleBadge.className = 'user-role-badge';
      }
    }

    const isOwner = isUserAdmin(currentUser);
    const videoCount = currentVideos.length;

    const statBm = document.getElementById('statBookmarksCount');
    const statBmLabel = document.getElementById('statBookmarksLabel');
    const statTotal = document.getElementById('statTotalVideosCount');
    const tabBmCount = document.getElementById('userTabBookmarksCount');
    const tabVideosLabel = document.getElementById('userTabVideosLabel');

    if (tabVideosLabel) {
      tabVideosLabel.textContent = isOwner ? 'My Videos' : 'Channel Videos';
    }
    if (statBmLabel) {
      statBmLabel.textContent = isOwner ? 'Uploaded Videos' : 'Saved Videos';
    }
    if (statBm) {
      const bmCount = isOwner ? videoCount : (Array.isArray(currentUser.bookmarkedVideos) ? currentUser.bookmarkedVideos.length : 0);
      statBm.textContent = bmCount;
    }
    if (tabBmCount) tabBmCount.textContent = videoCount;
    if (statTotal) statTotal.textContent = videoCount;
  }

  // User Tab Switcher
  userTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-usertab');

      // Restrict creator-only tabs strictly to the official Admin
      if (btn.classList.contains('creator-only-tab') && !isUserAdmin(currentUser)) {
        showToast('Access restricted: Only ahanghosh77@gmail.com can access the admin panel.', 'triangle-exclamation');
        return;
      }

      userTabBtns.forEach(b => b.classList.remove('active'));
      userTabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(`userPane-${targetTab}`);
      if (pane) pane.classList.add('active');

      if (targetTab === 'bookmarks') renderUserBookmarks();
      else if (targetTab === 'inquiries') loadSponsorInquiries();
      else if (targetTab === 'categories') {
        if (typeof renderCategoryFoldersManager === 'function') renderCategoryFoldersManager();
      }
    });
  });

  // Admin delete video function
  function deleteVideo(videoId) {
    if (!isUserAdmin(currentUser)) return;
    const idx = currentVideos.findIndex(v => v.id === videoId);
    if (idx !== -1) {
      const title = currentVideos[idx].title;
      currentVideos.splice(idx, 1);
      saveVideosToStorage();
      renderVideos();
      if (supabaseClient) {
        supabaseClient.from('videos').delete().eq('id', videoId).then(({ error }) => {
          if (!error) console.log('⚡ Video deleted from Supabase Cloud');
        }).catch(err => console.warn('Supabase delete error:', err));
      }
      renderUserBookmarks();
      updateUserPanelHeader();
      showToast(`Removed "${title.slice(0, 30)}..."`, 'trash');
    }
  }

  function renderUserBookmarks() {
    const container = document.getElementById('userBookmarksContainer');
    if (!container) return;

    const isCreator = isUserAdmin(currentUser);

    if (currentVideos.length === 0) {
      if (isCreator) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #64748b;">
            <i class="fa-solid fa-film" style="font-size: 36px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
            <p style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: #334155;">No videos uploaded yet</p>
            <p style="font-size: 13px; margin-bottom: 18px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.5;">When you add videos using Creator Studio ("Upload Video"), they will immediately appear here on your User Panel and on the main website shelf for all members!</p>
            <button type="button" class="btn-input-action" id="btnAdminPanelUploadFirst" style="margin: 0 auto; background: #6366f1; color: #ffffff; padding: 10px 20px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-cloud-arrow-up"></i> Upload Video Now
            </button>
          </div>
        `;
        const uploadFirstBtn = document.getElementById('btnAdminPanelUploadFirst');
        if (uploadFirstBtn) {
          uploadFirstBtn.addEventListener('click', () => {
            const addVideoTab = document.querySelector('.user-tab-btn[data-usertab="addvideo"]');
            if (addVideoTab) addVideoTab.click();
          });
        }
      } else {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #64748b;">
            <i class="fa-solid fa-film" style="font-size: 36px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
            <p style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: #334155;">No videos published yet</p>
            <p style="font-size: 13px; margin-bottom: 16px; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.5;">Our channel tutorial vault is being refreshed. As soon as the admin uploads videos, they will appear here with downloadable PDFs and developer links!</p>
            <a href="https://t.me/alpha2026start" target="_blank" rel="noopener" class="btn-input-action" style="margin: 0 auto; background: #229ED9; color: #ffffff; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 700;">
              <i class="fa-brands fa-telegram"></i> Join Alpha 2026 VIP
            </a>
          </div>
        `;
      }
      return;
    }

    if (isCreator) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 10px 14px; background: rgba(99,102,241,0.08); border-radius: 12px; border: 1px solid rgba(99,102,241,0.2);">
          <span style="font-size: 13px; font-weight: 700; color: #4338ca;"><i class="fa-solid fa-circle-check"></i> Showing All ${currentVideos.length} Videos Added by You (Admin)</span>
          <button type="button" class="btn-admin-add-more" id="btnAdminAddMoreVideos" style="background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-plus"></i> Upload Another
          </button>
        </div>
      ` + currentVideos.map(video => `
        <div class="user-bookmark-card" data-video-id="${video.id}">
          <div class="user-bm-thumb-wrap">
            <img src="${video.thumb}" alt="${escapeHtml(video.title)}" class="user-bm-thumb" onerror="this.src='https://ubyfoaiklfqdktqmunuo.supabase.co/storage/v1/object/public/pdfs/yt_thumb_1.jpg'">
          </div>
          <div class="user-bm-content">
            <h4 class="user-bm-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h4>
            <div class="user-bm-actions">
              <button type="button" class="btn-bm-view" data-video-id="${video.id}">
                <i class="fa-solid fa-folder-open"></i> Resources (${(video.resources || []).length})
              </button>
              <button type="button" class="btn-bm-remove" data-video-id="${video.id}" title="Delete Video from Shelf & Cloud" aria-label="Delete Video from Shelf and Cloud">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');

      const addMoreBtn = document.getElementById('btnAdminAddMoreVideos');
      if (addMoreBtn) {
        addMoreBtn.addEventListener('click', () => {
          const addVideoTab = document.querySelector('.user-tab-btn[data-usertab="addvideo"]');
          if (addVideoTab) addVideoTab.click();
        });
      }
    } else {
      container.innerHTML = currentVideos.map(video => {
        const isBookmarked = currentUser && Array.isArray(currentUser.bookmarks) && currentUser.bookmarks.includes(video.id);
        return `
          <div class="user-bookmark-card" data-video-id="${video.id}">
            <div class="user-bm-thumb-wrap">
              <img src="${video.thumb}" alt="${escapeHtml(video.title)}" class="user-bm-thumb" onerror="this.src='https://ubyfoaiklfqdktqmunuo.supabase.co/storage/v1/object/public/pdfs/yt_thumb_1.jpg'">
              ${isBookmarked ? `<span style="position: absolute; top: 8px; right: 8px; background: rgba(99,102,241,0.9); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 6px;"><i class="fa-solid fa-bookmark"></i> Saved</span>` : ''}
            </div>
            <div class="user-bm-content">
              <h4 class="user-bm-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h4>
              <div class="user-bm-actions">
                <button type="button" class="btn-bm-view" data-video-id="${video.id}">
                  <i class="fa-solid fa-folder-open"></i> Resources (${(video.resources || []).length})
                </button>
                <button type="button" class="btn-bm-remove" data-video-id="${video.id}" title="${isBookmarked ? 'Remove from Saved' : 'Save to My Panel'}" aria-label="${isBookmarked ? 'Remove from Saved' : 'Save to My Panel'}" style="${isBookmarked ? 'background: #fee2e2; color: #dc2626;' : 'background: #eff6ff; color: #2563eb;'}">
                  <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    container.querySelectorAll('.btn-bm-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidId = btn.getAttribute('data-video-id');
        closeModal(userPanelModalOverlay);
        openVideoModalById(vidId);
      });
    });

    container.querySelectorAll('.btn-bm-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidId = btn.getAttribute('data-video-id');
        if (isCreator) {
          if (confirm('Delete this video from the website shelf and database?')) {
            deleteVideo(vidId);
          }
        } else {
          toggleBookmark(vidId);
        }
      });
    });
  }


  // --------------------------------------------------------------------------
  // Brand Sponsor Inquiries Dashboard (Synced with Supabase Cloud)
  // --------------------------------------------------------------------------
  async function loadSponsorInquiries() {
    const container = document.getElementById('inquiriesContainer');
    const countBadge = document.getElementById('userTabInquiriesCount');
    if (!container) return;

    if (!supabaseClient) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #64748b;">
          <i class="fa-solid fa-cloud-slash" style="font-size: 28px; color: #f59e0b; margin-bottom: 8px; display: block;"></i>
          <p>Supabase client not connected.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #64748b;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 26px; color: #f59e0b; margin-bottom: 10px; display: block;"></i>
        <p style="font-size: 13px; font-weight: 600;">Fetching live brand proposals from Supabase Cloud...</p>
      </div>
    `;

    try {
      const { data, error } = await supabaseClient
        .from('sponsor_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const inquiries = Array.isArray(data) ? data : [];
      if (countBadge) countBadge.textContent = inquiries.length;

      if (inquiries.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: #64748b;">
            <i class="fa-solid fa-envelope-open" style="font-size: 38px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
            <p style="font-weight: 700; font-size: 15px; margin-bottom: 6px; color: #334155;">No brand proposals received yet</p>
            <p style="font-size: 13px; color: #64748b; max-width: 440px; margin: 0 auto;">When partners submit the "Partner With Ahan Tech" form, their pitch is saved in Supabase and emailed directly to <strong>ahanghosh77@gmail.com</strong>.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = inquiries.map(inq => {
        const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent';
        const mailtoLink = `mailto:${encodeURIComponent(inq.contact_email)}?subject=${encodeURIComponent(`Re: Collaboration with Ahan Tech (${inq.brand_name})`)}`;
        return `
          <div class="inquiry-card">
            <div class="inquiry-top">
              <span class="inquiry-brand"><i class="fa-solid fa-building" style="color: #6366f1; margin-right: 6px;"></i>${escapeHtml(inq.brand_name)}</span>
              <span class="inquiry-format-badge">${escapeHtml(inq.sponsorship_format || 'Sponsorship')}</span>
            </div>
            <div class="inquiry-email-row">
              <i class="fa-solid fa-envelope" style="color: #64748b;"></i>
              <a href="${mailtoLink}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${escapeHtml(inq.contact_email)}</a>
            </div>
            ${inq.pitch ? `<div class="inquiry-pitch">${escapeHtml(inq.pitch)}</div>` : ''}
            <div class="inquiry-footer">
              <span><i class="fa-regular fa-clock"></i> ${dateStr}</span>
              <a href="${mailtoLink}" class="btn-inquiry-reply">
                <i class="fa-solid fa-reply"></i> Reply via Gmail
              </a>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      container.innerHTML = `
        <div style="text-align: center; padding: 25px; color: #ef4444;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
          <p>Unable to load proposals from Supabase.</p>
        </div>
      `;
    }
  }

  const btnRefreshInquiries = document.getElementById('btnRefreshInquiries');
  if (btnRefreshInquiries) {
    btnRefreshInquiries.addEventListener('click', () => {
      loadSponsorInquiries();
      showToast('Refreshed proposals from Supabase Cloud', 'rotate');
    });
  }

  // User Settings Update (password hashed with SHA-256)
  if (userSettingsForm) {
    userSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const nameEl = document.getElementById('settingDisplayName');
      const newName = nameEl ? nameEl.value.trim() : '';
      const newPass = document.getElementById('settingNewPassword')?.value;
      const confirmPass = document.getElementById('settingConfirmPassword')?.value;

      if (newName) {
        currentUser.name = newName;
      }
      const avatarEl = document.getElementById('settingAvatarUrl');
      if (avatarEl && avatarEl.value.trim()) {
        currentUser.avatarUrl = avatarEl.value.trim();
      }
      if (newPass) {
        if (newPass !== confirmPass) {
          showToast('New passwords do not match.', 'triangle-exclamation');
          return;
        }
        if (newPass.length < 4) {
          showToast('Password must be at least 4 characters.', 'triangle-exclamation');
          return;
        }
        currentUser.password = await hashPassword(newPass);
        showToast('Password updated successfully!', 'circle-check');
      } else {
        showToast('Settings updated successfully!', 'circle-check');
      }

      updateUserInStorage(currentUser);
      updateNavAuthUI();
      updateUserPanelHeader();
      const passField = document.getElementById('settingNewPassword');
      const confirmField = document.getElementById('settingConfirmPassword');
      if (passField) passField.value = '';
      if (confirmField) confirmField.value = '';
    });
  }

  if (closeUserPanelBtn) closeUserPanelBtn.addEventListener('click', () => closeModal(userPanelModalOverlay));
  if (userPanelLogoutBtn) userPanelLogoutBtn.addEventListener('click', handleLogout);
  if (userPanelModalOverlay) {
    userPanelModalOverlay.addEventListener('click', (e) => {
      if (e.target === userPanelModalOverlay) closeModal(userPanelModalOverlay);
    });
  }

  if (drawerUserLink) {
    drawerUserLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(drawerOverlay);
      openUserPanel();
    });
  }

  if (drawerAuthLink) {
    drawerAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(drawerOverlay);
      if (currentUser) {
        openUserPanel();
      } else {
        openAuthModal('signup');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Creator Studio: Private "Upload Video" Feature (Exclusive to Ahan Ghosh)
  // --------------------------------------------------------------------------
  const creatorAddVideoForm = document.getElementById('creatorAddVideoForm');
  const creatorYtUrlInput = document.getElementById('creatorYtUrl');
  const btnCreatorPaste = document.getElementById('btnCreatorPaste');
  const creatorPreviewBox = document.getElementById('creatorPreviewBox');
  const creatorPreviewThumb = document.getElementById('creatorPreviewThumb');
  const creatorPreviewTitle = document.getElementById('creatorPreviewTitle');
  const creatorVideoTitleInput = document.getElementById('creatorVideoTitle');

  function extractYouTubeId(urlOrId) {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch && shortsMatch[1]) {
      return shortsMatch[1];
    }
    return null;
  }

  let detectedVideoThumb = '';
  let activeAutoFetchAbort = null;

  function isValidVideoTitle(t) {
    if (!t || typeof t !== 'string') return false;
    const trimmed = t.trim();
    if (trimmed.length <= 3) return false;
    if (/^\d+[kKmMbB]?$/.test(trimmed)) return false; // Rejects count badges like "59K", "100K", "1M"
    if (/^(share|like|download|subscribe|remix|clip|save|thanks|views|subscribers)$/i.test(trimmed)) return false;
    return true;
  }

  function isValidVideoDescription(d) {
    if (!d || typeof d !== 'string') return false;
    const trimmed = d.trim();
    if (trimmed.length < 15) return false;
    if (trimmed.includes('Enjoy the videos and music you love, upload original content')) return false;
    return true;
  }

  async function fetchYouTubeAutoMetadata(videoId) {
    if (!videoId) return;

    if (activeAutoFetchAbort) {
      activeAutoFetchAbort.abort();
    }
    activeAutoFetchAbort = new AbortController();
    const { signal } = activeAutoFetchAbort;

    // Step 1: Immediate thumbnail preview
    const maxResUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const hqResUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    if (creatorPreviewThumb) {
      creatorPreviewThumb.src = hqResUrl;
    }
    detectedVideoThumb = hqResUrl;

    // Probe if maxresdefault exists
    const probeImg = new Image();
    probeImg.onload = () => {
      if (probeImg.naturalWidth && probeImg.naturalWidth > 120) {
        if (creatorPreviewThumb) creatorPreviewThumb.src = maxResUrl;
        detectedVideoThumb = maxResUrl;
      }
    };
    probeImg.src = maxResUrl;

    if (creatorPreviewTitle) {
      creatorPreviewTitle.textContent = '✨ Fetching video details from YouTube...';
    }
    if (creatorVideoTitleInput) {
      creatorVideoTitleInput.placeholder = 'Fetching title from YouTube...';
    }
    const descInput = document.getElementById('creatorVideoDesc');
    if (descInput) {
      descInput.placeholder = 'Fetching video description from YouTube...';
    }

    let fetchedTitle = '';
    let fetchedDesc = '';

    const applyTitle = (title) => {
      if (!isValidVideoTitle(title)) return;
      fetchedTitle = title.trim();
      if (creatorVideoTitleInput) {
        creatorVideoTitleInput.value = fetchedTitle;
        creatorVideoTitleInput.placeholder = 'e.g. Claude Code & GPT 5.6 Workflow';
      }
      if (creatorPreviewTitle) {
        creatorPreviewTitle.textContent = fetchedTitle;
      }
      const resTitleInput = document.getElementById('creatorResourceTitle');
      if (resTitleInput && (!resTitleInput.value || !resTitleInput.value.trim() || resTitleInput.value.includes('Developer'))) {
        resTitleInput.value = `${fetchedTitle.slice(0, 32)} Resources`;
      }
    };

    const applyDescription = (desc) => {
      if (!isValidVideoDescription(desc)) return;
      fetchedDesc = desc.trim();
      if (descInput) {
        descInput.value = fetchedDesc;
        descInput.placeholder = 'Explain what viewers learn, scripts used, and what files are included in this drop...';
      }
      const resUrlInput = document.getElementById('creatorResourceUrl');
      if (resUrlInput && (!resUrlInput.value || !resUrlInput.value.trim())) {
        const urlMatches = fetchedDesc.match(/https?:\/\/[^\s]+/g);
        if (urlMatches && urlMatches.length) {
          const candidate = urlMatches.find(u => !u.includes('youtube.com') && !u.includes('youtu.be'));
          if (candidate) {
            resUrlInput.value = candidate.replace(/[.,;)]+$/, '');
          }
        }
      }
    };

    // Engine 1: Instant Client-Side Noembed oEmbed (Fast ~30ms direct title lookup)
    const noembedPromise = fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, { signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && isValidVideoTitle(data.title)) {
          applyTitle(data.title);
          console.log('⚡ YouTube title detected via oEmbed:', data.title);
        }
      })
      .catch(() => {});

    // Engine 2: Supabase Edge Function (Server-side YouTube oEmbed + Scraper)
    const edgePromise = (async () => {
      try {
        const edgeUrl = `https://ubyfoaiklfqdktqmunuo.supabase.co/functions/v1/youtube-meta?videoId=${encodeURIComponent(videoId)}`;
        const res = await fetch(edgeUrl, { signal });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            if (isValidVideoTitle(data.title)) {
              applyTitle(data.title);
            }
            if (isValidVideoDescription(data.description)) {
              applyDescription(data.description);
            }
            if (data.thumbnail) {
              detectedVideoThumb = data.thumbnail;
              if (creatorPreviewThumb) creatorPreviewThumb.src = data.thumbnail;
            }
            console.log('⚡ YouTube metadata synced via Supabase Edge Function:', data.title);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Edge Function fetch warning:', err);
        }
      }
    })();

    // Wait for both engines to complete
    await Promise.allSettled([noembedPromise, edgePromise]);

    // Fallback: If description wasn't provided, generate informative developer summary
    if (!fetchedDesc && fetchedTitle) {
      applyDescription(`Tutorial & developer resources for ${fetchedTitle}. Includes code scripts, setup configs, and Alpha 2026 free community resources.`);
    }

    if (fetchedTitle) {
      showToast(`✨ Auto-detected: "${fetchedTitle.slice(0, 32)}..."`, 'circle-check');
    } else {
      if (creatorPreviewTitle) creatorPreviewTitle.textContent = 'Preview Video';
      if (creatorVideoTitleInput) creatorVideoTitleInput.placeholder = 'Enter video title';
    }
  }

  function updateCreatorPreview(val) {
    const videoId = extractYouTubeId(val);
    if (videoId) {
      if (creatorPreviewBox) creatorPreviewBox.style.display = 'flex';
      fetchYouTubeAutoMetadata(videoId);
    } else {
      if (creatorPreviewBox) creatorPreviewBox.style.display = 'none';
      detectedVideoThumb = '';
    }
  }

  if (creatorYtUrlInput) {
    creatorYtUrlInput.addEventListener('input', (e) => {
      updateCreatorPreview(e.target.value);
    });
    creatorYtUrlInput.addEventListener('paste', (e) => {
      const pastedData = e.clipboardData ? e.clipboardData.getData('text') : '';
      if (pastedData) {
        setTimeout(() => updateCreatorPreview(pastedData), 40);
      } else {
        setTimeout(() => updateCreatorPreview(creatorYtUrlInput.value), 100);
      }
    });
  }

  if (creatorVideoTitleInput) {
    creatorVideoTitleInput.addEventListener('input', (e) => {
      if (creatorPreviewTitle && e.target.value.trim()) {
        creatorPreviewTitle.textContent = e.target.value.trim();
      }
    });
  }

  if (btnCreatorPaste) {
    btnCreatorPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && creatorYtUrlInput) {
          creatorYtUrlInput.value = text.trim();
          updateCreatorPreview(text.trim());
          showToast('Pasted link from clipboard', 'link');
        }
      } catch (err) {
        if (creatorYtUrlInput) {
          creatorYtUrlInput.focus();
        }
        showToast('Please press Ctrl+V to paste YouTube link', 'info');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Creator Studio: Attached Link & Video Submission Handling
  // --------------------------------------------------------------------------
  const creatorResourceTitleInput = document.getElementById('creatorResourceTitle');
  const creatorResourceUrlInput = document.getElementById('creatorResourceUrl');
  const creatorTelegramLinkInput = document.getElementById('creatorTelegramLink');

  // Creator Video PDF Attachment Controls
  const btnAttachVideoPdf = document.getElementById('btnAttachVideoPdf');
  const creatorVideoPdfInput = document.getElementById('creatorVideoPdfInput');
  const btnAttachPdfLabel = document.getElementById('btnAttachPdfLabel');
  const attachedVideoPdfChip = document.getElementById('attachedVideoPdfChip');
  const attachedVideoPdfName = document.getElementById('attachedVideoPdfName');
  const attachedVideoPdfSize = document.getElementById('attachedVideoPdfSize');
  const btnRemoveVideoPdf = document.getElementById('btnRemoveVideoPdf');

  let attachedVideoPdfFile = null;
  let attachedVideoPdfDataUrl = '';

  function resetAttachedVideoPdf() {
    attachedVideoPdfFile = null;
    attachedVideoPdfDataUrl = '';
    if (creatorVideoPdfInput) creatorVideoPdfInput.value = '';
    if (attachedVideoPdfChip) attachedVideoPdfChip.style.display = 'none';
    if (btnAttachPdfLabel) btnAttachPdfLabel.textContent = 'Attach PDF Document (Optional)';
  }

  if (btnAttachVideoPdf && creatorVideoPdfInput) {
    btnAttachVideoPdf.addEventListener('click', () => {
      creatorVideoPdfInput.click();
    });
  }

  if (creatorVideoPdfInput) {
    creatorVideoPdfInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          showToast('Please select a valid PDF file (.pdf)', 'triangle-exclamation');
          return;
        }
        attachedVideoPdfFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          attachedVideoPdfDataUrl = ev.target.result;
        };
        reader.readAsDataURL(file);

        if (attachedVideoPdfName) attachedVideoPdfName.textContent = file.name;
        if (attachedVideoPdfSize) {
          const sz = Math.round(file.size / 1024);
          attachedVideoPdfSize.textContent = sz > 1024 ? `(${(sz / 1024).toFixed(1)} MB)` : `(${sz} KB)`;
        }
        if (attachedVideoPdfChip) attachedVideoPdfChip.style.display = 'inline-flex';
        if (btnAttachPdfLabel) btnAttachPdfLabel.textContent = 'Change Attached PDF';
      }
    });
  }

  if (btnRemoveVideoPdf) {
    btnRemoveVideoPdf.addEventListener('click', (e) => {
      e.stopPropagation();
      resetAttachedVideoPdf();
    });
  }

  if (creatorAddVideoForm) {
    creatorAddVideoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!isUserAdmin(currentUser)) {
        showToast('Access denied: Only ahanghosh77@gmail.com can upload videos.', 'error');
        return;
      }

      const rawUrl = creatorYtUrlInput ? creatorYtUrlInput.value.trim() : '';
      const videoId = extractYouTubeId(rawUrl);
      const title = creatorVideoTitleInput ? creatorVideoTitleInput.value.trim() : '';
      const category = document.getElementById('creatorVideoCategory')?.value || 'claude gpt free';
      const desc = document.getElementById('creatorVideoDesc')?.value.trim() || '';
      const tgLink = creatorTelegramLinkInput?.value?.trim() || 'https://t.me/alpha2026start';

      if (!title) {
        showToast('Please enter a video title', 'error');
        return;
      }

      const customLinkTitle = creatorResourceTitleInput?.value?.trim() || `${title.slice(0, 30)} Resources`;
      const customLinkUrl = creatorResourceUrlInput?.value?.trim() || '';

      const thumbUrl = detectedVideoThumb || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://ubyfoaiklfqdktqmunuo.supabase.co/storage/v1/object/public/pdfs/hero_characters.jpg');
      const cleanUrl = videoId ? `https://youtube.com/watch?v=${videoId}` : (rawUrl.startsWith('http') ? rawUrl : 'https://youtube.com/@ahantech');

      const videoResources = [];

      // If an authentic PDF file was attached, upload it to Supabase Storage and include it
      if (attachedVideoPdfFile) {
        showToast('Uploading attached PDF guide to Cloud Vault...', 'cloud-arrow-up');
        let pdfPublicUrl = '';
        try {
          const uploadRes = await uploadPdfToSupabase(attachedVideoPdfFile, attachedVideoPdfFile.name);
          pdfPublicUrl = uploadRes.publicUrl;
        } catch (err) {
          console.warn('Attached PDF storage upload error:', err);
        }

        const pdfName = `${title} — Official PDF Guide`;
        videoResources.push({
          name: pdfName,
          type: 'pdf',
          ext: 'PDF',
          icon: 'file-pdf',
          file: pdfPublicUrl || attachedVideoPdfFile.name,
          dataUrl: attachedVideoPdfDataUrl
        });

        // Also add to Admin's personal vault for immediate re-download
        if (currentUser) {
          if (!Array.isArray(currentUser.downloadedPdfs)) currentUser.downloadedPdfs = [];
          currentUser.downloadedPdfs.unshift({
            name: pdfName,
            file: attachedVideoPdfFile.name,
            date: 'Just now',
            dataUrl: attachedVideoPdfDataUrl,
            publicUrl: pdfPublicUrl
          });
          updateUserInStorage(currentUser);
          updateUserPanelHeader();
        }
      }

      if (customLinkUrl) {
        videoResources.push({
          name: customLinkTitle,
          type: 'link',
          ext: 'LINK',
          icon: 'link',
          url: customLinkUrl,
          file: customLinkUrl
        });
      } else {
        videoResources.push({
          name: customLinkTitle,
          type: 'link',
          ext: 'LINK',
          icon: 'link',
          url: tgLink,
          file: tgLink
        });
      }

      videoResources.push({
        name: 'Alpha 2026 VIP Telegram',
        type: 'link',
        ext: 'LINK',
        icon: 'telegram',
        url: tgLink,
        file: tgLink
      });

      const newVideo = {
        id: 'v_' + Date.now(),
        title: title,
        thumb: thumbUrl,
        desc: desc || `Tutorial & developer resources for ${title}. Includes Alpha 2026 free setup guide.`,
        duration: 'HD Video',
        views: 'New • Just now',
        author: 'Ahan Tech',
        category: category,
        url: cleanUrl,
        resources: videoResources
      };

      // Add to beginning of catalog
      currentVideos.unshift(newVideo);
      saveVideosToStorage();
      renderVideos();

      // Realtime Cloud Sync to Supabase PostgreSQL Database
      if (supabaseClient) {
        supabaseClient.from('videos').upsert({
          id: newVideo.id,
          title: newVideo.title,
          thumb: newVideo.thumb,
          description: newVideo.desc,
          duration: newVideo.duration,
          views: newVideo.views,
          author: newVideo.author,
          category: newVideo.category,
          url: newVideo.url,
          resources: newVideo.resources
        }).then(({ error }) => {
          if (!error) console.log('⚡ Video synced to Supabase Cloud Database');
        }).catch(err => console.warn('Supabase sync warning:', err));
      }

      // Reset form, attached PDF, and preview
      creatorAddVideoForm.reset();
      resetAttachedVideoPdf();
      detectedVideoThumb = '';
      if (creatorPreviewBox) creatorPreviewBox.style.display = 'none';

      // Update user panel state immediately
      updateUserPanelHeader();
      renderUserBookmarks();

      // Switch to My Videos tab on the user panel so admin immediately sees the added video!
      const bookmarksTabBtn = document.querySelector('.user-tab-btn[data-usertab="bookmarks"]');
      if (bookmarksTabBtn) {
        bookmarksTabBtn.click();
      }

      showToast(`🎉 "${title.slice(0, 35)}..." published and showing on your User Panel!`, 'circle-check');
    });
  }

  // Bookmark Toggle Function
  function toggleBookmark(videoId) {
    if (!currentUser) {
      openAuthModal('login');
      showToast('Sign in to save videos to your User Panel!', 'bookmark');
      return;
    }

    if (!Array.isArray(currentUser.bookmarks)) {
      currentUser.bookmarks = [];
    }

    const idx = currentUser.bookmarks.indexOf(videoId);
    if (idx > -1) {
      currentUser.bookmarks.splice(idx, 1);
      showToast('Removed from Saved Videos', 'bookmark');
    } else {
      currentUser.bookmarks.push(videoId);
      showToast('Saved video to your User Panel!', 'bookmark');
    }

    updateUserInStorage(currentUser);
    renderVideos();
    renderUserBookmarks();
    updateUserPanelHeader();
  }

  // --------------------------------------------------------------------------
  // Modal Utilities
  // --------------------------------------------------------------------------
  function openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('open');
    if (modal === videoModalOverlay && videoModalIframe) {
      videoModalIframe.src = '';
    }
    document.body.style.overflow = '';
  }

  function closeAuthModal() {
    closeModal(authModalOverlay);
  }

  // Collaboration / Sponsorship Modal
  if (collabBtn) {
    collabBtn.addEventListener('click', () => {
      if (!requireAuth('submit collaboration and sponsorship proposals', 'login')) return;
      openModal(collabModalOverlay);
    });
  }
  if (drawerCollabLink) {
    drawerCollabLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(drawerOverlay);
      if (!requireAuth('submit collaboration and sponsorship proposals', 'login')) return;
      openModal(collabModalOverlay);
    });
  }
  if (closeCollabModalBtn) closeCollabModalBtn.addEventListener('click', () => closeModal(collabModalOverlay));
  if (collabModalOverlay) {
    collabModalOverlay.addEventListener('click', (e) => {
      if (e.target === collabModalOverlay) closeModal(collabModalOverlay);
    });
  }


  if (collabForm) {
    collabForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const brandInput = document.getElementById('brandName');
      const emailInput = document.getElementById('contactEmail');
      const typeSelect = document.getElementById('collabType');
      const pitchInput = document.getElementById('collabPitch');

      const brand = brandInput ? brandInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const formatVal = typeSelect ? typeSelect.value : '';
      const format = (typeSelect && typeSelect.selectedIndex >= 0 && typeSelect.value) ? typeSelect.options[typeSelect.selectedIndex].text : '';
      const pitch = pitchInput ? pitchInput.value.trim() : '';

      if (!brand || brand.length < 2) {
        showToast('Please enter your Brand or Product Name', 'triangle-exclamation');
        if (brandInput) brandInput.focus();
        return;
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        showToast('Please enter a valid Business Contact Email', 'triangle-exclamation');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!formatVal || !format) {
        showToast('Please select a Sponsorship Format from the dropdown', 'triangle-exclamation');
        if (typeSelect) typeSelect.focus();
        return;
      }

      if (!pitch || pitch.length < 3) {
        showToast('Please fill in your Campaign Pitch & Details', 'triangle-exclamation');
        if (pitchInput) pitchInput.focus();
        return;
      }

      // 1. Prepare exact Gmail New Message Compose URL with prefilled recipient, subject, and proposal body
      const mailSubject = `🚀 Brand Sponsorship Proposal: ${brand} (@ahantech)`;
      const mailBody = 
`Hello Ahan Tech Team,

We would like to partner with Ahan Tech (@ahantech).

🏢 Brand / Product Name: ${brand}
✉️ Business Contact Email: ${email}
🎬 Sponsorship Format: ${format}

📝 Campaign Pitch & Details:
${pitch || 'Looking forward to collaborating with your channel!'}

---
Submitted via Ahan Tech Creator Website
Date: ${new Date().toLocaleString()}`;

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=ahanghosh77@gmail.com&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      const mailtoFallback = `mailto:ahanghosh77@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

      // 2. Open Gmail New Message Compose window directly
      const composeWin = window.open(gmailComposeUrl, '_blank');
      if (!composeWin || composeWin.closed || typeof composeWin.closed === 'undefined') {
        window.location.href = mailtoFallback;
      }

      // 3. Save to Supabase Cloud PostgreSQL Database in background
      if (supabaseClient) {
        supabaseClient.from('sponsor_inquiries').insert([{
          brand_name: brand,
          contact_email: email,
          sponsorship_format: format,
          pitch: pitch || 'No additional pitch details provided.',
          status: 'new'
        }]).then(() => {
          console.log('⚡ Proposal stored in Supabase Cloud');
          loadSponsorInquiries();
        }).catch(err => console.warn('Supabase inquiry notice:', err));
      }

      // 4. Background ping to FormSubmit token (no UI blocking)
      try {
        fetch('https://formsubmit.co/ajax/092b503811331ada4a30b1f06ef5d5a5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: mailSubject,
            'Brand Name': brand,
            'Email': email,
            'Format': format,
            'Pitch': pitch || 'N/A'
          })
        }).catch(() => {});
      } catch (err) {}

      // 5. Show success modal with confirmation details
      const successBrandEl = document.getElementById('successBrandName');
      const successFormatEl = document.getElementById('successFormat');
      const successPitchEl = document.getElementById('successPitchPreview');
      const btnOpenGmailDirect = document.getElementById('btnOpenGmailDirect');
      const collabSuccessModalEl = document.getElementById('collabSuccessModal');

      if (successBrandEl) successBrandEl.textContent = brand;
      if (successFormatEl) successFormatEl.textContent = format;
      if (successPitchEl) successPitchEl.textContent = `"${pitch.slice(0, 120)}${pitch.length > 120 ? '...' : ''}"`;
      if (btnOpenGmailDirect) btnOpenGmailDirect.href = gmailComposeUrl;

      closeModal(collabModalOverlay);
      collabForm.reset();

      if (collabSuccessModalEl) {
        openModal(collabSuccessModalEl);
      }

      showToast('Proposal recorded! Gmail compose window opening...', 'envelope-open');
    });
  }

  // Collab Success Modal Close Handlers
  const collabSuccessModal = document.getElementById('collabSuccessModal');
  const btnCloseSuccessModal = document.getElementById('btnCloseSuccessModal');
  if (btnCloseSuccessModal) {
    btnCloseSuccessModal.addEventListener('click', () => closeModal(collabSuccessModal));
  }
  if (collabSuccessModal) {
    collabSuccessModal.addEventListener('click', (e) => {
      if (e.target === collabSuccessModal) closeModal(collabSuccessModal);
    });
  }

  // Video Preview Modal Close Handlers
  if (closeVideoModalBtn) closeVideoModalBtn.addEventListener('click', () => closeModal(videoModalOverlay));
  if (videoModalOverlay) {
    videoModalOverlay.addEventListener('click', (e) => {
      if (e.target === videoModalOverlay) closeModal(videoModalOverlay);
    });

    const modalVideoPlay = videoModalOverlay.querySelector('.video-play-center');
    if (modalVideoPlay) {
      modalVideoPlay.addEventListener('click', (e) => {
        if (!requireAuth('watch tutorial videos', 'signup')) {
          e.preventDefault();
          closeModal(videoModalOverlay);
        }
      });
    }

    const modalYtExternal = videoModalOverlay.querySelector('.btn-yt-external');
    if (modalYtExternal) {
      modalYtExternal.addEventListener('click', (e) => {
        if (!requireAuth('watch on Ahan Tech YouTube channel', 'signup')) {
          e.preventDefault();
          closeModal(videoModalOverlay);
        }
      });
    }
  }

  // Channel Drawer Controls
  if (gridMenuBtn) gridMenuBtn.addEventListener('click', () => openModal(drawerOverlay));
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => closeModal(drawerOverlay));
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeModal(drawerOverlay);
    });
  }

  // Modal Download PDF Guide Button
  if (downloadModalAssetsBtn) {
    downloadModalAssetsBtn.addEventListener('click', () => {
      if (!requireAuth('download PDF developer guides', 'signup')) {
        closeModal(videoModalOverlay);
        return;
      }
      const activeVideoId = downloadModalAssetsBtn.getAttribute('data-video-id');
      const video = currentVideos.find(v => v.id === activeVideoId);
      const pdfRes = (video && video.resources) ? video.resources.find(r => r.type === 'pdf') : null;

      if (pdfRes && pdfRes.dataUrl && pdfRes.dataUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = pdfRes.dataUrl;
        a.download = pdfRes.name || pdfRes.file || 'Developer-Guide.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (pdfRes && pdfRes.file && pdfRes.file.startsWith('http')) {
        const downloadFilename = pdfRes.name.endsWith('.pdf') ? pdfRes.name : `${pdfRes.name}.pdf`;
        fetch(pdfRes.file)
          .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.blob();
          })
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadFilename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast(`Downloaded ${pdfRes.name}!`, 'file-pdf');
          })
          .catch(() => {
            const a = document.createElement('a');
            a.href = pdfRes.file;
            a.download = downloadFilename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast(`Downloading ${pdfRes.name}!`, 'file-pdf');
          });
      } else {
        const pdfName = pdfRes ? (pdfRes.name || pdfRes.file) : `${(video ? video.title.slice(0, 24) : 'AhanTech')}-Guide.pdf`;
        const mockContent = `%PDF-1.4\n%AHAN-TECH-OFFICIAL-GUIDE\n1 0 obj << /Title (${pdfName}) /Author (Ahan Tech @ahantech) /Community (https://t.me/alpha2026start) >> endobj\ntrailer << /Root 1 0 R >> %%EOF`;
        const blob = new Blob([mockContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfName.endsWith('.pdf') ? pdfName : `${pdfName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast(`Downloaded PDF: ${pdfName}`, 'file-pdf');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Dynamic Video Rendering Engine
  // --------------------------------------------------------------------------
  function renderVideos() {
    if (!videoShelfContainer) return;

    if (videoTotalCount) {
      videoTotalCount.textContent = currentVideos.length;
    }

    const q = (currentSearchQuery || '').trim().toLowerCase();
    const shelfNotice = document.getElementById('shelfSearchNotice');
    const shelfQueryText = document.getElementById('shelfSearchQueryText');
    const shelfCountEl = document.getElementById('shelfSearchCount');

    const filtered = currentVideos.filter(video => {
      const matchesFilter = currentFilter === 'all' || (video.category || '').toLowerCase().includes(currentFilter.toLowerCase());
      if (!q) return matchesFilter;

      const inTitle = (video.title || '').toLowerCase().includes(q);
      const inDesc = (video.desc || '').toLowerCase().includes(q);
      const inCat = (video.category || '').toLowerCase().includes(q);
      const inRes = Array.isArray(video.resources) && video.resources.some(r => (r.name || '').toLowerCase().includes(q));
      return matchesFilter && (inTitle || inDesc || inCat || inRes);
    });

    if (shelfNotice && shelfQueryText && shelfCountEl) {
      if (q) {
        shelfNotice.style.display = 'flex';
        shelfQueryText.textContent = currentSearchQuery;
        shelfCountEl.textContent = filtered.length;
      } else {
        shelfNotice.style.display = 'none';
      }
    }

    if (currentVideos.length === 0) {
      const isCreator = isUserAdmin(currentUser);
      videoShelfContainer.innerHTML = `
        <div class="empty-shelf-banner" style="grid-column: 1/-1; width: 100%; text-align: center; padding: 48px 24px; background: rgba(255,255,255,0.03); border: 2px dashed rgba(255,255,255,0.15); border-radius: 20px; margin: 20px 0;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #818cf8; font-size: 26px;">
            <i class="fa-solid fa-film"></i>
          </div>
          <h3 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 8px;">No Videos Published Yet</h3>
          <p style="font-size: 14px; color: #94a3b8; max-width: 480px; margin: 0 auto 20px; line-height: 1.6;">
            ${isCreator 
              ? 'Welcome, Ahan! As the admin, use Creator Studio to upload your first YouTube video with title auto-detection, PDF attachments, and developer links.' 
              : 'Our tutorial library is currently being refreshed. Subscribe to the channel or join Alpha 2026 VIP to get notified the second fresh videos drop!'}
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            ${isCreator ? `
              <button type="button" class="btn-input-action" id="btnShelfUploadFirst" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 12px 24px; font-size: 14px; font-weight: 700; border-radius: 12px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(99,102,241,0.4);">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Video in Creator Studio
              </button>
            ` : `
              <a href="https://t.me/alpha2026start" target="_blank" rel="noopener" class="btn-input-action" style="background: #229ED9; color: #fff; padding: 12px 24px; font-size: 14px; font-weight: 700; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <i class="fa-brands fa-telegram"></i> Join Telegram VIP
              </a>
              <a href="https://youtube.com/@ahantech?si=lUA9TFK3VSPFafw8" target="_blank" rel="noopener" class="btn-input-action" style="background: #ff0000; color: #fff; padding: 12px 24px; font-size: 14px; font-weight: 700; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <i class="fa-brands fa-youtube"></i> Visit Channel
              </a>
            `}
          </div>
        </div>
      `;
      const uploadFirstBtn = document.getElementById('btnShelfUploadFirst');
      if (uploadFirstBtn) {
        uploadFirstBtn.addEventListener('click', () => {
          openUserPanel();
          const addVideoTab = document.querySelector('.user-tab-btn[data-usertab="addvideo"]');
          if (addVideoTab) addVideoTab.click();
        });
      }
      return;
    }

    if (filtered.length === 0) {
      videoShelfContainer.innerHTML = `
        <div style="padding: 40px; text-align: center; width: 100%; color: #64748b; font-family: var(--font-sans); font-size: 15px;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 32px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
          ${q ? `No videos matching "<strong>${escapeHtml(currentSearchQuery)}</strong>" in this category.` : 'No videos found in this category. Try selecting another filter above!'}
          <div style="margin-top: 14px;">
            <button type="button" class="btn-clear-shelf-search" id="btnResetShelfFilter" style="margin: 0 auto; display: inline-flex;">
              <i class="fa-solid fa-rotate-left"></i> Clear Search Filter
            </button>
          </div>
        </div>
      `;
      const btnReset = document.getElementById('btnResetShelfFilter');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          currentSearchQuery = '';
          currentFilter = 'all';
          if (searchInput) searchInput.value = '';
          document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-filter') === 'all'));
          renderVideos();
        });
      }
      return;
    }

    videoShelfContainer.innerHTML = filtered.map((video) => {
      const resList = video.resources || [];
      const resCount = resList.length;
      const pdfCount = resList.filter(r => r.type === 'pdf' || (r.file && r.file.toLowerCase().endsWith('.pdf'))).length;
      const linkCount = resList.filter(r => r.type === 'link' || (!r.type && !r.file?.toLowerCase().endsWith('.pdf'))).length;
      const isBookmarked = currentUser && Array.isArray(currentUser.bookmarks) && currentUser.bookmarks.includes(video.id);

      return `
        <article class="yt-shelf-card" data-category="${video.category || ''}" data-video-id="${video.id}">
          <div class="yt-thumb-box">
            <img src="${video.thumb}" alt="${escapeHtml(video.title)}" class="yt-thumb-img" loading="lazy" decoding="async" onerror="this.src='https://ubyfoaiklfqdktqmunuo.supabase.co/storage/v1/object/public/pdfs/yt_thumb_1.jpg'">
            <span class="yt-time-badge">${video.duration || '5:00'}</span>
            <button type="button" class="btn-card-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-video-id="${video.id}" title="${isBookmarked ? 'Remove from Saved' : 'Save to My User Panel'}" aria-label="${isBookmarked ? 'Remove from Saved' : 'Save to My User Panel'}">
              <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>
            <button class="yt-play-hover-btn" title="Watch & Preview Resources" aria-label="Watch video: ${escapeHtml(video.title)}">
              <i class="fa-solid fa-play"></i>
            </button>
          </div>
          <div class="yt-card-info">
            <h3 class="yt-video-heading" title="${escapeHtml(video.title)}">
              ${escapeHtml(video.title)}
            </h3>
            <div class="yt-card-meta">
              <span class="yt-creator-name">${video.author || 'Ahan Tech'} <i class="fa-solid fa-circle-check verified-icon"></i></span>
              <span class="yt-stats-line">${video.views || 'Recent Upload'}</span>
            </div>
            ${resCount > 0 ? `
              <div class="card-resource-tags">
                ${pdfCount > 0 ? `<span class="card-res-chip chip-pdf" title="${pdfCount} PDF Guide(s)"><i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> ${pdfCount} PDF</span>` : ''}
                ${linkCount > 0 ? `<span class="card-res-chip chip-link" title="${linkCount} Direct Link(s)"><i class="fa-solid fa-link" style="color: #3b82f6;"></i> ${linkCount} Link</span>` : ''}
              </div>
            ` : ''}
            <button class="btn-view-resources">
              <i class="fa-solid fa-folder-open"></i>
              <span>View Resources (${resCount})</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Attach bookmark click handlers
    videoShelfContainer.querySelectorAll('.btn-card-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!requireAuth('save videos to your personal vault', 'login')) return;
        const vidId = btn.getAttribute('data-video-id');
        toggleBookmark(vidId);
      });
    });

    // Attach card click handlers
    videoShelfContainer.querySelectorAll('.yt-shelf-card').forEach(card => {
      card.addEventListener('click', () => {
        const vidId = card.getAttribute('data-video-id');
        if (!requireAuth('watch tutorial videos and access developer files', 'signup')) {
          return;
        }
        openVideoModalById(vidId);
      });
    });
  }

  function openVideoModalById(id) {
    if (!requireAuth('watch tutorial videos and access developer files', 'signup')) {
      return;
    }
    const video = currentVideos.find(v => v.id === id);
    if (!video) return;

    if (videoModalTitle) videoModalTitle.textContent = video.title;

    // Embed and autoplay the YouTube stream in the real iframe player
    if (videoModalIframe) {
      let ytId = '';
      if (typeof extractYouTubeId === 'function') {
        ytId = extractYouTubeId(video.url || '') || extractYouTubeId(video.thumb || '') || extractYouTubeId(video.id || '');
      }
      if (ytId) {
        videoModalIframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
      } else if (video.url && video.url.includes('youtube.com')) {
        videoModalIframe.src = video.url;
      } else {
        videoModalIframe.src = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
      }
    }

    if (downloadModalAssetsBtn) {
      downloadModalAssetsBtn.setAttribute('data-video-id', video.id);
      downloadModalAssetsBtn.innerHTML = `<i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> <span>Download PDF Guide</span>`;
    }

    // Video Description Box
    if (modalVideoDescBox) {
      if (video.desc) {
        modalVideoDescBox.innerHTML = `<i class="fa-solid fa-align-left" style="color: var(--color-primary-purple); margin-right: 6px;"></i> ${escapeHtml(video.desc)}`;
        modalVideoDescBox.style.display = 'block';
      } else {
        modalVideoDescBox.style.display = 'none';
      }
    }

    // Resources List (PDF and Link Only)
    const modalResourcesList = document.getElementById('modalResourcesList');
    if (modalResourcesList) {
      const resItems = video.resources || [];
      if (resItems.length === 0) {
        modalResourcesList.innerHTML = `
          <h4 class="modal-res-heading"><i class="fa-solid fa-folder-open"></i> Resources for this Video (PDF & Links):</h4>
          <p style="font-size: 13px; color: #64748b; margin: 6px 0;">No PDF documents or links attached to this video yet.</p>
        `;
      } else {
        modalResourcesList.innerHTML = `
          <h4 class="modal-res-heading"><i class="fa-solid fa-folder-open"></i> Resources for this Video (PDF & Links):</h4>
          <div class="modal-res-grid">
            ${resItems.map(res => {
              const isPdf = res.type === 'pdf' || (res.file && res.file.toLowerCase().endsWith('.pdf')) || res.ext === 'PDF';
              if (isPdf) {
                return `
                  <div class="res-download-pill-item item-pdf">
                    <div class="res-pill-meta">
                      <i class="fa-solid fa-file-pdf" style="color: #ef4444; font-size: 16px;"></i>
                      <span class="res-pill-title" title="${escapeHtml(res.name)}">${escapeHtml(res.name)}</span>
                      <span class="res-pill-badge-pdf">PDF</span>
                    </div>
                    <button class="btn-res-download btn-pdf-download" data-type="pdf" data-name="${escapeHtml(res.name)}" data-file="${escapeHtml(res.file || res.name + '.pdf')}" data-src="${res.dataUrl || ''}">
                      <i class="fa-solid fa-download"></i>
                      <span>Download PDF</span>
                    </button>
                  </div>
                `;
              } else {
                const linkUrl = res.url || res.file || 'https://t.me/alpha2026start';
                return `
                  <div class="res-download-pill-item item-link">
                    <div class="res-pill-meta">
                      <i class="fa-solid fa-arrow-up-right-from-square" style="color: #3b82f6; font-size: 15px;"></i>
                      <span class="res-pill-title" title="${escapeHtml(res.name)}">${escapeHtml(res.name)}</span>
                      <span class="res-pill-badge-link">LINK</span>
                    </div>
                    <a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener" class="btn-res-download btn-link-open">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Open Link</span>
                    </a>
                  </div>
                `;
              }
            }).join('')}
          </div>
        `;
        attachDownloadHandlers();
      }
    }

    const modalYtExternal = videoModalOverlay ? videoModalOverlay.querySelector('.btn-yt-external') : null;
    if (modalYtExternal && video.url) {
      modalYtExternal.href = video.url;
    }

    openModal(videoModalOverlay);
  }

  // --------------------------------------------------------------------------
  // Carousel Scrolling & View Mode Switcher
  // --------------------------------------------------------------------------
  if (carouselPrevBtn && videoShelfContainer) {
    carouselPrevBtn.addEventListener('click', () => {
      videoShelfContainer.scrollBy({ left: -280, behavior: 'smooth' });
    });
  }

  if (carouselNextBtn && videoShelfContainer) {
    carouselNextBtn.addEventListener('click', () => {
      videoShelfContainer.scrollBy({ left: 280, behavior: 'smooth' });
    });
  }

  if (viewShelfBtn && viewGridBtn && videoShelfContainer) {
    viewShelfBtn.addEventListener('click', () => {
      isGridView = false;
      viewShelfBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      videoShelfContainer.classList.remove('grid-mode');
      videoShelfContainer.classList.add('carousel-mode');
      if (carouselArrowGroup) carouselArrowGroup.style.display = 'flex';
      showToast('Switched to Horizontal Shelf View', 'film');
    });

    viewGridBtn.addEventListener('click', () => {
      isGridView = true;
      viewGridBtn.classList.add('active');
      viewShelfBtn.classList.remove('active');
      videoShelfContainer.classList.add('grid-mode');
      videoShelfContainer.classList.remove('carousel-mode');
      if (carouselArrowGroup) carouselArrowGroup.style.display = 'none';
      showToast(`Showing All ${currentVideos.length} Videos in Grid View`, 'grip');
    });
  }

  // --------------------------------------------------------------------------
  // Dynamic Category Folders Engine (Admin Studio)
  // --------------------------------------------------------------------------
  const CATEGORIES_STORAGE_KEY = 'ahantech_category_folders';
  const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'All Videos', filter: 'all', permanent: true },
    { id: 'claude', name: 'Claude Code', filter: 'claude' },
    { id: 'gpt', name: 'GPT & Astra', filter: 'gpt' },
    { id: 'deepseek', name: 'DeepSeek', filter: 'deepseek' },
    { id: 'free', name: '100% Free', filter: 'free' }
  ];

  function loadCategories() {
    try {
      const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse categories:', e);
    }
    return DEFAULT_CATEGORIES;
  }

  let categoryFolders = loadCategories();

  function saveCategories() {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoryFolders));
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  }

  function renderCategoryFilterTabs() {
    const container = document.getElementById('filterPillsBar');
    if (!container) return;

    container.innerHTML = categoryFolders.map(cat => `
      <button type="button" class="filter-tab ${currentFilter === cat.filter ? 'active' : ''}" data-filter="${escapeHtml(cat.filter)}">
        ${escapeHtml(cat.name)}
      </button>
    `).join('');

    container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter') || 'all';
        renderVideos();
      });
    });

    updateCreatorCategoryDropdown();
  }

  function updateCreatorCategoryDropdown() {
    const select = document.getElementById('creatorVideoCategory');
    if (!select) return;
    const nonPermanent = categoryFolders.filter(c => !c.permanent);
    select.innerHTML = nonPermanent.map(cat => `
      <option value="${escapeHtml(cat.filter)}">${escapeHtml(cat.name)}</option>
    `).join('');
  }

  function renderCategoryFoldersManager() {
    const list = document.getElementById('categoryFoldersList');
    const countBadge = document.getElementById('userTabCategoriesCount');
    if (countBadge) {
      countBadge.textContent = categoryFolders.filter(c => !c.permanent).length;
    }
    if (!list) return;

    list.innerHTML = categoryFolders.map(cat => {
      const isPermanent = !!cat.permanent;
      const count = cat.filter === 'all'
        ? currentVideos.length
        : currentVideos.filter(v => (v.category || '').toLowerCase().includes(cat.filter.toLowerCase())).length;

      return `
        <div class="category-folder-card" data-cat-id="${escapeHtml(cat.id)}">
          <div class="category-folder-left">
            <div class="category-folder-icon">
              <i class="fa-solid fa-folder${cat.filter === 'all' ? '' : '-open'}"></i>
            </div>
            <div class="category-folder-info">
              <div class="category-folder-name">${escapeHtml(cat.name)}</div>
              <div class="category-folder-meta">
                <span>${count} video${count === 1 ? '' : 's'}</span>
                ${isPermanent ? '<span class="category-perm-badge"><i class="fa-solid fa-lock"></i> Permanent Default</span>' : ''}
              </div>
            </div>
          </div>
          <div class="category-folder-actions">
            ${isPermanent ? '' : `
              <button type="button" class="btn-cat-action btn-cat-rename" data-id="${escapeHtml(cat.id)}" title="Rename folder">
                <i class="fa-solid fa-pen"></i>
                <span>Rename</span>
              </button>
              <button type="button" class="btn-cat-action btn-cat-delete" data-id="${escapeHtml(cat.id)}" title="Delete folder">
                <i class="fa-solid fa-trash-can"></i>
                <span>Delete</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach rename listeners
    list.querySelectorAll('.btn-cat-rename').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const cat = categoryFolders.find(c => c.id === id);
        if (!cat) return;
        const newName = prompt(`Enter new display name for folder "${cat.name}":`, cat.name);
        if (newName && newName.trim() && newName.trim() !== cat.name) {
          cat.name = newName.trim();
          saveCategories();
          renderCategoryFilterTabs();
          renderCategoryFoldersManager();
          showToast(`Renamed folder to "${cat.name}"!`, 'circle-check');
        }
      };
    });

    // Attach delete listeners
    list.querySelectorAll('.btn-cat-delete').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const cat = categoryFolders.find(c => c.id === id);
        if (!cat) return;
        if (confirm(`Are you sure you want to delete the folder "${cat.name}"?`)) {
          categoryFolders = categoryFolders.filter(c => c.id !== id);
          if (currentFilter === cat.filter) currentFilter = 'all';
          saveCategories();
          renderCategoryFilterTabs();
          renderCategoryFoldersManager();
          renderVideos();
          showToast(`Deleted folder "${cat.name}".`, 'trash-can');
        }
      };
    });
  }

  // Add Category Folder Form handler
  const addCategoryFolderForm = document.getElementById('addCategoryFolderForm');
  if (addCategoryFolderForm) {
    addCategoryFolderForm.onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById('newCategoryFolderInput');
      const name = (input ? input.value : '').trim();
      if (!name) return;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('cat-' + Date.now());
      categoryFolders.push({
        id: 'cat_' + Date.now(),
        name: name,
        filter: slug
      });
      saveCategories();
      if (input) input.value = '';
      renderCategoryFilterTabs();
      renderCategoryFoldersManager();
      showToast(`Added folder "${name}"!`, 'folder-plus');
    };
  }

  // Quick Manage Categories button on the shelf
  const btnManageCategories = document.getElementById('btnManageCategories');
  if (btnManageCategories) {
    btnManageCategories.addEventListener('click', () => {
      openUserPanel();
      const catTabBtn = document.getElementById('userTabCategoriesBtn');
      if (catTabBtn) catTabBtn.click();
    });
  }

  // Initial render of dynamic category tabs
  renderCategoryFilterTabs();

  // --------------------------------------------------------------------------
  // Download Handlers
  // --------------------------------------------------------------------------
  function attachDownloadHandlers() {
    // PDF Download Buttons
    document.querySelectorAll('.btn-pdf-download').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!requireAuth('download developer PDF files', 'signup')) {
          if (videoModalOverlay) closeModal(videoModalOverlay);
          return;
        }
        const resName = btn.getAttribute('data-name') || 'Tutorial-Guide';
        const fileTarget = btn.getAttribute('data-file') || `${resName}.pdf`;
        const dataSrc = btn.getAttribute('data-src') || '';

        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Downloaded!</span>';
        btn.style.background = '#10b981';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#ffffff';

        const finalFilename = fileTarget.toLowerCase().endsWith('.pdf') ? fileTarget : `${fileTarget}.pdf`;

        // Track PDF in user's vault
        if (currentUser) {
          if (!Array.isArray(currentUser.downloadedPdfs)) currentUser.downloadedPdfs = [];
          const alreadySaved = currentUser.downloadedPdfs.some(p => p.file === finalFilename || p.name === resName);
          if (!alreadySaved) {
            currentUser.downloadedPdfs.push({
              name: resName,
              file: finalFilename,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              dataUrl: dataSrc || ''
            });
            updateUserInStorage(currentUser);
            updateUserPanelHeader();
          }
        }

        if (dataSrc && dataSrc.startsWith('data:')) {
          // Download user-uploaded PDF file
          const a = document.createElement('a');
          a.href = dataSrc;
          a.download = finalFilename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast(`Downloaded uploaded PDF: ${finalFilename}!`, 'file-pdf');
        } else if (fileTarget && fileTarget.startsWith('http')) {
          fetch(fileTarget)
            .then(res => {
              if (!res.ok) throw new Error('Network error');
              return res.blob();
            })
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = finalFilename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              showToast(`Downloaded PDF: ${finalFilename}!`, 'file-pdf');
            })
            .catch(() => {
              const a = document.createElement('a');
              a.href = fileTarget;
              a.download = finalFilename;
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              a.remove();
              showToast(`Downloading PDF: ${finalFilename}!`, 'file-pdf');
            });
        } else {
          // Generate official Ahan Tech PDF blob
          const pdfContent = `%PDF-1.4\n%AHAN-TECH-OFFICIAL-GUIDE\n1 0 obj\n<< /Title (${finalFilename}) /Author (Ahan Tech @ahantech) /Community (https://t.me/alpha2026start) /Producer (Ahan Tech Developer Portal) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
          const blob = new Blob([pdfContent], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = finalFilename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          showToast(`Downloaded PDF: ${finalFilename}!`, 'file-pdf');
        }

        setTimeout(() => {
          btn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Download PDF</span>';
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2200);
      };
    });

    // Link Open Buttons
    document.querySelectorAll('.btn-link-open').forEach(link => {
      link.onclick = (e) => {
        if (!requireAuth('access external developer links and repositories', 'signup')) {
          e.preventDefault();
          e.stopPropagation();
          if (videoModalOverlay) closeModal(videoModalOverlay);
          return;
        }
        const destUrl = link.getAttribute('href');
        showToast(`Opening: ${destUrl ? destUrl.slice(0, 32) : 'Link'}...`, 'arrow-up-right-from-square');
      };
    });
  }

  // --------------------------------------------------------------------------
  // Intelligent Search Engine (Videos, PDFs, Channel Shortcuts & Keyboard Nav)
  // --------------------------------------------------------------------------
  let activeDropdownItems = [];
  let selectedDropdownIndex = -1;

  function highlightMatches(text, query) {
    if (!text) return '';
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${q})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function getSearchIndex() {
    const items = [];

    // Strictly index ONLY real videos currently present on the website (@ahantech)
    currentVideos.forEach(v => {
      // 1. Channel Video Item
      const ytId = (typeof extractYouTubeId === 'function') ? (extractYouTubeId(v.url || '') || extractYouTubeId(v.thumb || '')) : '';
      const thumbUrl = v.thumb && !v.thumb.includes('placeholder') && !v.thumb.includes('thumb_3d')
        ? v.thumb 
        : (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://ubyfoaiklfqdktqmunuo.supabase.co/storage/v1/object/public/pdfs/hero_characters.jpg');

      items.push({
        id: v.id,
        videoId: v.id,
        type: 'video',
        title: v.title,
        subtitle: `${v.category ? v.category.toUpperCase() : 'TUTORIAL'} • ${v.duration || 'HD Video'}`,
        desc: v.desc || '',
        category: v.category || '',
        thumb: thumbUrl,
        badge: 'WATCH VIDEO',
        badgeClass: 'tag-video',
        iconClass: 'icon-video',
        icon: 'fa-solid fa-play',
        action: () => openVideoModalById(v.id)
      });

      // 2. Real Attached Resources (PDFs & Guides strictly attached to this video)
      if (Array.isArray(v.resources)) {
        v.resources.forEach((r, rIdx) => {
          const isPdf = r.type === 'pdf' || (r.file && r.file.toLowerCase().endsWith('.pdf')) || r.ext === 'PDF';
          if (isPdf) {
            items.push({
              id: `pdf_${v.id}_${rIdx}`,
              videoId: v.id,
              type: 'pdf',
              title: r.name || 'PDF Developer Guide',
              subtitle: `Included with "${v.title.slice(0, 32)}${v.title.length > 32 ? '...' : ''}"`,
              desc: `${v.title} ${v.desc || ''}`,
              category: v.category || '',
              thumb: thumbUrl,
              badge: 'PDF GUIDE',
              badgeClass: 'tag-pdf',
              iconClass: 'icon-pdf',
              icon: 'fa-solid fa-file-pdf',
              action: () => {
                if (r.dataUrl) {
                  const a = document.createElement('a');
                  a.href = r.dataUrl;
                  a.download = r.name || 'guide.pdf';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  showToast(`Downloading: ${r.name}`, 'file-pdf');
                } else if (r.file && r.file.startsWith('http')) {
                  window.open(r.file, '_blank');
                } else {
                  openVideoModalById(v.id);
                }
              }
            });
          }
        });
      }
    });

    return items;
  }

  function renderDropdown(query) {
    if (!searchDropdown) return;
    const cleanQ = (query || '').trim().toLowerCase();
    const allItems = getSearchIndex();

    let itemsToShow = [];
    let isDefaultList = false;

    if (!cleanQ) {
      isDefaultList = true;
      // When empty or on focus: show all real channel videos on the website
      itemsToShow = allItems.filter(item => item.type === 'video').slice(0, 6);
    } else {
      // Smart token search across title, subtitle, desc, category
      const queryTokens = cleanQ.split(/\s+/).filter(Boolean);
      itemsToShow = allItems.filter(item => {
        const textToSearch = `${item.title || ''} ${item.subtitle || ''} ${item.desc || ''} ${item.category || ''}`.toLowerCase();
        return queryTokens.every(token => textToSearch.includes(token));
      }).slice(0, 8);
    }

    activeDropdownItems = itemsToShow;
    selectedDropdownIndex = -1;

    if (itemsToShow.length === 0) {
      if (allItems.length === 0) {
        searchDropdown.innerHTML = `
          <div class="search-dropdown-header">
            <span class="search-dropdown-title">
              <i class="fa-solid fa-film"></i> Channel Videos
            </span>
            <span class="search-dropdown-badge">0 Videos</span>
          </div>
          <div style="padding: 24px 16px; text-align: center; color: #64748b; font-size: 13px;">
            <i class="fa-solid fa-film" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
            <p style="font-weight: 600; color: #334155; margin-bottom: 4px;">No videos on website yet</p>
            <p style="font-size: 12px; color: #94a3b8;">New tutorials will appear here automatically when uploaded.</p>
          </div>
        `;
      } else {
        searchDropdown.innerHTML = `
          <div class="search-dropdown-header">
            <span class="search-dropdown-title">
              <i class="fa-solid fa-magnifying-glass"></i> Search Results
            </span>
            <span class="search-dropdown-badge">0 Matches</span>
          </div>
          <div style="padding: 24px 16px; text-align: center; color: #64748b; font-size: 13px;">
            <i class="fa-solid fa-film-slash" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
            <p style="font-weight: 600; color: #334155; margin-bottom: 4px;">No videos found matching "${escapeHtml(query)}"</p>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">Only videos published on this website are shown.<br>Try searching for "Azure", "Codex", or "Free API".</p>
          </div>
          <div class="search-dropdown-footer">
            <span>Press ESC to close</span>
            <div class="search-kbd-hints">
              <span class="search-kbd">ESC</span>
            </div>
          </div>
        `;
      }
      return;
    }

    const videoCount = allItems.filter(i => i.type === 'video').length;

    searchDropdown.innerHTML = `
      <div class="search-dropdown-header">
        <span class="search-dropdown-title">
          <i class="fa-solid ${isDefaultList ? 'fa-play-circle' : 'fa-magnifying-glass'}" style="color: ${isDefaultList ? '#ec4899' : '#6366f1'};"></i>
          ${isDefaultList ? `Videos on Website (${videoCount})` : 'Matching Channel Videos'}
        </span>
        <span class="search-dropdown-badge">${itemsToShow.length} ${itemsToShow.length === 1 ? 'Result' : 'Results'}</span>
      </div>

      <div class="search-dropdown-list" role="listbox">
        ${itemsToShow.map((item, idx) => `
          <div class="dropdown-item" role="option" data-index="${idx}" tabindex="0">
            ${item.thumb ? `
              <img src="${item.thumb}" alt="${escapeHtml(item.title)}" class="dropdown-thumb-img" onerror="this.src='https://img.youtube.com/vi/Y4djQ1p5TXk/hqdefault.jpg'">
            ` : `
              <div class="dropdown-icon-box ${item.iconClass || 'icon-video'}">
                <i class="${item.icon}"></i>
              </div>
            `}
            <div class="dropdown-info">
              <span class="drop-name">${cleanQ ? highlightMatches(item.title, cleanQ) : escapeHtml(item.title)}</span>
              <div class="drop-meta-row">
                <span class="drop-type-tag ${item.badgeClass}">${item.badge}</span>
                <span class="drop-sub">${cleanQ ? highlightMatches(item.subtitle, cleanQ) : escapeHtml(item.subtitle)}</span>
              </div>
            </div>
            <i class="fa-solid fa-play dropdown-arrow" style="font-size: 10px;"></i>
          </div>
        `).join('')}
      </div>

      <div class="search-dropdown-footer">
        <span>Click to watch video</span>
        <div class="search-kbd-hints">
          <span class="search-kbd">↑</span>
          <span class="search-kbd">↓</span>
          <span class="search-kbd">↵ Watch</span>
          <span class="search-kbd">ESC</span>
        </div>
      </div>
    `;

    // Attach click events
    searchDropdown.querySelectorAll('.dropdown-item').forEach(itemEl => {
      const idx = parseInt(itemEl.getAttribute('data-index'), 10);
      const targetItem = activeDropdownItems[idx];
      itemEl.addEventListener('click', () => {
        executeSearchItem(targetItem);
      });
      itemEl.addEventListener('mouseenter', () => {
        selectedDropdownIndex = idx;
        updateActiveDropdownUI();
      });
    });
  }

  function executeSearchItem(targetItem) {
    if (!targetItem) return;
    if (searchDropdown) searchDropdown.classList.remove('open');
    if (searchInput) searchInput.blur();
    if (typeof targetItem.action === 'function') {
      targetItem.action();
    }
  }

  function updateActiveDropdownUI() {
    if (!searchDropdown) return;
    const itemEls = searchDropdown.querySelectorAll('.dropdown-item');
    itemEls.forEach((el, i) => {
      if (i === selectedDropdownIndex) {
        el.classList.add('active');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        el.classList.remove('active');
      }
    });
  }

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('focus', () => {
      renderDropdown(searchInput.value);
      searchDropdown.classList.add('open');
    });

    searchInput.addEventListener('input', () => {
      const val = searchInput.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = val ? 'flex' : 'none';
      }
      renderDropdown(val);
      searchDropdown.classList.add('open');

      // Live update shelf search query as you type!
      currentSearchQuery = val.trim();
      renderVideos();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (!searchDropdown.classList.contains('open')) {
        if (e.key === 'ArrowDown') {
          searchDropdown.classList.add('open');
          renderDropdown(searchInput.value);
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeDropdownItems.length === 0) return;
        selectedDropdownIndex = (selectedDropdownIndex + 1) % activeDropdownItems.length;
        updateActiveDropdownUI();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeDropdownItems.length === 0) return;
        selectedDropdownIndex = (selectedDropdownIndex - 1 + activeDropdownItems.length) % activeDropdownItems.length;
        updateActiveDropdownUI();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedDropdownIndex >= 0 && selectedDropdownIndex < activeDropdownItems.length) {
          executeSearchItem(activeDropdownItems[selectedDropdownIndex]);
        } else {
          // Normal search submit: scroll to shelf and apply query
          searchDropdown.classList.remove('open');
          searchInput.blur();
          currentSearchQuery = searchInput.value.trim();
          renderVideos();
          const resourcesSec = document.getElementById('resources');
          if (resourcesSec) resourcesSec.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'Escape') {
        searchDropdown.classList.remove('open');
        searchInput.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target) && (!searchClearBtn || !searchClearBtn.contains(e.target))) {
        searchDropdown.classList.remove('open');
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      currentSearchQuery = '';
      renderVideos();
      renderDropdown('');
      searchInput.focus();
    });
  }

  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', () => {
      if (searchDropdown) searchDropdown.classList.remove('open');
      currentSearchQuery = searchInput.value.trim();
      renderVideos();
      const resourcesSec = document.getElementById('resources');
      if (resourcesSec) resourcesSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const btnClearShelfSearch = document.getElementById('btnClearShelfSearch');
  if (btnClearShelfSearch) {
    btnClearShelfSearch.addEventListener('click', () => {
      currentSearchQuery = '';
      if (searchInput) searchInput.value = '';
      if (searchClearBtn) searchClearBtn.style.display = 'none';
      renderVideos();
    });
  }



  // Filter Button quick scroll
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      const resourcesSec = document.getElementById('resources');
      if (resourcesSec) resourcesSec.scrollIntoView({ behavior: 'smooth' });
      showToast('Jumped to Ahan Tech Video Resources', 'sliders');
    });
  }



  // Hero Explore Button
  const exploreBtn = document.getElementById('exploreBtn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      if (!currentUser) {
        setTimeout(() => {
          showToast('Sign in or create an account to unlock all tutorials and downloads!', 'lock');
        }, 500);
      }
    });
  }

  // Hero Telegram VIP Tag
  const heroVipTag = document.querySelector('.floating-tag.tag-right');
  if (heroVipTag) {
    heroVipTag.style.cursor = 'pointer';
    heroVipTag.addEventListener('click', () => {
      if (!requireAuth('access the Alpha 2026 Telegram VIP community', 'signup')) return;
      window.open('https://t.me/alpha2026start', '_blank');
      showToast('Opening Alpha 2026 Telegram VIP...', 'telegram');
    });
  }

  // --------------------------------------------------------------------------
  // Toast Notification System
  // --------------------------------------------------------------------------
  function showToast(message, icon = 'check') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    let iconClass = `fa-solid fa-${icon}`;
    if (['github', 'google', 'telegram', 'youtube', 'x-twitter'].includes(icon)) {
      iconClass = `fa-brands fa-${icon}`;
    } else if (icon.startsWith('fa-')) {
      iconClass = icon;
    }
    // Sanitize message to prevent XSS injection via user-derived strings
    const safeMessage = escapeHtml(message);
    toast.innerHTML = `<i class="${iconClass}"></i><span>${safeMessage}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Synchronize Cloud Videos from Supabase
  async function syncVideosFromSupabase() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('videos').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          currentVideos = [];
          saveVideosToStorage();
          renderVideos();
          if (currentUser) {
            updateUserPanelHeader();
            renderUserBookmarks();
          }
          console.log('⚡ Supabase Cloud Database videos are clean (0 videos). Catalog reset.');
        } else {
          currentVideos = data.map(cloudVid => ({
            id: cloudVid.id,
            title: cloudVid.title,
            thumb: cloudVid.thumb || 'https://ubyfoaiklfqdktqmunuo.supabase.co/storage/v1/object/public/pdfs/hero_characters.jpg',
            desc: cloudVid.description || '',
            duration: cloudVid.duration || 'HD Video',
            views: cloudVid.views || 'New • Just now',
            author: cloudVid.author || 'Ahan Tech',
            category: cloudVid.category || 'claude gpt free',
            url: cloudVid.url,
            resources: Array.isArray(cloudVid.resources) ? cloudVid.resources : []
          }));
          saveVideosToStorage();
          renderVideos();
          if (currentUser) {
            updateUserPanelHeader();
            renderUserBookmarks();
          }
          console.log(`⚡ Loaded ${data.length} videos from Supabase Cloud Database`);
        }
      }
    } catch (err) {
      console.warn('Supabase cloud videos fetch fallback:', err);
    }
  }

  // Initial Boot
  checkAuthViewState();
  updateNavAuthUI();
  renderVideos();
  syncVideosFromSupabase();
  console.log('Ahan Tech Portfolio & Creator Studio Auto-Pilot initialized.');
});
