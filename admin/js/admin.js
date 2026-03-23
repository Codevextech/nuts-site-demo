// ============================================================
// admin.js – Admin Shared & Dashboard logic
// ============================================================
import { auth, db } from '../../js/firebase-config.js';
import { requireAdmin, showToast, initTheme } from '../../js/auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initialize admin layout & auth
export async function initAdmin(activeNavId) {
  initTheme();
  
  // Guard
  const { user, profile } = await requireAdmin();
  document.getElementById('adminName').textContent = profile.name || 'Admin';

  // Sidebar toggle
  const sidebar = document.getElementById('adminSidebar');
  const main = document.getElementById('adminMain');
  const toggleBtn = document.getElementById('sidebarToggle');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('closed');
      main.classList.toggle('full');
      // On mobile, use "open" class
      if (window.innerWidth <= 1024) {
        sidebar.classList.toggle('open');
      }
    });
  }

  // Set active nav
  if (activeNavId) {
    const nav = document.getElementById(activeNavId);
    if (nav) nav.classList.add('active');
  }

  return { user, profile };
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ── Dashboard Stats ─────────────────────────────────────────

export async function loadDashboardStats() {
  try {
    const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'users'))
    ]);

    const orders = ordersSnap.docs.map(d => d.data());
    
    // Total Orders
    document.getElementById('statTotalOrders').textContent = orders.length;

    // Total Revenue (only delivered/shipped/packed/pending, exclude cancelled if any)
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('statRevenue').textContent = formatCurrency(revenue);

    // Total Products
    document.getElementById('statProducts').textContent = productsSnap.size;

    // Total Customers (filter role == customer)
    const customers = usersSnap.docs.filter(d => d.data().role !== 'admin');
    document.getElementById('statCustomers').textContent = customers.length;

    // Recent Orders (last 5)
    const recent = orders.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 5);
    const tbody = document.getElementById('recentOrdersBody');
    if (!recent.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(o => `
      <tr>
        <td style="font-family:monospace;">#ORDER</td>
        <td>${o.delivery?.name || 'Guest'}</td>
        <td>${o.items?.length || 0} items</td>
        <td style="font-weight:600;">₹${o.total}</td>
        <td><span class="badge status-${o.status?.toLowerCase()}">${o.status}</span></td>
      </tr>
    `).join('');

  } catch(err) {
    console.error("Dashboard error:", err);
    showToast('Error loading dashboard stats. Check Firebase config.', 'error');
  }
}
