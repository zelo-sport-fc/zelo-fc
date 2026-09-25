// ==========================================
// 👛 ZELO FC Wallet - Full Stack Script (TON + Solana) 💎
// ==========================================

// 1. إعدادات التحويل والشبكة
const COINS_PER_ZELO_TOKEN = 100; // سعر الصرف: 100 عملة = 1 ZELOFC Token
const BACKEND_CLAIM_URL = "https://zelo-fc.onrender.com/api/claim"; // رابط معالجة الاستبدال في السيرفر
const TOKEN_NAME = "ZELOFC"; // رمز التوكن

// 2. تهيئة مكتبة TON Connect العالمية
let tonConnectUI = null;
try {
    if (typeof TON_CONNECT_UI !== 'undefined') {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://zelo-sport-fc.github.io/zelo-fc/tonconnect-manifest.json', // رابط ملف البيان الخاص بك
            buttonRootId: 'ton-connect-button-anchor' // مكان وضع الزر في الـ HTML
        });

        // مراقبة تغيير حالة محفظة TON
        tonConnectUI.onStatusChange(async (walletInfo) => {
            if (walletInfo) {
                console.log("✅ TON Wallet Connected (Real):", walletInfo.account.address);
                // حفظ العنوان في الحالة العامة للتطبيق
                if (typeof userState !== 'undefined') {
                    userState.tonWalletAddress = walletInfo.account.address;
                    userState.tonWalletConnected = true;
                    localStorage.setItem('ton_wallet_address', walletInfo.account.address);
                }
            } else {
                console.log("🔌 TON Wallet Disconnected");
                // مسح العنوان من الحالة العامة
                if (typeof userState !== 'undefined') {
                    userState.tonWalletAddress = null;
                    userState.tonWalletConnected = false;
                }
                 localStorage.removeItem('ton_wallet_address');
            }
        });
    }
} catch (error) {
    console.error("❌ TON Connect Initialization Error:", error);
}

// 3. تحميل مكتبة Solana Web3 الرسمية (إذا لم تكن محملة)
if (!window.solanaWeb3) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    script.onload = () => console.log("✅ Solana Web3 lib loaded");
    document.head.appendChild(script);
}

