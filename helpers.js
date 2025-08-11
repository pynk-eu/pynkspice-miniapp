
// Helper functions and configuration
const CONFIG = {
  MENU_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=992284381&single=true&output=csv",
  REVIEWS_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=1322846949&single=true&output=csv",
  TRANSLATIONS_CSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQHnNBBe-HYhjO85fzpjgHz0zKu2OwUJYU3xR3zKBOQHSCtvhpTP2Xu7bbSwSZul7Gcy8bkwOven8/pub?gid=0&single=true&output=csv",
  REVIEW_POST_URL: "https://script.google.com/macros/s/AKfycbxF4mA0AYUNHjVCQPXFWOO7aT1KO3wDkRSckHtQDl7QqW2OPcbrBozIM4ZHrpbrvqgP/exec" // You'll deploy an Apps Script to append reviews (instructions in apps_script_example.txt)
};

function el(q, parent = document) { return parent.querySelector(q) }
function elAll(q, parent = document) { return Array.from((parent || document).querySelectorAll(q)) }
function formatPrice(p) { return '€' + parseFloat(p || 0).toFixed(2) }
function parseCSVtoArray(csvText) { return Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true }).data }
