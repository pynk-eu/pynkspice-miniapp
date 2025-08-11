
// Main app logic
let state = {
  lang: 'en',
  menu: [],
  reviews: [],
  translations: {},
  cart: []
};

const tpl = document.getElementById('menu-card-tpl');
const menuView = document.getElementById('menu');
const detailsView = document.getElementById('details');
const reviewsView = document.getElementById('reviews');
const ordersView = document.getElementById('orders');
const settingsView = document.getElementById('settings');
const loading = document.getElementById('loading');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

function setLang(l){ state.lang = l; document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active', b.id==='lang-'+l)); renderCurrentView(); }
function t(key){ return state.translations[key]?.[state.lang] || state.translations[key]?.['en'] || key }

function init(){ 
  // Telegram init if available
  if(window.Telegram && Telegram.WebApp){ Telegram.WebApp.ready(); }
  addListeners();
  loadAllData();
}

function addListeners(){
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click', (e)=>{ document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); e.target.classList.add('active'); showTab(e.target.getAttribute('data-tab')) }));
  document.getElementById('lang-en').addEventListener('click', ()=>setLang('en'));
  document.getElementById('lang-de').addEventListener('click', ()=>setLang('de'));
  document.getElementById('view-cart').addEventListener('click', ()=>openCart());
  document.getElementById('checkout').addEventListener('click', ()=>checkout());
}

function loadAllData(){
  Promise.all([fetch(CONFIG.MENU_CSV).then(r=>r.text()), fetch(CONFIG.REVIEWS_CSV).then(r=>r.text()), fetch(CONFIG.TRANSLATIONS_CSV).then(r=>r.text())])
    .then(([m, r, tr])=>{
      state.menu = parseCSVtoArray(m);
      state.reviews = parseCSVtoArray(r);
      const trans = parseCSVtoArray(tr);
      state.translations = {};
      trans.forEach(row=>{ state.translations[row.key] = { en: row.en, de: row.de } });
      loading.style.display = 'none';
      showTab('menu');
    })
    .catch(err=>{ loading.textContent = 'Failed to load data'; console.error(err) });
}

function renderCurrentView(){
  const active = document.querySelector('.tab.active').getAttribute('data-tab');
  showTab(active);
}

function showTab(tab){
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  if(tab==='menu'){ renderMenu(); document.getElementById('menu').classList.remove('hidden') }
  else if(tab==='reviews'){ renderReviews(); document.getElementById('reviews').classList.remove('hidden') }
  else if(tab==='orders'){ renderOrders(); document.getElementById('orders').classList.remove('hidden') }
  else if(tab==='settings'){ renderSettings(); document.getElementById('settings').classList.remove('hidden') }
}

function renderMenu(){
  menuView.innerHTML = '';
  state.menu.forEach(item=>{
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.card');
    const img = node.querySelector('.card-img');
    const title = node.querySelector('.card-title');
    const qty = node.querySelector('.card-qty');
    const price = node.querySelector('.card-price');
    const addBtn = node.querySelector('.add-cart');
    const buyBtn = node.querySelector('.buy-now');
    img.src = item.image_url || 'https://via.placeholder.com/160x120?text=No+Image';
    img.alt = item['name_'+state.lang] || item.name_en;
    title.textContent = item['name_'+state.lang] || item.name_en;
    qty.textContent = item.quantity ? item.quantity : '';
    price.textContent = formatPrice(item.price);
    addBtn.textContent = t('add_to_cart') || 'Add to Cart';
    buyBtn.textContent = t('buy_now') || 'Buy Now';
    addBtn.addEventListener('click', (e)=>{ e.stopPropagation(); addToCart(item); });
    buyBtn.addEventListener('click', (e)=>{ e.stopPropagation(); buyNow(item); });
    // clicking card opens details
    card.addEventListener('click', (e)=>{
      // avoid triggering when clicking buttons
      if(e.target.tagName.toLowerCase()==='button') return;
      openDetails(item);
    });
    menuView.appendChild(node);
  });
  updateCartSummary();
}

function openDetails(item){
  detailsView.innerHTML = `
    <img class="detail-img" src="${item.image_url || 'https://via.placeholder.com/800x400?text=No+Image'}" />
    <div class="detail-box">
      <h2>${item['name_'+state.lang] || item.name_en}</h2>
      <p class="small">${item['description_'+state.lang] || item.description_en || ''}</p>
      <p><b>Ingredients:</b> ${item['ingredients_'+state.lang] || item.ingredients_en || ''}</p>
      <p><b>Price:</b> ${formatPrice(item.price)}</p>
      <div class="form-row">
        <label>${t('quantity') || 'Quantity'}</label>
        <select id="detail-qty">${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}</select>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="detail-add" class="add-cart">${t('add_to_cart')||'Add to Cart'}</button>
        <button id="detail-buy" class="buy-now">${t('buy_now')||'Buy Now'}</button>
      </div>
    </div>
  `;
  showView('details');
  document.getElementById('detail-add').addEventListener('click', ()=>{ addToCart(item, parseInt(document.getElementById('detail-qty').value||1)); });
  document.getElementById('detail-buy').addEventListener('click', ()=>{ buyNow(item, parseInt(document.getElementById('detail-qty').value||1)); });
}

function showView(id){ document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); window.scrollTo(0,0); }