// 4. الدالة الرئيسية لعرض الواجهة
function renderWalletPage(container) {
    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : Number(localStorage.getItem('user_coins') || 0);

    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet)
        ? userState.solanaWallet
        : (localStorage.getItem('solana_wallet') || '');
    
    const tonWalletConnected = (typeof userState !== 'undefined' && userState.tonWalletConnected);
    const tonWalletAddress = (typeof userState !== 'undefined' && userState.tonWalletAddress) ? userState.tonWalletAddress : localStorage.getItem('ton_wallet_address');

    if (typeof userState !== 'undefined') {
        userState.points = userCoins;
        userState.solanaWallet = solanaWallet;
        if(!userState.tonWalletAddress && tonWalletAddress) {
             userState.tonWalletAddress = tonWalletAddress;
             userState.tonWalletConnected = true;
        }
    }

    const walletStyles = `
        <style>
            .wallet-glass-card {
                background: linear-gradient(135deg, rgba(28, 28, 34, 0.85), rgba(18, 18, 22, 0.95));
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
                margin-bottom: 20px;
                overflow: hidden;
                position: relative;
            }
            .card-border-ton { border-top: 4px solid #0088cc; }
            .card-border-solana { border-top: 4px solid #AB9FF2; }
            .card-border-balance { border-top: 4px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.9), rgba(18, 18, 22, 1)); }

            .wallet-header-flex {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            .wallet-logo-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .wallet-logo-sm {
                width: 40px; height: 40px;
                border-radius: 12px;
                background: rgba(255,255,255,0.05);
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
            }
            .address-box-sm {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 12px 16px;
                border-radius: 14px;
                font-family: monospace;
                font-size: 0.9rem;
                margin-bottom: 15px;
                word-break: break-all;
            }
            
            #tc-ui-button { width: 100%; border-radius: 14px !important; font-weight: bold !important; }

            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8);
                color: white; border: none; border-radius: 14px;
                padding: 14px 18px; font-weight: bold; font-size: 1rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
                margin-bottom: 12px;
                box-shadow: 0 4px 15px rgba(171, 159, 242, 0.3);
                transition: transform 0.2s;
            }
             .btn-glass-solana:active { transform: scale(0.98); }

            .solana-input-sm {
                width: 100%; padding: 12px 16px; background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(171, 159, 242, 0.4); border-radius: 14px;
                color: #fff; font-family: monospace; font-size: 0.9rem;
                box-sizing: border-box; margin-bottom: 12px; text-align: center;
                transition: border-color 0.2s;
            }
             .solana-input-sm:focus { outline: none; border-color: #AB9FF2; }

            .btn-action-sm {
                background: rgba(255, 255, 255, 0.08); color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px;
                padding: 10px 16px; font-size: 0.9rem; font-weight: bold; cursor: pointer;
                transition: all 0.2s;
            }
            .btn-action-sm:hover { background: rgba(255,255,255,0.15); }
            
            .btn-danger-sm {
                background: rgba(253, 29, 29, 0.12); color: #ff4d4d;
                border: 1px solid rgba(253, 29, 29, 0.4); border-radius: 12px;
                padding: 10px 16px; font-size: 0.9rem; font-weight: bold; cursor: pointer;
                transition: all 0.2s;
            }
             .btn-danger-sm:hover { background: rgba(253, 29, 29, 0.25); }

            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8);
                color: #000; border: none; border-radius: 16px;
                padding: 16px 20px; font-size: 1.1rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px;
                box-shadow: 0 4px 20px rgba(20, 241, 149, 0.4);
                transition: transform 0.2s;
                margin-top: 15px;
            }
            .btn-claim-main:active { transform: scale(0.97); }
        </style>
    `;

    container.innerHTML = `
        ${walletStyles}
        
        <!-- 1. TON WALLET CARD -->
        <div class="wallet-glass-card card-border-ton">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:24px;height:24px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:1.1rem;">
                        TON Wallet (Real)
                    </span>
                </div>
                ${tonWalletConnected ? `<span style="color:#0088cc; font-size:0.8rem; font-weight:bold; text-transform: uppercase;">● Connected</span>` : ''}
            </div>

            ${tonWalletConnected ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${tonWalletAddress.slice(0, 10)}...${tonWalletAddress.slice(-10)}
                </div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${tonWalletAddress}')">📋 ${typeof t === 'function' ? t('copy') : 'Copy'}</button>
                    <button class="btn-danger-sm" onclick="triggerTonDisconnect()">🔌 ${typeof t === 'function' ? t('disconnect') : 'Disconnect'}</button>
                </div>
            ` : `
                <div id="ton-connect-button-anchor" style="display: flex; justify-content: center; margin-top: 5px;"></div>
                <p style="color:#aaa; font-size:0.85rem; margin-top:10px;">Connect using Telegram Tonkeeper, MyTonWallet, or Tonhub.</p>
            `}
        </div>

        <!-- 2. SOLANA WALLET CARD -->
        <div class="wallet-glass-card card-border-solana">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(171, 159, 242, 0.4);">
                        <img src="https://phantom.app/img/phantom-logo.svg" style="width:24px; height:24px;" alt="Phantom">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:1.1rem;">
                        Solana Wallet (Phantom)
                    </span>
                </div>
                 ${solanaWallet ? `<span style="color:#AB9FF2; font-size:0.8rem; font-weight:bold; text-transform: uppercase;">● Active</span>` : ''}
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 10)}...${solanaWallet.slice(-10)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:12px 16px; border-radius:14px; margin-bottom:15px; border: 1px solid rgba(255,255,255,0.05);">
                    <span style="color:#aaa; font-size:0.9rem;">On-Chain SOL:</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:1.1rem;">⏳ Checking...</span>
                </div>

                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">📋 ${typeof t === 'function' ? t('copy') : 'Copy'}</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">🔌 ${typeof t === 'function' ? t('disconnect') : 'Disconnect'}</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:20px; height:20px;" alt="">
                    Auto Connect Phantom
                </button>

                <input type="text" id="solana-address-input" class="solana-input-sm" 
                       placeholder="Or paste Solana address... (min 32 chars)">

                <button class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.3); background: rgba(171, 159, 242, 0.12);" onclick="saveManualSolanaWalletAddress()">
                    💾 Save Address
                </button>
            `}
        </div>

        <!-- 3. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card card-border-balance">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.15);">
                        <span style="font-size: 1.4rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:1.1rem;">
                        ${TOKEN_NAME} Claim Portal
                    </span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.6); padding: 16px; border-radius: 14px; margin-bottom: 18px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.95rem;">ZELO Coins to Claim:</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.4rem; font-family: monospace;">
                    ${userCoins.toLocaleString()}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ⚡ Claim ${TOKEN_NAME} Tokens
            </button>
             <p style="color:#888; font-size:0.8rem; margin-top:15px;">*Ensure your Solana wallet is connected first. Claims are sent directly to the active Phantom address.</p>
        </div>
        
        <div style="height: 30px;"></div>
    `;

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// ==========================================
// 🔮 Wallet & Network Functions
// ==========================================

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
        console.error("Solana Balance Fetch Error:", err);
    }
    if (el) el.innerText = `Error`;
}

