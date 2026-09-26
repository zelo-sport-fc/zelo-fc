// ==========================================
// 💎 Zelo Sport - TON Wallet Module (wallet-ton.js)
// ==========================================

// تحميل مكتبة TON Connect UI ديناميكياً
if (!window.TON_CONNECT_UI && !document.getElementById('ton-connect-script')) {
    const script = document.createElement('script');
    script.id = 'ton-connect-script';
    script.src = 'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js';
    script.onload = () => { initTonConnectUI(); };
    document.head.appendChild(script);
} else {
    initTonConnectUI();
}

// تهيئة كائن TON Connect UI
function initTonConnectUI() {
    if (window.TON_CONNECT_UI && !window.tonConnectUI) {
        try {
            window.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://starlingcoin.github.io/starling-app/tonconnect-manifest.json?v=9.0',
                twaReturnUrl: 'https://t.me/zelosportbot/app',
                buttonRootId: null
            });

            window.tonConnectUI.onStatusChange((wallet) => {
                if (wallet) {
                    const rawAddress = wallet.account.address;
                    if (typeof userState !== 'undefined') {
                        userState.walletAddress = rawAddress;
                        userState.walletConnected = true;
                    }
                    localStorage.setItem('ton_wallet_address', rawAddress);
                } else {
                    if (typeof userState !== 'undefined') {
                        userState.walletAddress = '';
                        userState.walletConnected = false;
                    }
                    localStorage.removeItem('ton_wallet_address');
                }
                if (typeof showPage === 'function') showPage('wallet');
            });
        } catch (e) {
            console.error("TON Connect UI Init Error:", e);
        }
    }
}

// فتح نافذة ربط محفظة TON
window.triggerConnect = async function() {
    if (window.tonConnectUI) {
        try {
            await window.tonConnectUI.openModal();
        } catch (e) {
            console.error("Open TON Modal Error:", e);
        }
    } else {
        initTonConnectUI();
        setTimeout(() => {
            if (window.tonConnectUI) window.tonConnectUI.openModal();
        }, 500);
    }
};

// فصل محفظة TON
window.triggerDisconnect = async function() {
    if (window.tonConnectUI && window.tonConnectUI.connected) {
        try {
            await window.tonConnectUI.disconnect();
        } catch (e) {
            console.error("Disconnect Error:", e);
        }
    }
    localStorage.removeItem('ton_wallet_address');
    if (typeof userState !== 'undefined') {
        userState.walletAddress = '';
        userState.walletConnected = false;
    }
    if (typeof showPage === 'function') showPage('wallet');
};
        
