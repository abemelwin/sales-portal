const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\LoginView.vue';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add showPassword ref
content = content.replace(
  "const isSubmitting = ref(false)",
  "const showPassword = ref(false)\nconst isSubmitting = ref(false)"
);

// 2. Change password input type to dynamic and wrap in a div with toggle button
content = content.replace(
  `        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
            :disabled="authStore.isLocked || isSubmitting"
            aria-required="true"
            aria-describedby="password-hint"
          />
          <span id="password-hint" class="sr-only">Enter your account password</span>
        </div>`,
  `        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              :disabled="authStore.isLocked || isSubmitting"
              aria-required="true"
              aria-describedby="password-hint"
            />
            <button
              type="button"
              class="show-pass-btn"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >{{ showPassword ? 'Hide' : 'Show' }}</button>
          </div>
          <span id="password-hint" class="sr-only">Enter your account password</span>
        </div>`
);

// 3. Add CSS for the password wrapper
content = content.replace(
  '.btn-login {',
  `.password-wrapper {
  position: relative;
}

.password-wrapper .form-input {
  padding-right: 60px;
}

.show-pass-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
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
console.log('LoginView updated with show/hide password toggle');
