const fs = require('fs');
const path = require('path');

// Create the composable
const composable = `import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes

/**
 * Auto-logout after 60 minutes of inactivity.
 * Tracks mouse, keyboard, scroll, and touch events.
 * Call this once in App.vue.
 */
export function useIdleLogout() {
  const authStore = useAuthStore()
  const router = useRouter()
  const lastActivity = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  function resetTimer() {
    lastActivity.value = Date.now()
  }

  function checkIdle() {
    if (!authStore.isAuthenticated) return
    const elapsed = Date.now() - lastActivity.value
    if (elapsed >= IDLE_TIMEOUT_MS) {
      // Auto-logout
      authStore.logout()
      router.push({ name: 'login', query: { reason: 'idle' } })
    }
  }

  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

  onMounted(() => {
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    // Check every 30 seconds
    timer = setInterval(checkIdle, 30000)
  })

  onUnmounted(() => {
    events.forEach(e => window.removeEventListener(e, resetTimer))
    if (timer) clearInterval(timer)
  })

  return { lastActivity }
}
`;

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'composables', 'useIdleLogout.ts'),
  composable
);
console.log('Created useIdleLogout.ts');

// Now update App.vue to use it
const appFile = path.join(__dirname, '..', 'src', 'App.vue');
let app = fs.readFileSync(appFile, 'utf-8');

// Add import after existing imports in script setup
if (!app.includes('useIdleLogout')) {
  // Find the script setup tag content
  app = app.replace(
    /<script setup[^>]*>\n/,
    `<script setup lang="ts">\n`
  );
  
  // Add the import and call
  if (app.includes('import ')) {
    // Add after last import
    const lastImportIdx = app.lastIndexOf('\nimport ');
    const endOfLine = app.indexOf('\n', lastImportIdx + 1);
    app = app.substring(0, endOfLine + 1) +
      "import { useIdleLogout } from '@/composables/useIdleLogout'\n" +
      app.substring(endOfLine + 1);
    
    // Add the call after imports (find first non-import line)
    const lines = app.split('\n');
    let insertIdx = -1;
    let inScript = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<script')) inScript = true;
      if (inScript && !lines[i].startsWith('import') && lines[i].trim() !== '' && !lines[i].includes('<script')) {
        insertIdx = i;
        break;
      }
    }
    if (insertIdx > 0 && !app.includes('useIdleLogout()')) {
      lines.splice(insertIdx, 0, '\nuseIdleLogout()\n');
      app = lines.join('\n');
    }
  }
  
  fs.writeFileSync(appFile, app);
  console.log('Updated App.vue with useIdleLogout');
} else {
  console.log('App.vue already has useIdleLogout');
}
