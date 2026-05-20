/**
 * client.js
 * 
 * Shared logic for the PingOrder frontend.
 */

const Cart = {
    get() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },
    add(product) {
        const cart = this.get();
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateUI();
    },
    clear() {
        localStorage.removeItem('cart');
        this.updateUI();
    },
    updateUI() {
        const count = document.getElementById('cart-count');
        if (count) count.innerText = this.get().length;
    }
};

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = 'index.html';
}

async function checkSession() {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.username) {
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) userDisplay.innerText = data.username;
    } else if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        // Redirection if not logged in (unless on login page)
        // window.location.href = '/';
    }
}

async function injectBanner() {
    try {
        const res = await fetch('/api/metrics');
        const data = await res.json();
        const banner = document.createElement('div');
        banner.id = 'debug-banner';
        banner.style = "background:#1a1a1a; color:#00ff00; padding:10px; font-family:monospace; font-size:12px; border-top:2px solid #333; position:fixed; bottom:0; left:0; right:0; z-index:9999;";
        banner.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px;">
                <div><b>Served by:</b> ${data.instanceId}</div>
                <div><b>Session:</b> ${data.sessionType}</div>
                <div><b>DB:</b> ${data.dbStatus}</div>
                <div><b>Reqs:</b> ${data.requestsServed}</div>
                <div><b>CPU Stress:</b> ${data.cpuStress}%</div>
                <div><b>Queue:</b> ${data.queueDepth}</div>
            </div>
        `;
        document.body.appendChild(banner);
    } catch (e) {
        console.error("Failed to inject banner", e);
    }
}

// Global UI Init
document.addEventListener('DOMContentLoaded', () => {
    injectBanner();
    checkSession();
    Cart.updateUI();
});
