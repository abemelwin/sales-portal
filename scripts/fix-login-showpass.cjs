const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\LoginView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add showPassword ref
content = content.replace(
  "const isSubmitting = ref(false)",
  "const isSubmitting = ref(false)\nconst showPassword = ref(false)"
);

// Change password input type to dynamic
content = content.replace(
  /type="password"/g,
  ':type="showPassword ? \'text\' : \'password\'"'
);

// Add show/hide toggle after the password input - find the password field wrapper
content = content.replace(
  /(placeholder="Enter your password"\s*\n\s*class="login-input")/,
  '$1\n          />\n          <button\n            type="button"\n            class="show-pass-btn"\n            @click="showPassword = !showPassword"\n          >\n            {{ showPassword ? \'Hide\' : \'Show\' }}\n          </button>\n        </div>\n        <!-- replaced closing --'
);

fs.writeFileSync(file, content);
console.log('done - but need manual template fix');
