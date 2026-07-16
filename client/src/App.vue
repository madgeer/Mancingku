<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const API_BASE = 'http://127.0.0.1:3000';

// App States
const currentTab = ref('home'); // home, browse, queue, gears, baits, blog, auth
const selectedCategory = ref('All'); // All, Galatama, Danau, Laut, Sungai
const searchQuery = ref('');
const toastMessage = ref('');
const spots = ref([]);
const popularSpots = ref([]);
const allGears = ref([]);
const allBaits = ref([]);
const allBlogs = ref([]);

// Modals
const showDetailModal = ref(false);
const selectedSpot = ref(null);
const spotReviews = ref([]);
const spotSessions = ref([]);
const activeBookingForm = ref({
  date: new Date().toISOString().split('T')[0],
  sessionId: '',
  totalPeople: 1,
  selectedGears: [] // Array of { gear_id, quantity, name, price }
});

const showReviewModal = ref(false);
const reviewForm = ref({
  spotId: '',
  spotName: '',
  rating: 5,
  comment: ''
});

// Authentication State
const token = ref(localStorage.getItem('mancingku_token') || '');
const safeParseUser = () => {
  try {
    const data = localStorage.getItem('mancingku_user');
    if (!data || data === 'undefined') return null;
    return JSON.parse(data);
  } catch (err) {
    localStorage.removeItem('mancingku_user');
    localStorage.removeItem('mancingku_token');
    return null;
  }
};
const currentUser = ref(safeParseUser());
const authMode = ref('login'); // login, register
const authForm = ref({
  email: '',
  password: '',
  name: '',
  phone: ''
});

// Profile Editor State
const profileForm = ref({
  name: '',
  phone: ''
});

// User Queue / Bookings State
const userQueue = ref([]);
const loadingQueue = ref(false);

// Filtered spots for search & categories
const filteredSpots = computed(() => {
  let result = spots.value;

  // Filter by category (for browse tab or sidebar category menu)
  if (selectedCategory.value !== 'All') {
    result = result.filter(s => {
      const addressLower = s.address ? s.address.toLowerCase() : '';
      const nameLower = s.name ? s.name.toLowerCase() : '';
      const catLower = selectedCategory.value.toLowerCase();
      // Simple fallback matching if category column doesn't exist
      return s.category === selectedCategory.value || 
             nameLower.includes(catLower) || 
             addressLower.includes(catLower);
    });
  }

  // Filter by search query
  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) || 
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.slug && s.slug.toLowerCase().includes(q))
    );
  }

  return result;
});

// Redirect search activity to browse tab
watch(searchQuery, (newVal) => {
  if (newVal.trim() !== '' && currentTab.value !== 'browse') {
    currentTab.value = 'browse';
  }
});

// Load everything on mount
onMounted(() => {
  fetchSpots();
  fetchGears();
  fetchBaits();
  fetchBlogs();
  if (token.value && currentUser.value) {
    profileForm.value.name = currentUser.value.name || '';
    profileForm.value.phone = currentUser.value.phone || '';
    fetchUserQueue();
  }
});

// Helper for dynamic image URL construction (Unsplash Fallbacks for rich look)
const getImageUrl = (imagePath, type = 'spots', index = 0) => {
  const pathStr = String(imagePath || '').trim();
  if (pathStr === '') {
    // Unsplash Fallbacks based on category type/index
    if (type === 'spots') {
      const placeholders = [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80', // lake/boat
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80', // sea/beach
        'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80', // river/boat
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&q=80', // sunset/lake
        'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=400&q=80'  // forest/lake
      ];
      return placeholders[index % placeholders.length];
    } else if (type === 'gears') {
      const placeholders = [
        'https://images.unsplash.com/photo-1605281317010-fe5fed937413?w=400&q=80', // rod
        'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=400&q=80', // hook
        'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=400&q=80'  // gear box
      ];
      return placeholders[index % placeholders.length];
    } else if (type === 'baits') {
      return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&q=80';
    } else if (type === 'blog') {
      return 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=400&q=80';
    }
  }
  if (pathStr.startsWith('http')) return pathStr;
  if (pathStr.startsWith('assets/')) return `${API_BASE}/${pathStr}`;
  if (type === 'gears') {
    return `${API_BASE}/assets/perlengkapan/pancingan/${pathStr}`;
  } else if (type === 'baits') {
    return `${API_BASE}/assets/perlengkapan/umpan/${pathStr}`;
  }
  return `${API_BASE}/assets/${type}/${pathStr}`;
};

const showToast = (msg) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
};

