// State management
let cart = JSON.parse(localStorage.getItem('vesture_cart')) || [];
let orders = JSON.parse(localStorage.getItem('vesture_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('vesture_current_user')) || null;
let activeProduct = null;
let selectedConfig = {
  color: '',
  size: '',
  options: {}
};

// DOM Elements
const productList = document.getElementById('product-list');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountBadges = document.querySelectorAll('.cart-count-badge');
const cartTotalText = document.getElementById('cart-total');
const checkoutModal = document.getElementById('checkout-modal');
const productModal = document.getElementById('product-modal');
const paymentModal = document.getElementById('payment-modal');
const paymentDetailsContainer = document.getElementById('payment-details-container');
const historySidebar = document.getElementById('history-sidebar');
const historyOverlay = document.getElementById('history-overlay');
const historyItemsContainer = document.getElementById('history-items');
const historyCountBadge = document.getElementById('history-count-badge');

// Format Currency to Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}


// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();
  updateHistoryUI();
  updateAuthUI();
  setupEventListeners();
});

// ===================== AUTH SYSTEM =====================

function getAccounts() {
  return JSON.parse(localStorage.getItem('vesture_accounts')) || [];
}
function saveAccounts(accounts) {
  localStorage.setItem('vesture_accounts', JSON.stringify(accounts));
}
function saveCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem('vesture_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('vesture_current_user');
  }
}

// Update header UI based on auth state
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn-header');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userDisplayName = document.getElementById('user-display-name');
  const dropdownEmail = document.getElementById('dropdown-email');

  if (currentUser) {
    loginBtn.classList.remove('flex');
    loginBtn.classList.add('hidden');
    userMenuBtn.classList.remove('hidden');
    userMenuBtn.classList.add('flex');
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase();
    userAvatar.innerText = initial;
    userDisplayName.innerText = currentUser.name || currentUser.email;
    dropdownEmail.innerText = currentUser.email;
  } else {
    loginBtn.classList.remove('hidden');
    loginBtn.classList.add('flex');
    userMenuBtn.classList.remove('flex');
    userMenuBtn.classList.add('hidden');
  }
}

// Gate check: returns true if user can proceed, false if they need to log in
function requireAuth() {
  if (currentUser) return true;
  openGateModal();
  return false;
}

