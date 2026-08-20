const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\LoginView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace type="password" with dynamic binding using regex
content = content.replace(
  /type="password"/,
  ':type="showPassword ? \'text\' : \'password\'"'
);

// Add Show button after the password /> closing - use regex
content = content.replace(
  /(aria-describedby="password-hint"\s*\/>)/,
  '$1\n          <button type="button" class="show-pass-btn" @click="showPassword = !showPassword" tabindex="-1">{{ showPassword ? \'Hide\' : \'Show\' }}</button>'
);

// Add CSS if not already added
if (!content.includes('.show-pass-btn')) {
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
}

fs.writeFileSync(file, content);
console.log('Done - show password toggle added');
