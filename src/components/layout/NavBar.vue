<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, role, logout: authLogout } = useAuth()

const mobileMenuOpen = ref(false)

/** Truncate display name to 50 chars with ellipsis (Requirement 1.6) */
const displayName = computed(() => {
  const name = user.value?.display_name ?? ''
  if (name.length > 50) {
    return name.slice(0, 50) + '...'
  }
  return name
})

const isAdmin = computed(() => role.value === 'admin')

/** Navigation links visible to all authenticated users */
const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/quotes/new', label: 'Quote Builder' },
  { to: '/pricelist', label: 'Pricelist' },
  { to: '/consumables', label: 'Consumables' },
  { to: '/product-info', label: 'Product Info' },
]

/** Admin-only navigation links (Requirement 2.4, 2.5) */
const adminLinks = [
  { to: '/catalog', label: 'Catalog' },
  { to: '/users', label: 'Users' },
  { to: '/roles', label: 'Roles' },
  { to: '/migrate', label: 'Data Migration' },
]

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

async function handleLogout() {
  await authLogout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar" aria-label="Main navigation">
    <div class="navbar-container">
      <!-- Brand -->
      <div class="navbar-brand">
        <router-link to="/" class="navbar-logo" @click="closeMobileMenu">
          ESPMI Sales Portal
        </router-link>
      </div>

      <!-- Hamburger toggle (mobile) -->
      <button
        class="navbar-toggle"
        :aria-expanded="mobileMenuOpen"
        aria-controls="navbar-menu"
        aria-label="Toggle navigation menu"
        @click="toggleMobileMenu"
      >
        <span class="hamburger-line" />
        <span class="hamburger-line" />
        <span class="hamburger-line" />
      </button>

      <!-- Nav menu -->
      <div
        id="navbar-menu"
        class="navbar-menu"
        :class="{ 'navbar-menu--open': mobileMenuOpen }"
      >
        <!-- Standard nav links -->
        <ul class="navbar-nav">
          <li v-for="link in navLinks" :key="link.to" class="nav-item">
            <router-link :to="link.to" class="nav-link" @click="closeMobileMenu">
              {{ link.label }}
            </router-link>
          </li>

          <!-- Admin-only links (Requirement 2.4) -->
          <template v-if="isAdmin">
            <li v-for="link in adminLinks" :key="link.to" class="nav-item nav-item--admin">
              <router-link :to="link.to" class="nav-link" @click="closeMobileMenu">
                {{ link.label }}
              </router-link>
            </li>
          </template>
        </ul>

        <!-- User info & logout -->
        <div class="navbar-user">
          <span class="navbar-user-name" :title="user?.display_name">
            {{ displayName }}
          </span>
          <button class="navbar-logout-btn" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--nav-height);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.navbar-container {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.navbar-brand {
  flex-shrink: 0;
}

.navbar-logo {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.navbar-logo:hover {
  color: var(--color-primary-hover);
}

/* Hamburger toggle - hidden on desktop */
.navbar-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: var(--space-2);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.navbar-toggle:hover {
  background-color: var(--color-gray-100);
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background-color: var(--color-gray-700);
  border-radius: 1px;
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

/* Nav menu - flex row on desktop */
.navbar-menu {
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: var(--space-6);
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.nav-item {
  display: flex;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  text-decoration: none;
  border-radius: var(--radius-md);
  white-space: nowrap;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 500;
  background-color: var(--color-primary-light);
}

/* User section */
.navbar-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: auto;
  flex-shrink: 0;
}

.navbar-user-name {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-logout-btn {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-error);
  background-color: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}

.navbar-logout-btn:hover {
  color: var(--color-white);
  background-color: var(--color-error);
}

/* ─── Mobile Responsive (< 768px) ─────────────────────────────────────────── */
@media screen and (max-width: 767px) {
  .navbar {
    height: auto;
    min-height: var(--nav-height);
  }

  .navbar-container {
    flex-wrap: wrap;
  }

  .navbar-toggle {
    display: flex;
    margin-left: auto;
  }

  .navbar-menu {
    display: none;
    width: 100%;
    margin-left: 0;
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-3) 0;
    border-top: 1px solid var(--border-color);
  }

  .navbar-menu--open {
    display: flex;
  }

  .navbar-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .nav-link {
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-base);
  }

  .navbar-user {
    margin-left: 0;
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border-color);
    margin-top: var(--space-2);
  }
}
</style>