// Auth modal
window.openAuthModal = function(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  switchAuthTab(tab);
  // Clear fields & errors
  ['login-email','login-password','reg-name','reg-email','reg-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['login-error','reg-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

window.closeAuthModal = function() {
  document.getElementById('auth-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

window.switchAuthTab = function(tab) {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  if (tab === 'login') {
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 bg-white text-neutral-900 shadow-sm";
    tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 text-neutral-500";
  } else {
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
    tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 bg-white text-neutral-900 shadow-sm";
    tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 text-neutral-500";
  }
}

// Gate modal
window.openGateModal = function() {
  document.getElementById('gate-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
window.closeGateModal = function() {
  document.getElementById('gate-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// Handle Login
window.handleLogin = function(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const accounts = getAccounts();
  const user = accounts.find(a => a.email === email && a.password === password);

  if (!user) {
    errorEl.innerText = 'Email atau password salah. Silakan coba lagi.';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');
  saveCurrentUser({ email: user.email, name: user.name });
  updateAuthUI();
  closeAuthModal();
}

// Handle Register
window.handleRegister = function(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  if (password.length < 6) {
    errorEl.innerText = 'Password minimal 6 karakter.';
    errorEl.classList.remove('hidden');
    return;
  }

  const accounts = getAccounts();
  if (accounts.find(a => a.email === email)) {
    errorEl.innerText = 'Email ini sudah terdaftar. Silakan masuk.';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');
  accounts.push({ email, password, name });
  saveAccounts(accounts);
  saveCurrentUser({ email, name });
  updateAuthUI();
  closeAuthModal();
}

// Logout
window.logout = function() {
  saveCurrentUser(null);
  cart = [];
  saveCart();
  updateCartUI();
  updateAuthUI();
  closeUserMenu();
}

// User menu dropdown toggle
window.toggleUserMenu = function() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('hidden');
}
window.closeUserMenu = function() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

// Show/hide password
window.togglePasswordVisibility = function(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
  }
}

// ======================================================

// Render Product Catalog
function renderProducts() {
  if (!productList) return;
  productList.innerHTML = products.map(product => {
    // Get default color image or first available color image
    const defaultColor = product.colors[0].key;
    const imgUrl = product.images[defaultColor];
    
    return `
      <div class="group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-all duration-300 flex flex-col">
        <div class="aspect-square bg-neutral-50 overflow-hidden relative">
          <img src="${imgUrl}" alt="${product.name}" 
            id="img-catalog-${product.id}"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-4 left-4 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Premium
          </span>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-semibold text-lg text-neutral-900 group-hover:text-amber-700 transition-colors duration-200">
              ${product.name}
            </h3>
            <p class="text-neutral-500 text-sm mt-1 line-clamp-2">${product.description}</p>
            
            <!-- Quick Color Dots -->
            <div class="flex items-center gap-1.5 mt-3">
              ${product.colors.map(color => `
                <button 
                  title="${color.name}"
                  onclick="changeCatalogImage('${product.id}', '${color.key}', '${product.images[color.key]}')"
                  class="w-4 h-4 rounded-full border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black transition-all hover:scale-110"
                  style="background-color: ${color.hex}">
                </button>
              `).join('')}
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-neutral-50 flex items-center justify-between">
            <span class="font-bold text-neutral-900 text-lg">${formatRupiah(product.basePrice)}</span>
            <button 
              onclick="openProductModal('${product.id}')"
              class="bg-neutral-900 hover:bg-amber-800 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm flex items-center gap-1">
              Pilih Opsi
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Change main catalog image when clicking color swatch on main page
window.changeCatalogImage = function(productId, colorKey, imgPath) {
  const imgElement = document.getElementById(`img-catalog-${productId}`);
  if (imgElement) {
    imgElement.src = imgPath;
  }
}

// Open Detail/Variant Selection Modal
window.openProductModal = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  activeProduct = product;
  
  // Set default configurations
  selectedConfig.color = product.colors[0].key;
  selectedConfig.size = product.sizes[0].name;
  selectedConfig.options = {};
  
  // Initialize dynamic options to their first choices
  if (product.options) {
    product.options.forEach(opt => {
      selectedConfig.options[opt.id] = opt.choices[0].name;
    });
  }

  renderProductModal();
  productModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Lock scrolling
}

// Render dynamic elements inside Product Selection Modal
function renderProductModal() {
  if (!activeProduct) return;

  const product = activeProduct;
  const currentImage = product.images[selectedConfig.color];
  const totalPrice = calculateUnitPrice(product, selectedConfig);

  // Dynamic content structure inside the modal container
  const container = document.getElementById('product-modal-content');
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Product Images & Preview -->
      <div class="aspect-square w-full rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100">
        <img id="modal-product-image" src="${currentImage}" alt="${product.name}" class="w-full h-full object-cover">
      </div>

      <!-- Option Selectors -->
      <div class="flex flex-col justify-between">
        <div>
          <!-- Title & Price -->
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-neutral-900">${product.name}</h2>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-2xl font-black text-amber-800" id="modal-price-display">${formatRupiah(totalPrice)}</span>
              <span class="text-xs text-neutral-500 font-medium bg-neutral-100 px-2.5 py-1 rounded">100% Cotton</span>
            </div>
            <p class="text-neutral-600 text-sm mt-3 leading-relaxed">${product.description}</p>
          </div>

          <!-- Color Options -->
          <div class="mb-5 border-t border-neutral-100 pt-4">
            <span class="block text-sm font-semibold text-neutral-900 mb-2">Pilih Warna: <span class="font-normal text-neutral-500">${product.colors.find(c => c.key === selectedConfig.color).name}</span></span>
            <div class="flex items-center gap-3">
              ${product.colors.map(color => {
                const isSelected = selectedConfig.color === color.key;
                return `
                  <button 
                    onclick="selectModalColor('${color.key}')"
                    class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-amber-800 scale-110 shadow' : 'border-neutral-200 hover:border-neutral-400'} flex items-center justify-center p-0.5 transition-all focus:outline-none"
                    title="${color.name}">
                    <span class="w-full h-full rounded-full" style="background-color: ${color.hex}"></span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Size Options -->
          <div class="mb-5 border-t border-neutral-100 pt-4">
            <span class="block text-sm font-semibold text-neutral-900 mb-2">Pilih Ukuran: <span class="font-normal text-neutral-500">${selectedConfig.size}</span></span>
            <div class="flex flex-wrap gap-2">
              ${product.sizes.map(size => {
                const isSelected = selectedConfig.size === size.name;
                const surcharge = size.extraPrice > 0 ? ` (+${formatRupiah(size.extraPrice)})` : '';
                return `
                  <button 
                    onclick="selectModalSize('${size.name}')"
                    class="px-4 py-2 text-sm font-medium border rounded-xl transition-all duration-150 ${isSelected ? 'border-amber-800 bg-amber-50/50 text-amber-900 font-semibold' : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'}">
                    ${size.name}${surcharge}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Other Custom Options (e.g. Sablon, Packaging) -->
          ${product.options ? product.options.map(opt => `
            <div class="mb-5 border-t border-neutral-100 pt-4">
              <span class="block text-sm font-semibold text-neutral-900 mb-2">${opt.name}</span>
              <div class="flex flex-col gap-2">
                ${opt.choices.map(choice => {
                  const isSelected = selectedConfig.options[opt.id] === choice.name;
                  const surcharge = choice.extraPrice > 0 ? ` (+${formatRupiah(choice.extraPrice)})` : '';
                  return `
                    <label class="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-neutral-50/50 transition-colors ${isSelected ? 'border-amber-800 bg-amber-50/30' : 'border-neutral-200'}">
                      <div class="flex items-center gap-2.5">
                        <input type="radio" name="option-${opt.id}" 
                          value="${choice.name}" 
                          ${isSelected ? 'checked' : ''} 
                          onclick="selectModalExtraOption('${opt.id}', '${choice.name}')"
                          class="text-amber-800 focus:ring-amber-500 h-4 w-4 border-neutral-300">
                        <span class="text-sm font-medium text-neutral-800">${choice.name}</span>
                      </div>
                      <span class="text-xs text-neutral-500">${surcharge || 'Gratis'}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('') : ''}
        </div>

        <!-- Action Area -->
        <div class="mt-6 pt-4 border-t border-neutral-100 flex gap-4">
          <div class="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
            <button onclick="adjustModalQty(-1)" class="px-3 py-2 text-neutral-600 hover:bg-neutral-200 transition-colors focus:outline-none">-</button>
            <span id="modal-qty" class="px-4 py-2 font-semibold text-neutral-950 min-w-[3rem] text-center">1</span>
            <button onclick="adjustModalQty(1)" class="px-3 py-2 text-neutral-600 hover:bg-neutral-200 transition-colors focus:outline-none">+</button>
          </div>
          <button 
            onclick="addSelectedToCart()"
            class="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md shadow-amber-900/10 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Tambah Ke Keranjang
          </button>
        </div>
      </div>
    </div>
  `;
}

// Modal Event Handlers
window.closeProductModal = function() {
  productModal.classList.add('hidden');
  document.body.style.overflow = '';
  activeProduct = null;
}

window.selectModalColor = function(colorKey) {
  selectedConfig.color = colorKey;
  renderProductModal();
}

window.selectModalSize = function(sizeName) {
  selectedConfig.size = sizeName;
  renderProductModal();
}

window.selectModalExtraOption = function(optionId, choiceName) {
  selectedConfig.options[optionId] = choiceName;
  renderProductModal();
}

window.adjustModalQty = function(amount) {
  const qtyEl = document.getElementById('modal-qty');
  let currentQty = parseInt(qtyEl.innerText);
  currentQty = Math.max(1, currentQty + amount);
  qtyEl.innerText = currentQty;
}

// Calculate Price for specific config
function calculateUnitPrice(product, config) {
  let price = product.basePrice;
  
  // Size extra cost
  const sizeObj = product.sizes.find(s => s.name === config.size);
  if (sizeObj) {
    price += sizeObj.extraPrice;
  }
  
  // Custom options extra cost
  if (product.options) {
    product.options.forEach(opt => {
      const selectedChoiceName = config.options[opt.id];
      const choiceObj = opt.choices.find(c => c.name === selectedChoiceName);
      if (choiceObj) {
        price += choiceObj.extraPrice;
      }
    });
  }
  
  return price;
}

// Add configured product to cart
window.addSelectedToCart = function() {
  if (!activeProduct) return;
  if (!requireAuth()) return; // 🔒 Auth gate
  
  const quantity = parseInt(document.getElementById('modal-qty').innerText);
  const unitPrice = calculateUnitPrice(activeProduct, selectedConfig);
  
  // Generate a unique ID based on selections
  const optionsString = Object.entries(selectedConfig.options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  const cartItemId = `${activeProduct.id}-${selectedConfig.color}-${selectedConfig.size}-${optionsString}`;
  
  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(item => item.cartItemId === cartItemId);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
    cart[existingItemIndex].totalPrice = cart[existingItemIndex].quantity * cart[existingItemIndex].unitPrice;
  } else {
    // Fetch descriptive strings
    const colorName = activeProduct.colors.find(c => c.key === selectedConfig.color).name;
    
    cart.push({
      cartItemId,
      productId: activeProduct.id,
      name: activeProduct.name,
      image: activeProduct.images[selectedConfig.color],
      color: colorName,
      colorKey: selectedConfig.color,
      size: selectedConfig.size,
      options: { ...selectedConfig.options },
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity
    });
  }
  
  saveCart();
  updateCartUI();
  closeProductModal();
  openCart(); // Show cart drawer to confirm addition
}

// Cart Drawer management
window.toggleCart = function() {
  const isHidden = cartSidebar.classList.contains('translate-x-full');
  if (isHidden) {
    openCart();
  } else {
    closeCart();
  }
}

window.openCart = function() {
  cartSidebar.classList.remove('translate-x-full');
  cartOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeCart = function() {
  cartSidebar.classList.add('translate-x-full');
  cartOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Save Cart to LocalStorage
function saveCart() {
  localStorage.setItem('vesture_cart', JSON.stringify(cart));
}

// Update Cart Display & Badges
function updateCartUI() {
  // Update badges
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadges.forEach(badge => {
    badge.innerText = totalItems;
    if (totalItems > 0) {
      badge.classList.remove('scale-0');
      badge.classList.add('scale-100');
    } else {
      badge.classList.remove('scale-100');
      badge.classList.add('scale-0');
    }
  });

  // Render items
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-20 h-20 text-neutral-300 mb-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p class="text-neutral-500 font-medium">Keranjang belanja Anda kosong</p>
        <button onclick="closeCart()" class="mt-4 text-sm font-semibold text-amber-800 hover:text-amber-900 underline">Mulai Belanja</button>
      </div>
    `;
    cartTotalText.innerText = formatRupiah(0);
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => {
    // Generate description list of custom options
    const optionsText = Object.entries(item.options)
      .map(([k, v]) => v)
      .join(', ');
      
    return `
      <div class="flex gap-4 py-4 border-b border-neutral-100 items-start">
        <div class="w-20 h-20 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 flex-shrink-0">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-neutral-900 truncate">${item.name}</h4>
          <p class="text-xs text-neutral-500 mt-0.5">
            Warna: ${item.color} | Ukuran: ${item.size}
          </p>
          ${optionsText ? `<p class="text-xs text-amber-800/80 font-medium mt-1">${optionsText}</p>` : ''}
          
          <div class="flex items-center justify-between mt-3">
            <!-- Qty Selectors -->
            <div class="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white text-xs">
              <button onclick="adjustCartItemQty('${item.cartItemId}', -1)" class="px-2.5 py-1 text-neutral-500 hover:bg-neutral-100 focus:outline-none">-</button>
              <span class="px-3 py-1 font-semibold text-neutral-900 min-w-[2rem] text-center">${item.quantity}</span>
              <button onclick="adjustCartItemQty('${item.cartItemId}', 1)" class="px-2.5 py-1 text-neutral-500 hover:bg-neutral-100 focus:outline-none">+</button>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-neutral-900">${formatRupiah(item.totalPrice)}</span>
              <button onclick="removeCartItem('${item.cartItemId}')" class="text-neutral-400 hover:text-red-500 transition-colors focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  cartTotalText.innerText = formatRupiah(cartTotal);
}

// Adjust quantity in Cart drawer
window.adjustCartItemQty = function(cartItemId, amount) {
  const itemIndex = cart.findIndex(item => item.cartItemId === cartItemId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += amount;
    
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].totalPrice = cart[itemIndex].quantity * cart[itemIndex].unitPrice;
    }
    
    saveCart();
    updateCartUI();
  }
}

// Remove item from Cart
window.removeCartItem = function(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  saveCart();
  updateCartUI();
}

// Save Orders to LocalStorage
function saveOrders() {
  localStorage.setItem('vesture_orders', JSON.stringify(orders));
}

// Update History Display & Count
function updateHistoryUI() {
  if (!historyCountBadge || !historyItemsContainer) return;
  
  historyCountBadge.innerText = orders.length;

  if (orders.length === 0) {
    historyItemsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-16 h-16 text-neutral-300 mb-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-neutral-500 font-medium text-sm">Belum ada riwayat pembelian</p>
        <p class="text-xs text-neutral-400 mt-1 max-w-xs">Pesanan yang Anda buat di website ini akan tercatat secara lokal di sini.</p>
      </div>
    `;
    return;
  }

  // Sort orders by date descending
  const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

  historyItemsContainer.innerHTML = sortedOrders.map(order => {
    const formattedDate = new Date(order.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let statusClass = '';
    let statusText = '';
    
    switch (order.status) {
      case 'Menunggu Pembayaran':
        statusClass = 'bg-amber-50 text-amber-800 border-amber-200/60';
        statusText = 'Menunggu Pembayaran';
        break;
      case 'Diproses':
        statusClass = 'bg-blue-50 text-blue-800 border-blue-200/60';
        statusText = 'Diproses (Lunas)';
        break;
      case 'Selesai':
        statusClass = 'bg-green-50 text-green-800 border-green-200/60';
        statusText = 'Selesai';
        break;
      default:
        statusClass = 'bg-neutral-50 text-neutral-850 border-neutral-205/60';
        statusText = order.status;
    }

    const itemsSummary = order.items.map(item => `
      <div class="flex gap-3 py-2 items-center">
        <img src="${item.image}" alt="${item.name}" class="w-10 h-10 object-cover rounded-lg border border-neutral-100 flex-shrink-0">
        <div class="flex-grow min-w-0">
          <p class="text-xs font-semibold text-neutral-900 truncate">${item.name}</p>
          <p class="text-[10px] text-neutral-500 mt-0.5">
            Warna: ${item.color} | Ukuran: ${item.size} | Qty: ${item.quantity}
          </p>
        </div>
        <span class="text-xs font-bold text-neutral-900">${formatRupiah(item.totalPrice)}</span>
      </div>
    `).join('<div class="border-t border-neutral-100/50"></div>');

    let actionButton = '';
    if (order.status === 'Menunggu Pembayaran') {
      actionButton = `
        <button 
          onclick="payPendingOrder('${order.id}')"
          class="w-full mt-4 bg-amber-800 hover:bg-amber-900 text-white font-bold py-2 rounded-xl text-xs transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.958-.59-1.172-.88-1.172-2.303 0-3.183 1.171-.879 3.07-.879 4.242 0L15 9" />
          </svg>
          Bayar Sekarang
        </button>
      `;
    } else if (order.status === 'Diproses') {
      actionButton = `
        <button 
          onclick="completeOrder('${order.id}')"
          class="w-full mt-4 bg-neutral-900 hover:bg-neutral-950 text-white font-semibold py-2 rounded-xl text-xs transition-colors duration-200 flex items-center justify-center gap-1.5">
          Konfirmasi Barang Diterima
        </button>
      `;
    }

    return `
      <div class="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <span class="text-xs font-bold text-neutral-950 block">${order.id}</span>
            <span class="text-[10px] text-neutral-400 mt-0.5 block">${formattedDate}</span>
          </div>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusClass}">
            ${statusText}
          </span>
        </div>
        
        <div class="divide-y divide-neutral-100">
          ${itemsSummary}
        </div>
        
        <div class="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div class="text-[10px] text-neutral-500">
            Metode: <span class="font-bold text-neutral-700">${order.payment.toUpperCase()}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-neutral-400 block">Total Belanja</span>
            <span class="text-sm font-extrabold text-amber-800">${formatRupiah(order.total)}</span>
          </div>
        </div>
        
        ${actionButton}
      </div>
    `;
  }).join('');
}

// Global Order actions
window.payPendingOrder = function(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  closeHistory();
  openPaymentModal(order);
}

window.completeOrder = function(orderId) {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = 'Selesai';
    saveOrders();
    updateHistoryUI();
  }
}

// History Sidebar Drawer management
window.openHistory = function() {
  closeCart();
  historySidebar.classList.remove('translate-x-full');
  historyOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeHistory = function() {
  historySidebar.classList.add('translate-x-full');
  historyOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Payment Modal triggers
window.openPaymentModal = function(order) {
  // Setup dynamic content inside payment modal based on payment type
  let paymentContent = '';
  
  const formattedPrice = formatRupiah(order.total);
  
  if (order.payment === 'bca' || order.payment === 'mandiri') {
    const isBCA = order.payment === 'bca';
    const bankName = isBCA ? 'BCA' : 'Mandiri';
    const vaNumber = isBCA ? '800123456789' : '800987654321';
    
    paymentContent = `
      <div class="text-center py-4 bg-amber-50/50 rounded-2xl border border-amber-100">
        <span class="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Total Tagihan</span>
        <h2 class="text-2xl font-black text-amber-800 mt-1">${formattedPrice}</h2>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
          <div>
            <span class="text-[10px] text-neutral-400 font-semibold block uppercase">Bank Transfer (${bankName})</span>
            <span id="va-number-text" class="text-base font-bold text-neutral-900 tracking-wider">${vaNumber}</span>
          </div>
          <button 
            onclick="copyToClipboard('${vaNumber}', this)"
            class="px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-400 text-xs font-semibold rounded-xl transition-all duration-200 focus:outline-none flex items-center gap-1">
            Salin
          </button>
        </div>

        <div class="text-xs text-neutral-600 space-y-2 border-t border-neutral-100 pt-4">
          <p class="font-bold text-neutral-800">Petunjuk Pembayaran:</p>
          <ol class="list-decimal list-inside space-y-1.5 pl-1">
            <li>Buka aplikasi m-Banking Anda.</li>
            <li>Pilih menu <strong class="text-neutral-900">Transfer > Virtual Account</strong>.</li>
            <li>Masukkan nomor Virtual Account di atas.</li>
            <li>Pastikan nama merchant adalah <strong class="text-neutral-900">VESTURE LAB CO</strong>.</li>
            <li>Periksa nominal lalu konfirmasi pembayaran Anda.</li>
          </ol>
        </div>
      </div>
    `;
  } else {
    // QRIS / GoPay / E-Wallet instructions
    paymentContent = `
      <div class="text-center py-4 bg-amber-50/50 rounded-2xl border border-amber-100">
        <span class="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Total Tagihan</span>
        <h2 class="text-2xl font-black text-amber-800 mt-1">${formattedPrice}</h2>
      </div>

      <div class="flex flex-col items-center gap-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
        <!-- Premium Simulated QRIS Code SVG -->
        <div class="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm w-48 h-48 flex flex-col justify-between items-center relative">
          <!-- QRIS Logo Mockup header -->
          <div class="text-[10px] font-black tracking-widest text-amber-900 border-b border-amber-900 pb-0.5 mb-1.5 uppercase w-full text-center">
            QRIS Nnasional
          </div>
          <!-- Stylized QR Grid using simple SVG pattern -->
          <svg class="w-32 h-32 text-neutral-900" viewBox="0 0 100 100" fill="currentColor">
            <!-- Corners -->
            <rect x="0" y="0" width="25" height="25" />
            <rect x="5" y="5" width="15" height="15" fill="white" />
            <rect x="9" y="9" width="7" height="7" />
            
            <rect x="75" y="0" width="25" height="25" />
            <rect x="80" y="5" width="15" height="15" fill="white" />
            <rect x="84" y="9" width="7" height="7" />
            
            <rect x="0" y="75" width="25" height="25" />
            <rect x="5" y="80" width="15" height="15" fill="white" />
            <rect x="9" y="84" width="7" height="7" />
            
            <!-- Random simulated QR blocks -->
            <rect x="35" y="5" width="10" height="5" />
            <rect x="55" y="0" width="5" height="15" />
            <rect x="30" y="20" width="15" height="10" />
            <rect x="60" y="20" width="10" height="5" />
            <rect x="50" y="30" width="20" height="10" />
            <rect x="10" y="35" width="15" height="5" />
            <rect x="0" y="45" width="10" height="15" />
            <rect x="25" y="45" width="20" height="25" />
            <rect x="55" y="50" width="10" height="10" />
            <rect x="75" y="40" width="15" height="15" />
            <rect x="35" y="75" width="10" height="15" />
            <rect x="50" y="75" width="15" height="5" />
            <rect x="70" y="70" width="25" height="10" />
            <rect x="85" y="85" width="15" height="15" />
          </svg>
          <div class="text-[8px] text-neutral-400 font-semibold mt-1">Dicetak otomatis oleh Vesture Lab</div>
        </div>
        <p class="text-xs text-neutral-500 text-center max-w-[280px]">Pindai QR di atas menggunakan aplikasi dompet digital (GoPay, OVO, Dana, LinkAja) atau m-Banking Anda.</p>
      </div>
    `;
  }

  // Append confirmation actions (mock upload / confirm pay)
  paymentContent += `
    <div class="border-t border-neutral-100 pt-5 space-y-4">
      <div>
        <label class="block text-xs font-bold text-neutral-700 uppercase mb-1">Unggah Bukti Transfer (Opsional)</label>
        <div class="relative border border-dashed border-neutral-200 rounded-xl p-4 flex items-center justify-center hover:bg-neutral-50 transition-colors cursor-pointer bg-neutral-50/20">
          <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" id="mock-proof-upload" onchange="handleProofUpload(this)">
          <div class="text-center" id="upload-status-text">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5 mx-auto text-neutral-450 text-neutral-500 mb-1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <span class="text-xs text-neutral-600 font-medium">Klik untuk pilih gambar bukti pembayaran</span>
          </div>
        </div>
      </div>

      <button 
        onclick="confirmPayment('${order.id}')"
        class="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
        Saya Sudah Bayar
      </button>
    </div>
  `;
  
  paymentDetailsContainer.innerHTML = paymentContent;
  paymentModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closePaymentModal = function() {
  paymentModal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Handle simulated upload state change
window.handleProofUpload = function(input) {
  const statusText = document.getElementById('upload-status-text');
  if (input.files && input.files[0]) {
    statusText.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mx-auto text-green-600 mb-1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-xs text-green-600 font-semibold">${input.files[0].name} terpilih</span>
    `;
  }
}

// Copy to Clipboard Utility
window.copyToClipboard = function(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement.innerText;
    btnElement.innerText = 'Tersalin!';
    btnElement.classList.add('bg-green-50', 'text-green-800', 'border-green-300');
    setTimeout(() => {
      btnElement.innerText = originalText;
      btnElement.classList.remove('bg-green-50', 'text-green-800', 'border-green-300');
    }, 2000);
  }).catch(err => {
    console.error('Gagal menyalin: ', err);
  });
}

// Submit Checkout Form
window.submitCheckoutForm = function(event) {
  event.preventDefault();
  
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const shipping = document.getElementById('cust-shipping').value;
  const payment = document.getElementById('cust-payment').value;
  
  if (!name || !phone || !address || !shipping || !payment) {
    alert("Harap isi semua kolom informasi pelanggan serta pilih jasa kirim dan metode pembayaran.");
    return;
  }
  
  // Create simulated order record
  const newOrder = {
    id: 'VST-' + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toISOString(),
    customer: { name, phone, address },
    shipping,
    payment,
    items: [...cart],
    total: cart.reduce((sum, item) => sum + item.totalPrice, 0),
    status: 'Menunggu Pembayaran'
  };

  // Push to local state and storage
  orders.push(newOrder);
  saveOrders();
  updateHistoryUI();

  // Reset Cart
  cart = [];
  saveCart();
  updateCartUI();
  
  // Transition to Payment stage
  closeCheckoutModal();
  openPaymentModal(newOrder);
}

// Confirm Payment action (simulate server-side hook verifying)
window.confirmPayment = function(orderId) {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = 'Diproses';
    saveOrders();
    updateHistoryUI();
    
    const order = orders[orderIndex];
    closePaymentModal();
    
    // Show success dialog
    showSuccessReceipt(order.id, order.customer.name, order.total, order.payment);
  }
}

// Checkout Modal triggers
window.openCheckoutModal = function() {
  if (cart.length === 0) return;
  closeCart();
  
  // Reset values
  document.getElementById('cust-shipping').value = "";
  document.getElementById('cust-payment').value = "";
  
  // Reset button styles
  const shippingMethods = ['jne', 'jnt', 'sicepat', 'gojek'];
  shippingMethods.forEach(m => {
    const btn = document.getElementById(`ship-${m}`);
    if (btn) {
      btn.className = "flex items-center justify-between p-3.5 border rounded-xl hover:bg-neutral-50 transition-all text-left border-neutral-200 text-neutral-700";
      const dotContainer = btn.querySelector('.rounded-full:last-child');
      if (dotContainer) {
        dotContainer.className = "w-4 h-4 rounded-full border border-neutral-300";
        dotContainer.innerHTML = '';
      }
    }
  });

  const paymentMethods = ['bca', 'mandiri', 'gopay', 'qris'];
  paymentMethods.forEach(m => {
    const btn = document.getElementById(`pay-${m}`);
    if (btn) {
      btn.className = "flex items-center justify-between p-3.5 border rounded-xl hover:bg-neutral-50 transition-all text-left border-neutral-200 text-neutral-700";
      const dotContainer = btn.querySelector('.rounded-full:last-child');
      if (dotContainer) {
        dotContainer.className = "w-4 h-4 rounded-full border border-neutral-300";
        dotContainer.innerHTML = '';
      }
    }
  });

  checkoutModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeCheckoutModal = function() {
  checkoutModal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Display order receipt inside visual success screen
function showSuccessReceipt(orderId, name, total, payment) {
  const receiptContainer = document.getElementById('success-receipt-container');
  const receiptModal = document.getElementById('success-modal');
  
  receiptContainer.innerHTML = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-neutral-900">Pembayaran Berhasil!</h3>
      <p class="text-neutral-500 text-xs mt-1">Pembayaran Anda telah diterima dan pesanan sedang diproses.</p>
    </div>
    
    <div class="bg-neutral-50 rounded-2xl p-5 text-sm space-y-3.5 border border-neutral-100 font-mono">
      <div class="flex justify-between pb-3 border-b border-dashed border-neutral-300">
        <span class="text-neutral-500">ID PESANAN</span>
        <span class="font-bold text-neutral-900">${orderId}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-neutral-500">Pelanggan</span>
        <span class="font-semibold text-neutral-900">${name}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-neutral-500">Metode</span>
        <span class="font-semibold text-neutral-900">${payment.toUpperCase()}</span>
      </div>
      <div class="flex justify-between pt-3 border-t border-dashed border-neutral-300 text-base">
        <span class="font-bold text-neutral-900">Total</span>
        <span class="font-extrabold text-amber-800">${formatRupiah(total)}</span>
      </div>
    </div>
  `;
  
  receiptModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeSuccessModal = function() {
  document.getElementById('success-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

window.openGuideModal = function() {
  document.getElementById('guide-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeGuideModal = function() {
  document.getElementById('guide-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// Custom Selectors for Checkout Courier & Payment
window.selectShipping = function(method) {
  document.getElementById('cust-shipping').value = method;
  const methods = ['jne', 'jnt', 'sicepat', 'gojek'];
  methods.forEach(m => {
    const btn = document.getElementById(`ship-${m}`);
    if (!btn) return;
    const dotContainer = btn.querySelector('.rounded-full:last-child');
    if (m === method) {
      btn.className = "flex items-center justify-between p-3.5 border rounded-xl hover:bg-neutral-50 transition-all text-left border-amber-800 bg-amber-50/30 text-neutral-900 font-semibold";
      dotContainer.className = "w-4 h-4 rounded-full border border-amber-800 flex items-center justify-center";
      dotContainer.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-amber-800"></div>';
    } else {
      btn.className = "flex items-center justify-between p-3.5 border rounded-xl hover:bg-neutral-50 transition-all text-left border-neutral-200 text-neutral-700";
      dotContainer.className = "w-4 h-4 rounded-full border border-neutral-300";
      dotContainer.innerHTML = '';
    }
  });
}

window.selectPayment = function(method) {
  document.getElementById('cust-payment').value = method;
  const methods = ['bca', 'mandiri', 'gopay', 'qris'];
  methods.forEach(m => {
    const btn = document.getElementById(`pay-${m}`);
    if (!btn) return;
    const dotContainer = btn.querySelector('.rounded-full:last-child');
    if (m === method) {
      btn.className = "flex items-center justify-between p-3.5 border rounded-xl hover:bg-neutral-50 transition-all text-left border-amber-800 bg-amber-50/30 text-neutral-900 font-semibold";
      dotContainer.className = "w-4 h-4 rounded-full border border-amber-800 flex items-center justify-center";
      dotContainer.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-amber-800"></div>';
    } else {
      btn.className = "flex items-center justify-between p-3.5 border rounded-xl hover:bg-neutral-50 transition-all text-left border-neutral-200 text-neutral-700";
      dotContainer.className = "w-4 h-4 rounded-full border border-neutral-300";
      dotContainer.innerHTML = '';
    }
  });
}

// Global Event Listeners Setup
function setupEventListeners() {
  const guideModal = document.getElementById('guide-modal');
  const authModal = document.getElementById('auth-modal');
  const gateModal = document.getElementById('gate-modal');

  // Close modals on overlay clicks
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });
  
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) closeCheckoutModal();
  });
  
  paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal) closePaymentModal();
  });

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  gateModal.addEventListener('click', (e) => {
    if (e.target === gateModal) closeGateModal();
  });
  
  if (guideModal) {
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) closeGuideModal();
    });
  }
  
  cartOverlay.addEventListener('click', closeCart);
  historyOverlay.addEventListener('click', closeHistory);

  // Close user dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const userMenuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && dropdown && !userMenuBtn.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
  
  // Escape key support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      closeCart();
      closeCheckoutModal();
      closeSuccessModal();
      closeGuideModal();
      closePaymentModal();
      closeHistory();
      closeAuthModal();
      closeGateModal();
      closeUserMenu();
    }
  });
}