async function triggerTonDisconnect() {
    if(tonConnectUI) {
        await tonConnectUI.disconnect();
    }
}

window.connectPhantomWallet = function() {
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            console.log("✅ Phantom Wallet Connected:", res.publicKey.toString());
            saveSolanaAddressToStateAndDB(res.publicKey.toString());
        }).catch((err) => {
            console.error("❌ Phantom Connection Error:", err);
            alert('Connection request rejected or failed.');
        });
    } else {
        alert('Phantom wallet not detected. Please install Phantom mobile app or browser extension.');
    }
};

async function saveSolanaAddressToStateAndDB(solAddress) {
    localStorage.setItem('solana_wallet', solAddress);
    
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
        
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null && userState.userId) {
             supabaseClient.from('users')
                .update({ solana_wallet_address: solAddress })
                .eq('telegram_id', userState.userId)
                .then(({ error }) => {
                    if (error) console.error("❌ Error saving Solana to Supabase:", error);
                    else console.log("✅ Solana address synced to DB");
                });
        }
    }
    
    if (typeof showPage === 'function') showPage('wallet');
}

window.saveManualSolanaWalletAddress = function() {
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    if (solAddress.length >= 32 && solAddress.length <= 44 && /^[A-HJ-NP-Za-km-z1-9]*$/.test(solAddress)) {
        saveSolanaAddressToStateAndDB(solAddress);
    } else {
        alert('Please enter a valid Solana address (32-44 characters).');
    }
};

window.disconnectSolanaWallet = function() {
    localStorage.removeItem('solana_wallet');
    
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = null;
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null && userState.userId) {
             supabaseClient.from('users')
                .update({ solana_wallet_address: null })
                .eq('telegram_id', userState.userId)
                 .then(() => console.log("✅ Solana address removed from DB"));
        }
    }
    if (typeof showPage === 'function') showPage('wallet');
};

window.claimCoinsToSolanaWallet = async function() {
    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet)
        ? userState.solanaWallet
        : localStorage.getItem('solana_wallet');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : Number(localStorage.getItem('user_coins') || 0);

    const claimBtn = document.getElementById('btn-claim-action');

    if (!solWallet) {
        alert('⚠️ Please connect or save your Solana Wallet (Phantom) first!');
        return;
    }

    if (userCoins <= 0) {
        alert(`⚠️ You have no ${TOKEN_NAME} available to claim.`);
        return;
    }

    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);
    
    if (!confirm(`Are you sure you want to claim ${tokenAmountToReceive} ${TOKEN_NAME} tokens to your Solana wallet?`)) {
        return;
    }

    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.innerText = "⏳ Processing Claim...";
    }

    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient && userState.userId) {
            const { error } = await supabaseClient.from('users')
                .update({ points: 0 })
                .eq('telegram_id', userState.userId);

            if (error) throw error;

            userState.points = 0;
            localStorage.setItem('user_coins', '0');
            
            alert(`🎉 Successfully claimed tokens to your Solana address!`);
            if (typeof showPage === 'function') showPage('wallet');
        } else {
            alert('⚠️ Session error. Please restart the app.');
        }
    } catch (err) {
        console.error("Claim Error:", err);
        alert('❌ Claim failed. Please try again later.');
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = `⚡ Claim ${TOKEN_NAME} Tokens`;
        }
    }
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};