// API Fetching Calls
const fetchSpots = async () => {
  try {
    const res = await fetch(`${API_BASE}/spots`);
    if (res.ok) {
      spots.value = await res.json();
      // Inject some categories for demo filtering
      spots.value.forEach((s, idx) => {
        if (!s.category) {
          const cats = ['Galatama', 'Danau', 'Laut', 'Sungai'];
          s.category = cats[idx % cats.length];
        }
      });
    }
  } catch (err) {
    console.error('Failed to fetch spots', err);
    // Fallback Mock Data for demo if offline
    spots.value = [
      { id: 1, name: 'Galatama Lele Bahari', address: 'Jl. Bahari No. 12, Jakarta', rating: 4.8, slug: 'galatama-lele-bahari', category: 'Galatama', description: 'Kolam galatama lele premium dengan sistem tarikan ikan besar super seru.' },
      { id: 2, name: 'Danau Mancing Indah', address: 'Puncak, Bogor', rating: 4.5, slug: 'danau-mancing-indah', category: 'Danau', description: 'Pemandangan asri danau alami dengan populasi Ikan Mas dan Nila yang melimpah.' },
      { id: 3, name: 'Bagan Laut Untung Jawa', address: 'Kepulauan Seribu', rating: 4.9, slug: 'bagan-laut-untung-jawa', category: 'Laut', description: 'Spot mancing laut lepas di atas bagan bambu tradisional. Ikan target: Tenggiri & Kakap Merah.' },
      { id: 4, name: 'Sungai Ciliwung Hulu', address: 'Bogor Selatan', rating: 4.0, slug: 'sungai-ciliwung-hulu', category: 'Sungai', description: 'Mancing liar ikan hampala di air jernih bebatuan hulu sungai.' },
      { id: 5, name: 'Pemancingan Mas Harian', address: 'Depok', rating: 4.2, slug: 'pemancingan-mas-harian', category: 'Galatama', description: 'Kolam kilo gebrus harian sangat cocok untuk rekreasi memancing bersama keluarga.' }
    ];
  }

  // Populate popular list
  try {
    const res = await fetch(`${API_BASE}/spots/popular`);
    if (res.ok) {
      popularSpots.value = await res.json();
    } else {
      popularSpots.value = [...spots.value].sort((a,b) => b.rating - a.rating).slice(0, 4);
    }
  } catch (err) {
    popularSpots.value = [...spots.value].sort((a,b) => b.rating - a.rating).slice(0, 4);
  }
};

const fetchGears = async () => {
  try {
    const res = await fetch(`${API_BASE}/gears`);
    if (res.ok) {
      allGears.value = await res.json();
    } else {
      const res2 = await fetch(`${API_BASE}/fishingGear`);
      if (res2.ok) {
        allGears.value = await res2.json();
      }
    }
  } catch (err) {
    console.error('Failed to fetch gears', err);
  }
  
  if (allGears.value.length === 0) {
    allGears.value = [
      { id: 1, name: 'Rod Carbon Premium X', price: 15000, description: 'Joran pancing fiber carbon kuat tahan tarikan ikan lele raksasa.', stock: 10 },
      { id: 2, name: 'Reel Shimano 4000', price: 20000, description: 'Reel pancing smooth drag tinggi untuk mancing kolam maupun muara.', stock: 8 },
      { id: 3, name: 'Peralatan Set Lengkap', price: 35000, description: 'Paket joran, reel, timah, pelampung, dan cadangan kail pancing.', stock: 15 }
    ];
  }
};

