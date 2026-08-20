const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\LoginView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace email ref initialization
content = content.replace(
  "const email = ref('')",
  "const LAST_EMAIL_KEY = 'espmi_last_email'\nconst email = ref(localStorage.getItem(LAST_EMAIL_KEY) || '')"
);

// Add save on successful login
content = content.replace(
  "if (result.success) {",
  "if (result.success) {\n      // Remember last email for next login\n      localStorage.setItem(LAST_EMAIL_KEY, email.value)"
);

fs.writeFileSync(file, content);
console.log('LoginView patched - remembers last email');
