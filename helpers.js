// Helpers + configuration
const CONFIG = {
  MENU_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=992284381&single=true&output=csv",
  REVIEWS_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=1322846949&single=true&output=csv",
  TRANSLATIONS_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=0&single=true&output=csv",
  ORDERS_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=2119967639&single=true&output=csv",
  REVIEW_POST_URL: "https://script.google.com/macros/s/AKfycbz6sfnT-BvLgKeIRKIbGyFi2OZZmOSaCEVr8Y3hg-S-zZpw8hJ3mzXGEpLdyVuNK-ab/exec"
};

function el(q, parent=document){return parent.querySelector(q)}
function elAll(q, parent=document){return Array.from((parent||document).querySelectorAll(q))}
function formatPrice(p){return '€' + parseFloat(p||0).toFixed(2)}
function parseCSVtoArray(csvText){ return Papa.parse(csvText.trim(), {header:true, skipEmptyLines:true}).data }
function getTelegramUserId(){ try{ return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null }catch(e){return null} }
