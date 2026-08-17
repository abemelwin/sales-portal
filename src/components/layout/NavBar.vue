<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { usePermissionsStore } from '@/stores/permissions'

const router = useRouter()
const { user, role, logout: authLogout } = useAuth()
const permStore = usePermissionsStore()

// Fetch permissions when role changes (handles page reload timing)
watch(role, (newRole) => {
  if (newRole) {
    permStore.fetchPermissions(newRole)
  }
}, { immediate: true })


// Permission-based nav visibility

const mobileMenuOpen = ref(false)

/** Truncate display name to 50 chars with ellipsis (Requirement 1.6) */
const displayName = computed(() => {
  const name = user.value?.display_name ?? ''
  if (name.length > 50) {
    return name.slice(0, 50) + '...'
  }
  return name
})

const isAdmin = computed(() => adminLinks.value.length > 0)

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    superadmin: 'Super Admin',
    product_manager: 'Product Manager',
    sales_admin_manager: 'Sales Admin Manager',
    sales_admin_supervisor: 'Sales Admin Supervisor',
    sales_admin_assistant: 'Sales Admin Assistant',
    area_sales_manager: 'Area Sales Manager',
    account_executive: 'Account Executive',
    sales_assistant: 'Sales Assistant',
    user: 'User',
  }
  if (!role.value) return ''
  return labels[role.value] || role.value
})

/** Navigation links visible to all authenticated users */
const navLinks = [
  { to: '/quotes/new', label: 'Quote Generator' },
  { to: '/product-info', label: 'Product Info' },
]

/** Admin navigation links with permission requirements */
const adminLinks = computed(() => {
  const links: { to: string; label: string }[] = []
  if (permStore.can('manage_users')) links.push({ to: '/users', label: 'Users' })
  if (permStore.can('manage_roles_access')) links.push({ to: '/roles', label: 'Roles' })
  if (permStore.can('edit_machine_catalog')) links.push({ to: '/catalog', label: 'Catalog Editor' })
  return links
})

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
          ESPMI
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
            {{ displayName }}<template v-if="roleLabel"> ({{ roleLabel }})</template>
          </span>
          <span class="navbar-sep">&middot;</span>
          <router-link to="/change-password" class="navbar-action-link" @click="closeMobileMenu">Change Password</router-link>
          <span class="navbar-sep">&middot;</span>
          <button class="navbar-logout-btn" @click="handleLogout">Logout</button>
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
  height: 40px;
  background-color: #fff;
  border-bottom: 2px solid #c0392b;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.10);
  overflow: hidden;
}

.navbar-container {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 12px;
  gap: 14px;
}

.navbar-brand {
  flex-shrink: 0;
}

.navbar-logo {
  font-size: 13px;
  font-weight: 700;
  color: #c0392b;
  text-decoration: none;
  white-space: nowrap;
  min-height: unset;
  min-width: unset;
}

.navbar-logo:hover {
  color: #a93226;
}

/* Hamburger toggle - hidden on desktop */
.navbar-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: none;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  min-height: unset;
  min-width: unset;
}

.navbar-toggle:hover {
  background-color: #f3f4f6;
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background-color: #374151;
  border-radius: 1px;
}

/* Nav menu - single row on desktop */
.navbar-menu {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  flex-wrap: nowrap;
}

.nav-item {
  display: flex;
  flex-shrink: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #999;
  text-decoration: none;
  border-radius: 5px;
  white-space: nowrap;
  letter-spacing: 0.3px;
  transition: color 0.15s, background-color 0.15s;
  min-height: unset;
  min-width: unset;
  height: auto;
  line-height: 1;
}

.nav-link:hover {
  color: #c0392b;
  background-color: #fff2f0;
}

.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  color: #c0392b;
  background-color: #fff2f0;
}

/* User section */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
  font-size: 11px;
  color: #888;
}

.navbar-user-name {
  font-size: 11px;
  color: #666;
  font-weight: 400;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-logout-btn {
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  color: #c0392b;
  background-color: transparent;
  border: none;
  cursor: pointer;
  text-decoration: none;
  min-height: unset;
  min-width: unset;
}

.navbar-logout-btn:hover {
  text-decoration: underline;
}

.navbar-sep {
  color: #ccc;
  font-size: 11px;
}

.navbar-action-link {
  font-size: 11px;
  font-weight: 600;
  color: #c0392b;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  min-height: unset;
  min-width: unset;
}

.navbar-action-link:hover {
  text-decoration: underline;
}

/* --- Mobile Responsive (< 768px) ------------------------------------------- */
@media screen and (max-width: 767px) {
  .navbar {
    height: auto;
    min-height: 40px;
    overflow: visible;
  }

  .navbar-container {
    flex-wrap: wrap;
    padding: 0 12px;
  }

  .navbar-toggle {
    display: flex;
    margin-left: auto;
  }

  .navbar-menu {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    padding: 8px 0;
    border-top: 1px solid #e5e7eb;
    overflow: visible;
  }

  .navbar-menu--open {
    display: flex;
  }

  .navbar-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    flex-wrap: wrap;
  }

  .nav-link {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 44px;
  }

  .navbar-user {
    margin-left: 0;
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    margin-top: 8px;
  }
}
</style>
