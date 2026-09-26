// ==========================================
// 💎 Zelo Sport - TON Wallet & Core UI Module (wallet-ton.js)
// ==========================================

// 1. حقن تنسيقات الزجاج والبطاقات الأساسية لصفحة المحفظة
(function injectWalletStyles() {
    if (document.getElementById('wallet-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'wallet-core-styles';
    style.innerHTML = `
        .wallet-glass-card {
            background: linear-gradient(135deg, rgba(28, 28, 34, 0.8), rgba(18, 18, 22, 0.9));
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 16px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
            margin-bottom: 14px;
        }
        .wallet-header-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .wallet-logo-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .wallet-logo-sm {
            width: 30px; height: 30px;
            border-radius: 50%;
            background: rgba(255,255,255,0.05);
            display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .address-box-sm {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 8px 12px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 0.82rem;
            margin-bottom: 10px;
            word-break: break-all;
        }
        .btn-glass-ton {
            background: linear-gradient(135deg, #0088cc, #005580);
            color: white; border: none; border-radius: 10px;
            padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
            cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-action-sm {
            background: rgba(255, 255, 255, 0.05); color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;
            padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
        }
        .btn-danger-sm {
            background: rgba(253, 29, 29, 0.12); color: #ff4d4d;
            border: 1px solid rgba(253, 29, 29, 0.3); border-radius: 8px;
            padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
        }
    `;
    document.head.appendChild(style);
})();

// 2. تحميل مكتبة TON Connect UI
if (!window.TON_CONNECT_UI && !document.getElementById('ton-connect-script')) {
    const script = document.createElement('script');
    script.id = 'ton-connect-script';
    script.src = 'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js';
    script.onload = () => { initTonConnectUI(); };
    document.head.appendChild(script);
} else {
    initTonConnectUI();
}

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
