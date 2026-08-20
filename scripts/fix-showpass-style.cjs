const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\LoginView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Wrap password input + button in a wrapper div
content = content.replace(
  /(<label for="password" class="form-label">Password<\/label>\s*)<input/,
  '$1<div class="password-wrapper">\n          <input'
);

content = content.replace(
  /(<button type="button" class="show-pass-btn"[^>]*>.*?<\/button>)\s*(<span id="password-hint")/,
  '$1\n          </div>\n          $2'
);

// Replace old CSS with proper positioning
const oldCss = `.form-group:has(#password) {
  position: relative;
}

.show-pass-btn {
  position: absolute;
  right: 10px;
  top: 38px;
  background: none;
  border: none;
  color: var(--color-gray-500);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
}

.show-pass-btn:hover {
  color: var(--color-primary);
}`;

const newCss = `.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  padding-right: 56px;
  width: 100%;
}

.show-pass-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #c0392b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
}

.show-pass-btn:hover {
  color: #7b1e13;
  text-decoration: underline;
}`;

content = content.replace(oldCss, newCss);

fs.writeFileSync(file, content);
console.log('Show/Hide password styling fixed');