const fetchBaits = async () => {
  try {
    const res = await fetch(`${API_BASE}/bait`);
    if (res.ok) {
      allBaits.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch baits', err);
  }

  if (allBaits.value.length === 0) {
    allBaits.value = [
      { id: 1, name: 'Cacing Tanah Super', description: 'Umpan hidup terbaik untuk ikan nila, patin, dan gurame.', purchase_link: 'https://shopee.co.id' },
      { id: 2, name: 'Pelet Wangi Djempol', description: 'Umpan racikan bubuk aroma amis gurih untuk mancing harian ikan mas.', purchase_link: 'https://tokopedia.com' },
      { id: 3, name: 'Umpan Tiruan Minnow', description: 'Lure pancing tiruan untuk mancing casting hampala dan gabus liar.', purchase_link: 'https://tokopedia.com' }
    ];
  }
};

const fetchBlogs = async () => {
  try {
    const res = await fetch(`${API_BASE}/blog`);
    if (res.ok) {
      allBlogs.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch blogs', err);
  }

  if (allBlogs.value.length === 0) {
    allBlogs.value = [
      { id: 1, title: 'Cara Membuat Umpan Racikan Ikan Mas Juara', slug: 'racikan-umpan-mas', content: 'Membuat racikan umpan ikan mas yang jitu membutuhkan perpaduan amis dan wangi. Campuran pelet djempol, kroto segar, santan kara, dan sedikit essen pandan terbukti sangat ampuh disukai ikan rame maupun indukan.' },
      { id: 2, title: 'Teknik Casting Hampala di Sungai Berarus Deras', slug: 'casting-hampala-sungai', content: 'Ikan hampala terkenal dengan sambarannya yang eksplosif. Saat mancing di sungai berarus deras, gunakan teknik cast-and-retrieve yang agak cepat dengan lure bertipe spoon atau minnow sinking di dekat bebatuan.' },
      { id: 3, title: '5 Perlengkapan Wajib untuk Mancing Bagan Laut', slug: 'perlengkapan-bagan-laut', content: 'Mancing bagan di malam hari memerlukan joran pendek berkekuatan tinggi, timah pemberat besar agar kail tidak terbawa arus kencang, lampu kepala (headlamp), serta pelindung angin (jaket tebal).' }
    ];
  }
};

const fetchUserQueue = async () => {
  if (!currentUser.value) return;
  loadingQueue.value = true;
  try {
    // We use the IDOR-proofed getHistory route
    const res = await fetch(`${API_BASE}/history/${currentUser.value.id}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    });
    if (res.ok) {
      const result = await res.json();
      userQueue.value = result.data || [];
    }
  } catch (err) {
    console.error('Failed to fetch history', err);
  } finally {
    loadingQueue.value = false;
  }
};

// Open Detail View of Spot
const viewSpotDetails = async (spot) => {
  selectedSpot.value = spot;
  showDetailModal.value = true;
  spotReviews.value = [];
  spotSessions.value = [];
  activeBookingForm.value.sessionId = '';
  activeBookingForm.value.selectedGears = [];

  // Fetch reviews for spot
  try {
    const res = await fetch(`${API_BASE}/review/spot/${spot.id}`);
    if (res.ok) {
      spotReviews.value = await res.json();
    }
  } catch (err) {
    console.error(err);
  }

  // Fetch sessions for spot
  try {
    const res = await fetch(`${API_BASE}/sessions/${spot.id}`);
    if (res.ok) {
      spotSessions.value = await res.json();
      if (spotSessions.value.length > 0) {
        activeBookingForm.value.sessionId = spotSessions.value[0].id;
      }
    }
  } catch (err) {
    console.error(err);
  }

  // If sessions empty, create fallback sessions for demo booking
  if (spotSessions.value.length === 0) {
    spotSessions.value = [
      { id: 101, session_name: 'Sesi Pagi (06:00 - 11:00)', price: 15000, seats_left: 10, start_time: '06:00:00', end_time: '11:00:00' },
      { id: 102, session_name: 'Sesi Siang (12:00 - 17:00)', price: 20000, seats_left: 6, start_time: '12:00:00', end_time: '17:00:00' },
      { id: 103, session_name: 'Sesi Malam (18:00 - 23:00)', price: 25000, seats_left: 15, start_time: '18:00:00', end_time: '23:00:00' }
    ];
    activeBookingForm.value.sessionId = 101;
  }
};

// Gear selection helpers for Booking form
const toggleGearSelection = (gear) => {
  const index = activeBookingForm.value.selectedGears.findIndex(g => g.gear_id === gear.id);
  if (index > -1) {
    activeBookingForm.value.selectedGears.splice(index, 1);
  } else {
    activeBookingForm.value.selectedGears.push({
      gear_id: gear.id,
      quantity: 1,
      name: gear.name,
      price: gear.price
    });
  }
};

const isGearSelected = (gearId) => {
  return activeBookingForm.value.selectedGears.some(g => g.gear_id === gearId);
};

const getGearQty = (gearId) => {
  const gear = activeBookingForm.value.selectedGears.find(g => g.gear_id === gearId);
  return gear ? gear.quantity : 0;
};

const updateGearQty = (gearId, amount) => {
  const gear = activeBookingForm.value.selectedGears.find(g => g.gear_id === gearId);
  if (gear) {
    gear.quantity += amount;
    if (gear.quantity <= 0) {
      toggleGearSelection({ id: gearId });
    }
  }
};

// Create Booking
const submitBooking = async () => {
  if (!token.value) {
    showToast('Akses ditolak! Anda harus log in terlebih dahulu.');
    currentTab.value = 'auth';
    showDetailModal.value = false;
    return;
  }

  const payload = {
    session_id: activeBookingForm.value.sessionId,
    booking_date: activeBookingForm.value.date,
    total_people: activeBookingForm.value.totalPeople,
    gears: activeBookingForm.value.selectedGears.map(g => ({
      gear_id: g.gear_id,
      quantity: g.quantity
    }))
  };

  try {
    const res = await fetch(`${API_BASE}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      showToast('🎉 Booking berhasil ditambahkan ke antrean (Queue) Anda!');
      showDetailModal.value = false;
      fetchUserQueue();
      currentTab.value = 'queue';
    } else {
      showToast(`Gagal: ${data.message}`);
    }
  } catch (err) {
    // Offline Mock Success
    showToast('🎉 Booking ditambahkan ke Queue (Mode Simulasi Offline)');
    showDetailModal.value = false;
    
    // Add mock booking to local userQueue
    const mockSession = spotSessions.value.find(s => s.id === payload.session_id);
    const calculatedPrice = (mockSession ? mockSession.price : 15000) * payload.total_people + 
      activeBookingForm.value.selectedGears.reduce((acc, g) => acc + (g.price * g.quantity), 0);

    userQueue.value.unshift({
      id: Math.floor(Math.random() * 900) + 100,
      spot: selectedSpot.value.name,
      date: new Date(payload.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      price: calculatedPrice,
      status_tab: 'active',
      original_status: 'pending'
    });
    currentTab.value = 'queue';
  }
};

// Confirm payment for booking
const payBooking = async (bookingId) => {
  try {
    const res = await fetch(`${API_BASE}/booking/${bookingId}/pay`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      showToast('💰 Pembayaran berhasil dikonfirmasi!');
      fetchUserQueue();
    } else {
      showToast(`Gagal bayar: ${data.message}`);
    }
  } catch (err) {
    // Offline fallback update
    const booking = userQueue.value.find(b => b.id === bookingId);
    if (booking) {
      booking.original_status = 'paid';
      showToast('💰 Pembayaran berhasil dikonfirmasi (Offline Mode)');
    }
  }
};

// Open Review Modal
const openReviewModal = (booking) => {
  // Try to find spot by name
  const matchedSpot = spots.value.find(s => s.name === booking.spot);
  reviewForm.value.spotId = matchedSpot ? matchedSpot.id : 1;
  reviewForm.value.spotName = booking.spot;
  reviewForm.value.rating = 5;
  reviewForm.value.comment = '';
  showReviewModal.value = true;
};

// Submit Review
const submitReview = async () => {
  if (!reviewForm.value.comment.trim()) {
    showToast('Tulis komentar terlebih dahulu');
    return;
  }

  const payload = {
    spot_id: reviewForm.value.spotId,
    rating: reviewForm.value.rating,
    comment: reviewForm.value.comment
  };

  try {
    const res = await fetch(`${API_BASE}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      showToast('⭐ Ulasan berhasil dikirim!');
      showReviewModal.value = false;
      fetchSpots(); // refresh ratings
    } else {
      showToast(`Gagal: ${data.message}`);
    }
  } catch (err) {
    showToast('⭐ Ulasan terkirim (Simulasi Offline)');
    showReviewModal.value = false;
  }
};

// Auth Actions (Login / Register)
const handleAuth = async () => {
  if (!authForm.value.email || !authForm.value.password) {
    showToast('Email dan password wajib diisi');
    return;
  }

  const isLogin = authMode.value === 'login';
  const url = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
  const payload = isLogin 
    ? { email: authForm.value.email, password: authForm.value.password }
    : { email: authForm.value.email, password: authForm.value.password, name: authForm.value.name, phone: authForm.value.phone };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      if (isLogin) {
        token.value = data.token;
        currentUser.value = data.user;
        localStorage.setItem('mancingku_token', data.token);
        localStorage.setItem('mancingku_user', JSON.stringify(data.user));
        
        profileForm.value.name = data.user.name || '';
        profileForm.value.phone = data.user.phone || '';
        
        showToast(`Selamat datang kembali, ${data.user.email}!`);
        fetchUserQueue();
        currentTab.value = 'home';
      } else {
        showToast('Registrasi berhasil! Silakan login.');
        authMode.value = 'login';
      }
    } else {
      showToast(`Gagal: ${data.message}`);
    }
  } catch (err) {
    // Offline simulation mode
    if (isLogin) {
      const mockUser = { id: 77, email: authForm.value.email, name: 'Pancing Mania', phone: '08123456789', role: 'user' };
      token.value = 'mock_jwt_token_123';
      currentUser.value = mockUser;
      localStorage.setItem('mancingku_token', token.value);
      localStorage.setItem('mancingku_user', JSON.stringify(mockUser));
      
      profileForm.value.name = mockUser.name;
      profileForm.value.phone = mockUser.phone;
      
      showToast('Masuk via Mode Offline!');
      currentTab.value = 'home';
    } else {
      showToast('Registrasi berhasil (Simulasi Offline)');
      authMode.value = 'login';
    }
  }
};

// Profile Update
const handleProfileUpdate = async () => {
  try {
    const res = await fetch(`${API_BASE}/users/${currentUser.value.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({
        name: profileForm.value.name,
        phone: profileForm.value.phone
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('💾 Profil berhasil diperbarui!');
      currentUser.value.name = profileForm.value.name;
      currentUser.value.phone = profileForm.value.phone;
      localStorage.setItem('mancingku_user', JSON.stringify(currentUser.value));
    } else {
      showToast(`Gagal update: ${data.message}`);
    }
  } catch (err) {
    showToast('💾 Profil diperbarui (Mode Offline)');
    currentUser.value.name = profileForm.value.name;
    currentUser.value.phone = profileForm.value.phone;
    localStorage.setItem('mancingku_user', JSON.stringify(currentUser.value));
  }
};

const handleLogout = () => {
  token.value = '';
  currentUser.value = null;
  userQueue.value = [];
  localStorage.removeItem('mancingku_token');
  localStorage.removeItem('mancingku_user');
  showToast('Sampai jumpa kembali, selamat memancing!');
  currentTab.value = 'home';
};
</script>

<template>
  <div id="app">
    <!-- Header Netflix 2006 style -->
    <header>
      <div class="header-top">
        <div class="logo-container">
          <h1 class="logo" @click="currentTab = 'home'">Mancingku</h1>
          <span class="tagline">Over 100+ Premium Fishing Spots Online!</span>
        </div>

        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search spots..." 
            v-model="searchQuery"
          />
          <button @click="currentTab = 'browse'">Search</button>
        </div>

        <div class="user-status">
          <span v-if="currentUser">
            Welcome, <span class="bold text-success">{{ currentUser.name || currentUser.email }}</span> |
            <a @click="currentTab = 'auth'">Account</a> |
            <a @click="handleLogout">Log Out</a>
          </span>
          <span v-else>
            Already a member? <a @click="currentTab = 'auth'; authMode = 'login'">Log In</a> or 
            <a @click="currentTab = 'auth'; authMode = 'register'">Sign Up Now!</a>
          </span>
        </div>
      </div>

      <!-- Tabbed Navigation Menu -->
      <ul class="nav-tabs">
        <li :class="{ active: currentTab === 'home' }">
          <a @click="currentTab = 'home'">Home</a>
        </li>
        <li :class="{ active: currentTab === 'browse' }">
          <a @click="currentTab = 'browse'; selectedCategory = 'All'">Browse Spots</a>
        </li>
        <li v-if="currentUser" :class="{ active: currentTab === 'queue' }">
          <a @click="currentTab = 'queue'">My Queue ({{ userQueue.length }})</a>
        </li>
        <li :class="{ active: currentTab === 'gears' }">
          <a @click="currentTab = 'gears'">Rental Gears</a>
        </li>
        <li :class="{ active: currentTab === 'baits' }">
          <a @click="currentTab = 'baits'">Baits Shop</a>
        </li>
        <li :class="{ active: currentTab === 'blog' }">
          <a @click="currentTab = 'blog'">Fishing Blogs</a>
        </li>
      </ul>
    </header>

    <!-- Marketing Promotional Banner (Classic 2006 Yellow Callout Box) -->
    <div class="promo-banner" v-if="currentTab === 'home'">
      <div>
        <div class="promo-text">Get Unlimited Fishing Gear Rentals & Spot Bookings for only <span>Rp 49.000/month</span>!</div>
        <div class="promo-sub">First month free trial. No late fees. Free delivery of equipment directly to the spot. Cancel anytime.</div>
      </div>
      <button class="promo-btn" @click="currentTab = 'auth'; authMode = 'register'">Join Free for a Month</button>
    </div>

    <!-- Main Content Layout Split -->
    <div class="main-layout">
      <!-- Left Sidebar (Category Navigation & Queue Features) -->
      <aside class="sidebar">
        <!-- Search Genres Box -->
        <div class="sidebar-box">
          <h3>Spot Categories</h3>
          <ul class="sidebar-menu">
            <li :class="{ active: selectedCategory === 'All' && currentTab === 'browse' }">
              <a @click="currentTab = 'browse'; selectedCategory = 'All'">All Categories</a>
            </li>
            <li :class="{ active: selectedCategory === 'Galatama' && currentTab === 'browse' }">
              <a @click="currentTab = 'browse'; selectedCategory = 'Galatama'">Galatama Pool</a>
            </li>
            <li :class="{ active: selectedCategory === 'Danau' && currentTab === 'browse' }">
              <a @click="currentTab = 'browse'; selectedCategory = 'Danau'">Lake / Freshwater</a>
            </li>
            <li :class="{ active: selectedCategory === 'Laut' && currentTab === 'browse' }">
              <a @click="currentTab = 'browse'; selectedCategory = 'Laut'">Sea / Saltwater</a>
            </li>
            <li :class="{ active: selectedCategory === 'Sungai' && currentTab === 'browse' }">
              <a @click="currentTab = 'browse'; selectedCategory = 'Sungai'">Rivers / Wild Catch</a>
            </li>
          </ul>
        </div>

        <!-- How it works box -->
        <div class="sidebar-box">
          <h3>How Queue Works</h3>
          <ol class="benefits-list">
            <li>Search for your favorite fishing spots.</li>
            <li>Select a date & session, and add rental gears.</li>
            <li>Add them to your Queue.</li>
            <li>Confirm payment to secure your ticket.</li>
            <li>Go fish!</li>
          </ol>
        </div>

        <!-- Classic 2006 Ads Box -->
        <div class="sidebar-box text-center">
          <h4 style="margin: 0; color:#333; font-size:11px;">Mancingku Member Perks</h4>
          <p style="font-size: 11px; margin-top:5px; color: #555;">No Late Fees! Free replacement on hook damage.</p>
          <hr style="border: 0; border-top:1px solid #ccc;" />
          <span style="font-weight: bold; color: var(--netflix-red); font-size: 14px;">Rp 0,-</span>
          <p style="font-size:9px; color:#777;">trial registration fee</p>
        </div>
      </aside>

      <!-- Center Dynamic Content Render -->
      <main class="content">
        <!-- 1. HOME TAB -->
        <div v-if="currentTab === 'home'">
          <h2 class="section-title">New Releases: Popular Fishing Spots</h2>
          <div class="dvd-grid">
            <div class="dvd-card" v-for="(spot, index) in popularSpots" :key="'pop-'+spot.id">
              <div class="dvd-jacket" @click="viewSpotDetails(spot)">
                <img :src="getImageUrl(spot.image, 'spots', index)" :alt="spot.name" class="dvd-image" />
              </div>
              <a class="dvd-title" @click="viewSpotDetails(spot)">{{ spot.name }}</a>
              <div class="dvd-meta">{{ spot.address }}</div>
              <div class="stars">
                <span v-for="n in Math.round(spot.rating || 5)" :key="n">★</span>
                <span class="stars-empty" v-for="n in (5 - Math.round(spot.rating || 5))" :key="'e'+n">★</span>
              </div>
              <button class="btn-yellow" @click="viewSpotDetails(spot)">Rent / Book</button>
            </div>
          </div>

          <h2 class="section-title">Latest From Fishing Blogs</h2>
          <div style="text-align: left; margin-bottom: 25px;">
            <div v-for="blog in allBlogs.slice(0, 2)" :key="blog.id" style="margin-bottom: 15px;">
              <a @click="currentTab = 'blog'" style="font-size: 14px; font-weight: bold; color: #003399; cursor: pointer; text-decoration: underline;">
                {{ blog.title }}
              </a>
              <p style="font-size: 12px; color: var(--text-grey); margin-top: 3px;">
                {{ blog.content.substring(0, 150) }}...
              </p>
            </div>
          </div>
        </div>

        <!-- 2. BROWSE SPOTS TAB -->
        <div v-else-if="currentTab === 'browse'">
          <h2 class="section-title">
            Browsing: {{ selectedCategory }} Spots 
            <span v-if="searchQuery"> (Matching: "{{ searchQuery }}")</span>
          </h2>
          <div v-if="filteredSpots.length === 0" style="padding: 30px; text-align: center; color: var(--text-grey);">
            No spots found matching your selection. Try adjusting your category or search query.
          </div>
          <div class="dvd-grid" v-else>
            <div class="dvd-card" v-for="(spot, index) in filteredSpots" :key="'br-'+spot.id">
              <div class="dvd-jacket" @click="viewSpotDetails(spot)">
                <img :src="getImageUrl(spot.image, 'spots', index)" :alt="spot.name" class="dvd-image" />
              </div>
              <a class="dvd-title" @click="viewSpotDetails(spot)">{{ spot.name }}</a>
              <div class="dvd-meta">{{ spot.address }}</div>
              <div class="stars">
                <span v-for="n in Math.round(spot.rating || 5)" :key="n">★</span>
                <span class="stars-empty" v-for="n in (5 - Math.round(spot.rating || 5))" :key="'e'+n">★</span>
              </div>
              <button class="btn-yellow" @click="viewSpotDetails(spot)">Rent / Book</button>
            </div>
          </div>
        </div>

        <!-- 3. USER QUEUE / BOOKINGS TAB -->
        <div v-else-if="currentTab === 'queue'">
          <h2 class="section-title">My Queue (Reservations List)</h2>
          <div v-if="loadingQueue" style="padding: 20px; text-align: center;">
            Loading your queue details...
          </div>
          <div v-else-if="userQueue.length === 0" style="padding: 30px; text-align: center; color: var(--text-grey);">
            Your Queue is empty. Browse spots to add them to your rental list!
          </div>
          <div v-else>
            <table class="queue-table">
              <thead>
                <tr>
                  <th>Queue #</th>
                  <th>Spot / Description</th>
                  <th>Fishing Date</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style="text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(q, idx) in userQueue" :key="q.id">
                  <td class="bold">{{ idx + 1 }}</td>
                  <td>
                    <span class="bold" style="color: #003399;">{{ q.spot }}</span>
                    <div style="font-size: 10px; color: #777; margin-top:2px;">Ticket ID: #00{{ q.id }}</div>
                  </td>
                  <td>{{ q.date }}</td>
                  <td class="bold text-success">Rp {{ (q.price || 0).toLocaleString('id-ID') }}</td>
                  <td>
                    <span :class="['badge-status', `badge-${q.original_status}`]">
                      {{ q.original_status }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <button 
                      v-if="q.original_status === 'pending'" 
                      class="btn-yellow" 
                      style="width: 100px; padding: 2px 5px;" 
                      @click="payBooking(q.id)"
                    >
                      Pay Ticket
                    </button>
                    <button 
                      v-else-if="q.original_status === 'paid'" 
                      class="btn-red" 
                      style="width: 100px; padding: 2px 5px; background: linear-gradient(to bottom, #d12e30, #900);" 
                      @click="openReviewModal(q)"
                    >
                      Rate Spot
                    </button>
                    <span v-else style="color: #777; font-size:11px;">Completed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. RENTAL GEARS TAB -->
        <div v-else-if="currentTab === 'gears'">
          <h2 class="section-title">Browse Rental Gears</h2>
          <div class="dvd-grid">
            <div class="dvd-card" v-for="(gear, index) in allGears" :key="'gr-'+gear.id">
              <div class="dvd-jacket">
                <img :src="getImageUrl(gear.image, 'gears', index)" :alt="gear.name" class="dvd-image" />
              </div>
              <div class="bold" style="font-size: 13px; color: #333; margin-bottom:4px;">{{ gear.name }}</div>
              <div class="dvd-meta">{{ gear.description }}</div>
              <div class="bold text-success" style="margin-bottom: 8px;">Rp {{ (gear.price || 0).toLocaleString('id-ID') }} / session</div>
              <div style="font-size: 10px; color: var(--text-grey); margin-bottom: 8px;">Stock Available: {{ gear.stock }}</div>
            </div>
          </div>
        </div>

        <!-- 5. BAITS SHOP TAB -->
        <div v-else-if="currentTab === 'baits'">
          <h2 class="section-title">Recommended Baits</h2>
          <div class="dvd-grid">
            <div class="dvd-card" v-for="(bait, index) in allBaits" :key="'bt-'+bait.id">
              <div class="dvd-jacket">
                <img :src="getImageUrl(bait.image, 'baits', index)" :alt="bait.name" class="dvd-image" />
              </div>
              <div class="bold" style="font-size: 13px; color: #333; margin-bottom:4px;">{{ bait.name }}</div>
              <div class="dvd-meta">{{ bait.description }}</div>
              <a :href="bait.purchase_link" target="_blank" class="btn-yellow text-center" style="display: block; text-decoration: none; line-height: 20px;">
                Buy on Marketplace
              </a>
            </div>
          </div>
        </div>

        <!-- 6. BLOG ARTICLES TAB -->
        <div v-else-if="currentTab === 'blog'">
          <h2 class="section-title">Mancingku Articles & Tips</h2>
          <div style="text-align: left;">
            <article v-for="(blog, index) in allBlogs" :key="'bg-'+blog.id" style="margin-bottom: 25px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
              <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--netflix-red); margin: 0 0 8px 0;">
                {{ blog.title }}
              </h3>
              <p style="font-size: 13px; line-height: 1.6; color: #333;">
                {{ blog.content }}
              </p>
            </article>
          </div>
        </div>

        <!-- 7. AUTHENTICATION & PROFILE TAB -->
        <div v-else-if="currentTab === 'auth'">
          <!-- If logged in, show profile editor -->
          <div v-if="currentUser" style="text-align: left; max-width: 500px; margin: 0 auto;">
            <h2 class="section-title">My Account</h2>
            <div class="sidebar-box">
              <div style="margin-bottom: 15px;">
                <strong>Registered Email:</strong> {{ currentUser.email }}
              </div>
              <div style="margin-bottom: 15px;">
                <strong>Member Role:</strong> <span class="badge-status badge-paid">{{ currentUser.role }}</span>
              </div>
            </div>

            <form @submit.prevent="handleProfileUpdate">
              <h3 style="font-family: var(--font-serif); border-bottom: 1px solid #ccc; padding-bottom: 5px;">Edit Profile Information</h3>
              <div class="form-group">
                <label>Display Name:</label>
                <input type="text" v-model="profileForm.name" placeholder="John Doe" />
              </div>
              <div class="form-group">
                <label>Phone Number:</label>
                <input type="text" v-model="profileForm.phone" placeholder="0812XXXXXXXX" />
              </div>
              <button type="submit" class="btn-yellow" style="width: 150px; font-size:12px; padding: 6px;">Save Changes</button>
            </form>

            <button class="btn-red" style="margin-top: 30px; width: 120px; font-size:12px; padding: 6px;" @click="handleLogout">
              Log Out
            </button>
          </div>

          <!-- If guest, show login/register form -->
          <div v-else style="max-width: 360px; margin: 0 auto; text-align: left; padding: 20px 0;">
            <div style="background-color: #f7f7f7; border: 1px solid var(--border-grey); border-radius: 4px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1)">
              <h2 style="font-family: var(--font-serif); color: var(--netflix-red); font-size: 20px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                {{ authMode === 'login' ? 'Log In' : 'Sign Up Free' }}
              </h2>
              
              <form @submit.prevent="handleAuth">
                <div v-if="authMode === 'register'" class="form-group">
                  <label>Full Name:</label>
                  <input type="text" v-model="authForm.name" required />
                </div>
                
                <div v-if="authMode === 'register'" class="form-group">
                  <label>Phone Number:</label>
                  <input type="text" v-model="authForm.phone" required />
                </div>

                <div class="form-group">
                  <label>Email Address:</label>
                  <input type="email" v-model="authForm.email" required />
                </div>

                <div class="form-group">
                  <label>Password:</label>
                  <input type="password" v-model="authForm.password" required />
                </div>

                <button type="submit" class="btn-red" style="padding: 8px; font-size: 13px;">
                  {{ authMode === 'login' ? 'Enter Member Area' : 'Create Free Account' }}
                </button>
              </form>

              <div style="margin-top: 15px; text-align: center; font-size: 11px; color: var(--text-grey);">
                <span v-if="authMode === 'login'">
                  New to Mancingku? <a @click="authMode = 'register'" style="color: #003399; text-decoration: underline; cursor: pointer;">Register Now!</a>
                </span>
                <span v-else>
                  Have an account? <a @click="authMode = 'login'" style="color: #003399; text-decoration: underline; cursor: pointer;">Log In Here!</a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- SPOT DETAIL MODAL (DVD Info Page Style) -->
    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-content" style="width: 700px;">
        <div class="modal-header">
          <span>Rental Details: {{ selectedSpot.name }}</span>
          <button class="close-btn" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body" style="max-height: 480px; overflow-y: auto;">
          <div class="dvd-detail-container">
            <div class="detail-left">
              <div class="dvd-jacket">
                <img :src="getImageUrl(selectedSpot.image, 'spots')" :alt="selectedSpot.name" class="dvd-image" />
              </div>
            </div>
            
            <div class="detail-right">
              <h2>{{ selectedSpot.name }}</h2>
              <div class="stars" style="margin-bottom: 10px;">
                <span v-for="n in Math.round(selectedSpot.rating || 5)" :key="n">★</span>
                <span class="stars-empty" v-for="n in (5 - Math.round(selectedSpot.rating || 5))" :key="'e'+n">★</span>
                <span style="color:#555; font-size:11px; margin-left: 5px;">(Based on community reviews)</span>
              </div>

              <div class="detail-meta-box">
                <table>
                  <tbody>
                    <tr>
                      <td class="label">Location:</td>
                      <td>{{ selectedSpot.address }}</td>
                    </tr>
                    <tr>
                      <td class="label">Classification:</td>
                      <td><span class="badge-status badge-paid">{{ selectedSpot.category }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p class="detail-description">{{ selectedSpot.description }}</p>
            </div>
          </div>

          <!-- BOOKING RENTAL PROCESS FORM -->
          <div style="background-color: #FFFDE6; border: 1px solid #E6DB55; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <h3 style="font-family: var(--font-serif); margin-top: 0; color: #333; font-size:14px; border-bottom: 1px solid #E6DB55; padding-bottom: 5px;">
              Reserve This Spot (Add to Queue)
            </h3>
            
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>Fishing Date:</label>
                <input type="date" v-model="activeBookingForm.date" />
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Select Session:</label>
                <select v-model="activeBookingForm.sessionId">
                  <option v-for="s in spotSessions" :key="s.id" :value="s.id">
                    {{ s.session_name || 'Session' }} - Rp {{ (s.price || 0).toLocaleString('id-ID') }}
                  </option>
                </select>
              </div>
              <div class="form-group" style="width: 100px;">
                <label>People Count:</label>
                <input type="number" v-model.number="activeBookingForm.totalPeople" min="1" />
              </div>
            </div>

            <!-- Optional Gear Rentals inside Booking Form -->
            <div style="margin-top: 10px;">
              <h4 style="margin: 0 0 5px 0; font-size:12px; color:#555;">Add Gear Rentals (Optional):</h4>
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <div v-for="gear in allGears" :key="'rent-'+gear.id" style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:5px 10px; border:1px solid #ddd; border-radius:2px; font-size:11px;">
                  <div>
                    <span class="bold">{{ gear.name }}</span> (Rp {{ (gear.price || 0).toLocaleString('id-ID') }} / pcs)
                  </div>
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <button v-if="!isGearSelected(gear.id)" class="btn-yellow" style="padding: 2px 8px; width: 60px;" @click="toggleGearSelection(gear)">
                      Add
                    </button>
                    <div v-else style="display: flex; align-items: center; gap: 5px;">
                      <button class="btn-red" style="padding: 1px 6px; width: 20px; font-weight:bold;" @click="updateGearQty(gear.id, -1)">-</button>
                      <span class="bold">{{ getGearQty(gear.id) }}</span>
                      <button class="btn-yellow" style="padding: 1px 6px; width: 20px; font-weight:bold;" @click="updateGearQty(gear.id, 1)">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviews list -->
          <div class="reviews-section">
            <h3 style="font-family: var(--font-serif); font-size:15px; margin: 0 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
              Community Reviews ({{ spotReviews.length }})
            </h3>
            <div v-if="spotReviews.length === 0" style="font-size:12px; color: var(--text-grey); padding: 10px 0;">
              No reviews yet. Be the first to rate after you fish!
            </div>
            <div v-else>
              <div class="review-item" v-for="rev in spotReviews" :key="rev.id">
                <div class="review-header">
                  <span class="bold" style="color:#003399;">User #{{ rev.user_id }}</span>
                  <span style="color:#ffcc00;">{{ '★'.repeat(rev.rating) }}{{ '☆'.repeat(5 - rev.rating) }}</span>
                </div>
                <div class="review-body">"{{ rev.comment }}"</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-red" style="width: 100px;" @click="showDetailModal = false">Cancel</button>
          <button class="btn-yellow" style="width: 150px;" @click="submitBooking">Add to Queue</button>
        </div>
      </div>
    </div>

    <!-- RATE SPOT / REVIEW MODAL -->
    <div class="modal-overlay" v-if="showReviewModal">
      <div class="modal-content" style="width: 400px;">
        <div class="modal-header">
          <span>Write a Review: {{ reviewForm.spotName }}</span>
          <button class="close-btn" @click="showReviewModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Rating:</label>
            <select v-model.number="reviewForm.rating" style="padding: 5px;">
              <option :value="5">⭐⭐⭐⭐⭐ Excellent (5 Stars)</option>
              <option :value="4">⭐⭐⭐⭐ Good (4 Stars)</option>
              <option :value="3">⭐⭐⭐ Average (3 Stars)</option>
              <option :value="2">⭐⭐ Poor (2 Stars)</option>
              <option :value="1">⭐ Terrible (1 Star)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Review Comment:</label>
            <textarea v-model="reviewForm.comment" rows="4" placeholder="How was your fishing experience at this spot? Did you catch any big fish?"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-red" style="width: 80px;" @click="showReviewModal = false">Cancel</button>
          <button class="btn-yellow" style="width: 120px;" @click="submitReview">Submit Review</button>
        </div>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <div class="toast-msg" v-if="toastMessage">
      {{ toastMessage }}
    </div>

    <!-- Footer Netflix 2006 style -->
    <footer>
      <div>
        <a @click="currentTab = 'home'">Mancingku Home</a> | 
        <a @click="currentTab = 'browse'">Browse Categories</a> | 
        <a @click="currentTab = 'gears'">Rent Gears</a> | 
        <a @click="currentTab = 'auth'">Account Profile</a> | 
        <a href="https://github.com" target="_blank">Help Center</a>
      </div>
      <div style="margin-top: 8px;">
        © 2006-2026 Mancingku, Inc. All rights reserved. Member of Indonesia Angler Network.
      </div>
    </footer>
  </div>
</template>
