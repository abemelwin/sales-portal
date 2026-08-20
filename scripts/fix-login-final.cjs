const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\LoginView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Fix: replace type="password" with dynamic binding
content = content.replace(
  '            type="password"\n            class="form-input"\n            placeholder="Enter your password"',
  '            :type="showPassword ? \'text\' : \'password\'"\n            class="form-input"\n            placeholder="Enter your password"'
);

// Add Show/Hide button after the password input closing tag
content = content.replace(
  '            aria-describedby="password-hint"\n          />\n          <span id="password-hint"',
  '            aria-describedby="password-hint"\n          />\n          <button type="button" class="show-pass-btn" @click="showPassword = !showPassword" tabindex="-1">{{ showPassword ? \'Hide\' : \'Show\' }}</button>\n          <span id="password-hint"'
);

// Add CSS
content = content.replace(
  '.btn-login {',
  `.form-group:has(#password) {
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
}

.btn-login {`
);

fs.writeFileSync(file, content);
console.log('Show password toggle added');