function addToCart(item, qty=1){
  const existing = state.cart.find(i=>i.id===item.id);
  if(existing){ existing.qty += qty; } else { state.cart.push({id:item.id, name:item['name_'+state.lang]||item.name_en, price:parseFloat(item.price||0), qty}); }
  updateCartSummary();
  alert((t('add_to_cart')||'Added to cart') + ': ' + (item['name_'+state.lang]||item.name_en));
}

function buyNow(item, qty=1){
  // For buy now, add to cart and navigate to checkout
  addToCart(item, qty);
  checkout();
}

function updateCartSummary(){
  const count = state.cart.reduce((s,i)=>s+i.qty,0);
  const total = state.cart.reduce((s,i)=>s + (i.qty * i.price),0);
  cartCount.textContent = count;
  cartTotal.textContent = formatPrice(total);
}

function openCart(){
  const html = state.cart.length ? `
    <div class="detail-box">
      <h3>Cart</h3>
      ${state.cart.map(i=>`<div style="display:flex;justify-content:space-between;padding:6px 0"><div>${i.name} x ${i.qty}</div><div>${formatPrice(i.price*i.qty)}</div></div>`).join('')}
      <div style="margin-top:10px"><b>Total: ${formatPrice(state.cart.reduce((s,i)=>s+i.qty*i.price,0))}</b></div>
    </div>
  ` : '<div class="center">Cart is empty</div>';
  ordersView.innerHTML = html;
  showTab('orders');
}

function checkout(){
  if(!state.cart.length){ alert('Cart is empty'); return; }
  // For demo: we'll pack order data and send via Telegram.WebApp.sendData if available,
  const order = { items: state.cart, total: state.cart.reduce((s,i)=>s+i.qty*i.price,0), ts: Date.now() };
  if(window.Telegram && Telegram.WebApp){ Telegram.WebApp.sendData(JSON.stringify(order)); alert('Order sent to bot'); state.cart=[]; updateCartSummary(); showTab('menu'); }
  else{ alert('Telegram WebApp not available — in a browser this will just show cart summary.'); openCart(); }
}

function renderReviews(){
  reviewsView.innerHTML = `
    <div class="detail-box">
      <h3>${t('reviews_title')||'Reviews'}</h3>
      ${state.reviews.map(r=>`<div style="padding:6px 0"><b>${r.name||r.user||'Anonymous'}</b><div class="small">${r.review_en||r.review||''}</div></div>`).join('')}
      <hr/>
      <h4>Add a review</h4>
      <div class="form-row"><input id="rev-name" placeholder="Your name"/></div>
      <div class="form-row"><textarea id="rev-text" placeholder="Your review"></textarea></div>
      <div class="form-row"><select id="rev-rating"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div>
      <div><button id="submit-review" class="buy-now">Submit Review</button></div>
    </div>
  `;
  document.getElementById('submit-review').addEventListener('click', submitReview);
}

function submitReview(){
  const name = document.getElementById('rev-name').value || 'Anon';
  const text = document.getElementById('rev-text').value || '';
  const rating = document.getElementById('rev-rating').value || '5';
  if(!text){ alert('Please write a review'); return; }
  // POST to Apps Script endpoint to append review row
  if(CONFIG.REVIEW_POST_URL === 'REPLACE_WITH_APPS_SCRIPT_WEBAPP_URL'){
    alert('Review posting not configured — please deploy the provided Apps Script and paste its URL into helpers.js');
    return;
  }
  fetch(CONFIG.REVIEW_POST_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, review_en: text, rating }) })
    .then(r=>r.json()).then(res=>{
      alert('Thanks — review submitted!');
      // Optimistically add review locally
      state.reviews.unshift({ name, review_en: text, rating });
      renderReviews();
    }).catch(e=>{ alert('Failed to submit review'); console.error(e); });
}

function renderOrders(){ ordersView.innerHTML = '<div class="center">Your orders will appear here (local only for now).</div>'; }

function renderSettings(){ settingsView.innerHTML = `
  <div class="detail-box">
    <h3>${t('settings_title')||'Settings'}</h3>
    <p class="small">Language: <b>${state.lang}</b></p>
    <p class="small">Contact: info@thepynkspice.com</p>
  </div>
`;
}

// init
window.addEventListener('load', init);
