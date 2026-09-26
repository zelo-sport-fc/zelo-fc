// ==========================================
// 🟣 Zelo Sport - Solana Module & Wallet Renderer (wallet-solana.js)
// ==========================================

const COINS_PER_ZELO_TOKEN = 100;
const BACKEND_URL = "https://zelo-fc.onrender.com";
const TOKEN_NAME = "ZELOFC";

if (!window.solanaWeb3 && !document.getElementById('solana-web3-script')) {
    const script = document.createElement('script');
    script.id = 'solana-web3-script';
    script.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    document.head.appendChild(script);
}

function renderWalletPage(container) {
    if (!container) return;

    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');

    const txtTonWallet = isAr ? 'محفظة TON' : 'TON Wallet';
    const txtSolanaWallet = isAr ? 'محفظة Solana' : 'Solana Wallet';
    const txtConnected = isAr ? '● متصل' : '● Connected';
    const txtConnectTon = isAr ? 'ربط محفظة تلغرام 💎' : 'Connect Telegram Wallet 💎';
    const txtCopy = isAr ? '📋 نسخ' : '📋 Copy';
    const txtDisconnect = isAr ? '🔌 فصل' : '🔌 Disconnect';
    const txtOnChainSol = isAr ? 'رصيد SOL على الشبكة:' : 'On-Chain SOL:';
    const txtChecking = isAr ? '⏳ جاري الفحص...' : '⏳ Checking...';
    const txtAutoConnectPhantom = isAr ? 'ربط تلقائي لمحفظة Phantom' : 'Auto Connect Phantom';
    const txtPlaceholderSol = isAr ? 'أو ألصق عنوان محفظة Solana...' : 'Or paste Solana address...';
    const txtSaveAddress = isAr ? '💾 حفظ العنوان' : '💾 Save Address';
    const txtBalanceTitle = isAr ? `رصيد ${TOKEN_NAME}` : `${TOKEN_NAME} Balance`;
    const txtTotalEarned = isAr ? 'إجمالي المكتسب:' : 'Total Earned:';
    const txtClaimBtn = isAr ? `مطالبة برصيد رمزي ${TOKEN_NAME} ⚡` : `Claim ${TOKEN_NAME} Tokens ⚡`;

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : ((typeof userState !== 'undefined' && userState.coins !== undefined)
            ? Number(userState.coins)
            : Number(localStorage.getItem('user_coins') || 0));
    
    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const tonWallet = (typeof userState !== 'undefined' && userState.walletAddress)
        ? userState.walletAddress
        : (localStorage.getItem('ton_wallet_address') || '');

    const isTonConnected = !!(tonWallet || (window.tonConnectUI && window.tonConnectUI.connected));

    if (typeof userState !== 'undefined') {
        userState.points = userCoins;
        userState.coins = userCoins;
        userState.solanaWallet = solanaWallet;
        userState.walletAddress = tonWallet;
        userState.walletConnected = isTonConnected;
    }

    const solanaSpecificStyles = `
        <style>
            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8);
                color: white; border: none; border-radius: 10px;
                padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
                margin-bottom: 8px;
            }
            .solana-input-sm {
                width: 100%; padding: 8px 10px; background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(171, 159, 242, 0.3); border-radius: 8px;
                color: #fff; font-family: monospace; font-size: 0.8rem;
                box-sizing: border-box; margin-bottom: 8px; text-align: center;
            }
            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8);
                color: #000; border: none; border-radius: 12px;
                padding: 12px 16px; font-size: 0.95rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(20, 241, 149, 0.3);
                transition: transform 0.2s;
            }
            .btn-claim-main:active { transform: scale(0.98); }
        </style>
    `;

    container.innerHTML = `
        ${solanaSpecificStyles}
        
        <!-- 1. TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #0088cc;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:18px;height:18px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${txtTonWallet}</span>
                </div>
                ${isTonConnected ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">${txtConnected}</span>` : ''}
            </div>

            ${isTonConnected ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${tonWallet ? tonWallet.slice(0, 8) + '...' + tonWallet.slice(-8) : 'Connected'}
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${tonWallet}')">${txtCopy}</button>
                    <button class="btn-danger-sm" onclick="triggerDisconnect()">${txtDisconnect}</button>
                </div>
            ` : `
                <button class="btn-glass-ton" onclick="triggerConnect()">
                    <span>💎</span> ${txtConnectTon}
                </button>
            `}
        </div>

        <!-- 2. SOLANA WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #AB9FF2;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(171, 159, 242, 0.4);">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width:18px;height:18px;" alt="Solana">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${txtSolanaWallet}</span>
                </div>
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">${txtOnChainSol}</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:0.95rem;">${txtChecking}</span>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">${txtCopy}</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">${txtDisconnect}</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:16px; height:16px;" alt="">
                    ${txtAutoConnectPhantom}
                </button>

                <input type="text" id="solana-address-input" class="solana-input-sm" placeholder="${txtPlaceholderSol}">

                <button class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.4); background: rgba(171, 159, 242, 0.15);" onclick="saveSolanaWalletAddress()">
                    ${txtSaveAddress}
                </button>
            `}
        </div>

        <!-- 3. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.85), rgba(18, 18, 22, 0.95));">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${txtBalanceTitle}</span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">${txtTotalEarned}</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString()} ${TOKEN_NAME}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ${txtClaimBtn}
            </button>
        </div>
        
        <div style="height: 20px;"></div>
    `;

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

window.renderWalletPage = renderWalletPage;

async function fetchRealSolanaBalance(address) {
    const el = document.getElementById('real-solana-balance');
    try {
        if (window.solanaWeb3) {
            const connection = new window.solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
            const pubKey = new window.solanaWeb3.PublicKey(address);
            const balance = await connection.getBalance(pubKey);
            const solVal = (balance / window.solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
            if (el) el.innerText = `${solVal} SOL`;
            return;
        }
    } catch (err) {
        console.warn("Solana Balance Error:", err);
    }
    if (el) el.innerText = `0.0000 SOL`;
}

window.claimCoinsToSolanaWallet = async function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');

    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined) 
        ? Number(userState.points) 
        : Number(localStorage.getItem('user_coins') || 0);

    const claimBtn = document.getElementById('btn-claim-action');

    if (!solWallet) {
        alert(isAr ? '⚠️ يرجى ربط أو حفظ محفظة Solana أولاً!' : '⚠️ Please connect or save your Solana Wallet first!');
        return;
    }

    if (userCoins <= 0) {
        alert(isAr ? `⚠️ لا يوجد لديك رصيد من ${TOKEN_NAME} للمطالبة به.` : `⚠️ You have no ${TOKEN_NAME} available to claim.`);
        return;
    }

    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);

    const confirmClaim = confirm(
        isAr 
        ? `تأكيد خصم ${userCoins.toLocaleString()} نقطة لاستلام ${tokenAmountToReceive} من رمز ${TOKEN_NAME}؟`
        : `Confirm deducting ${userCoins.toLocaleString()} to receive ${tokenAmountToReceive} ${TOKEN_NAME} tokens?`
    );

    if (!confirmClaim) return;

    try {
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = isAr ? '⏳ جاري الاتصال بالسيرفر والتحويل...' : '⏳ Connecting server & transferring...';
        }

        const response = await fetch(`${BACKEND_URL}/api/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userWalletAddress: solWallet, userCoins: userCoins })
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            localStorage.setItem('user_coins', 0);
            if (typeof userState !== 'undefined') {
                userState.points = 0;
                userState.coins = 0;
            }

            if (typeof showPage === 'function') showPage('wallet');

            alert(isAr 
                ? `✅ تم النجاح! تم تحويل الرموز على الشبكة!\n\nمعرف المعاملة: ${result.txHash}` 
                : `✅ Success! Tokens transferred On-Chain!\n\nTx Hash: ${result.txHash}`);
        } else {
            let errorDetails = "Unknown Error";
            if (result && result.error) {
                errorDetails = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            } else if (result && result.message) {
                errorDetails = result.message;
            } else {
                errorDetails = `HTTP ${response.status}: ${response.statusText || 'Server Error'}`;
            }

            alert(isAr ? `❌ فشل التحويل:\n${errorDetails}` : `❌ Transfer failed:\n${errorDetails}`);
        }

    } catch (error) {
        console.error("Claim Error:", error);
        alert(isAr ? `❌ خطأ في الاتصال بالسيرفر:\n${error.message}` : `❌ Server connection error:\n${error.message}`);
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = isAr ? `مطالبة برصيد رمزي ${TOKEN_NAME} ⚡` : `Claim ${TOKEN_NAME} Tokens ⚡`;
        }
    }
};

window.connectPhantomWallet = function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            saveSolanaAddressToStateAndDB(res.publicKey.toString());
        }).catch((err) => console.error(err));
    } else {
        alert(isAr ? 'يرجى نسخ عنوان محفظتك من تطبيق Phantom ولصقه في الحقل المخصص.' : 'Please copy your wallet address from the Phantom app and paste it in the field.');
    }
};

async function saveSolanaAddressToStateAndDB(solAddress) {
    localStorage.setItem('solana_wallet', solAddress);
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
    }
    if (typeof showPage === 'function') showPage('wallet');
}

window.saveSolanaWalletAddress = function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    if (solAddress.length >= 32) {
        saveSolanaAddressToStateAndDB(solAddress);
    } else {
        alert(isAr ? 'يرجى إدخال عنوان محفظة Solana صحيح' : 'Please enter a valid Solana address');
    }
};

window.disconnectSolanaWallet = function() {
    localStorage.removeItem('solana_wallet');
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = '';
    }
    if (typeof showPage === 'function') showPage('wallet');
};

window.copyToClipboard = function(text) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const msg = isAr ? 'تم نسخ العنوان بنجاح!' : 'Address copied to clipboard!';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert(msg));
    } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert(msg);
    }
};
    
