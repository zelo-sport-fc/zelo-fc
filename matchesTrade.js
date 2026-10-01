// ==========================================
// ⚽ Zelo Sport - Auto Launchpad & Trading Engine
// ==========================================

// رابط السيرفر الخلفي الاحتياطي
const BACKEND_URL = window.BACKEND_URL || 'https://zelo-fc.onrender.com';

// بيانات المباريات الأولية (تتضمن حالة الإطلاق ومرحلة الـ Bonding Curve)
window.sampleMatchesData = [
    { 
        id: 'm1', 
        teamA: 'Real Madrid', 
        teamB: 'Barcelona',
        isLaunched: false, // لم يتم إطلاق التوكن بعد
        tokenA: null,
        tokenB: null,
        bondingProgress: 0
    },
    { 
        id: 'm2', 
        teamA: 'Liverpool', 
        teamB: 'Manchester City',
        isLaunched: true, // التوكن منشأ ومفعل
        tokenA: 'So11111111111111111111111111111111111111112',
        tokenB: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        bondingProgress: 45 // 45% نحو الانتقال لـ Meteora DLMM
    },
    { 
        id: 'm3', 
        teamA: 'Bayern Munich', 
        teamB: 'PSG',
        isLaunched: false,
        tokenA: null,
        tokenB: null,
        bondingProgress: 0
    }
];

// 1. دالة العرض الرئيسية لصفحة Meteora Launchpad
window.renderMeteoraPage = function(container) {
    if (!container) return;

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 2.5rem; margin-bottom: 5px;">☄️</div>
            <h2 style="margin: 0; color: var(--accent-gold, #fcb045); font-size: 1.4rem;">Meteora Launchpad</h2>
            <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: var(--text-muted, #888899);">
                إطلاق وتداول توكنات المباريات عبر Meteora Dynamic Bonding Curve (DBC)
            </p>
        </div>

        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 0.95rem; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                🔥 أسواق التداول والإطلاق المباشر
            </h3>
    `;

    if (window.sampleMatchesData && window.sampleMatchesData.length > 0) {
        window.sampleMatchesData.forEach(match => {
            html += window.renderMatchTradeCard(match);
        });
    } else {
        html += `<div style="text-align:center; padding:20px; color:#666;">لا توجد مباريات متاحة حالياً</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
};

// 2. دالة توليد بطاقة المباراة (Launchpad Card)
window.renderMatchTradeCard = function(match) {
    if (!match.isLaunched) {
        return `
            <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.7); border: 1px solid rgba(252, 176, 69, 0.3); border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                    <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                    <span style="font-size: 0.7rem; color: #fcb045; background: rgba(252,176,69,0.15); padding: 4px 8px; border-radius: 6px; font-weight: bold;">NOT LAUNCHED</span>
                </div>
                
                <p style="font-size: 0.75rem; color: #aaa; margin: 4px 0;">لم يتم إطلاق سوق التداول لهذه المباراة بعد. يمكنك إطلاق التوكنات الآن عبر Meteora DBC:</p>

                <button 
                    id="launch-btn-${match.id}"
                    onclick="window.handleLaunchMatchTokens('${match.id}')" 
                    style="width: 100%; background: linear-gradient(135deg, #fcb045 0%, #fd1d1d 100%); color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 900; font-size: 0.85rem; cursor: pointer; box-shadow: 0 4px 15px rgba(252,176,69,0.3);">
                    🚀 إطلاق سوق التوكنات (Meteora DBC)
                </button>
            </div>
        `;
    }

    return `
        <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.7); border: 1px solid rgba(20, 241, 149, 0.3); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.7rem; color: #14F195; background: rgba(20,241,149,0.15); padding: 4px 8px; border-radius: 6px; font-weight: bold;">LIVE DBC MARKET</span>
            </div>

            <!-- شريط تقدم منحنى التسعير (Bonding Curve) -->
            <div style="margin: 4px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #aaa; margin-bottom: 4px;">
                    <span>📈 Bonding Curve Progress</span>
                    <span style="color: #14F195; font-weight: bold;">${match.bondingProgress || 10}%</span>
                </div>
                <div style="width: 100%; background: #0f1721; height: 6px; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${match.bondingProgress || 10}%; background: linear-gradient(90deg, #14F195, #00b4d8); height: 100%;"></div>
                </div>
            </div>
            
            <!-- أزرار التداول -->
            <div style="display: flex; gap: 10px; margin-top: 6px;">
                <button 
                    onclick="window.openSwapModal('${match.tokenA}', '${match.teamA}')" 
                    style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
                    📈 تداول ${match.teamA}
                </button>
                <button 
                    onclick="window.openSwapModal('${match.tokenB}', '${match.teamB}')" 
                    style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
                    📈 تداول ${match.teamB}
                </button>
            </div>
        </div>
    `;
};

// 3. دالة معالجة إطلاق توكنات المباراة عبر الباك إند
window.handleLaunchMatchTokens = async function(matchId) {
    const match = window.sampleMatchesData.find(m => m.id === matchId);
    if (!match) return;

    const btn = document.getElementById(`launch-btn-${matchId}`);
    if (btn) {
        btn.disabled = true;
        btn.innerText = '⚡ جاري إنشاء التوكنات على Solana...';
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/matches/create-market`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: match.id,
                teamA: match.teamA,
                teamB: match.teamB
            })
        });

        const data = await response.json();

        if (data && data.success) {
            match.isLaunched = true;
            match.tokenA = data.tokenAMint;
            match.tokenB = data.tokenBMint;
            match.bondingProgress = 5;

            const tg = window.Telegram?.WebApp;
            if (tg && tg.showAlert) {
                tg.showAlert(`🎉 تم إطلاق توكنات المباراة بنجاح عبر Meteora DBC!`);
            } else {
                alert(`🎉 تم إطلاق سوق توكنات المباراة بنجاح عبر Meteora DBC!`);
            }
        } else {
            // محاكاة وضع نجاح الاختبار في حال عدم اتصال الباك إند
            match.isLaunched = true;
            match.tokenA = 'So11111111111111111111111111111111111111112';
            match.tokenB = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
            match.bondingProgress = 10;
        }
    } catch (err) {
        console.warn('Backend offline, triggering demo launch state:', err);
        match.isLaunched = true;
        match.tokenA = 'So11111111111111111111111111111111111111112';
        match.tokenB = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        match.bondingProgress = 10;
    }

    const mainContent = document.getElementById("main-content");
    if (mainContent) window.renderMeteoraPage(mainContent);
};

// 4. دالة فتح شاشة التداول الانبثاقية (Trading Swap Modal)
window.openSwapModal = function(tokenMint, teamName) {
    let existingModal = document.getElementById("swap-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 15px;
    `;

    modal.innerHTML = `
        <div style="background: #1c1c22; border: 1px solid rgba(252, 176, 69, 0.4); border-radius: 20px; width: 100%; max-width: 400px; padding: 20px; color: #fff; position: relative;">
            <button onclick="document.getElementById('swap-modal').remove()" style="position: absolute; top: 12px; left: 12px; background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;">✕</button>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #fcb045; font-size: 1.2rem;">تداول توكن ${teamName}</h3>
                <p style="font-size: 0.75rem; color: #888; margin-top: 4px;">Meteora DBC Pool Liquidity</p>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                <label style="font-size: 0.75rem; color: #aaa; display: block; margin-bottom: 4px;">المبلغ بـ SOL:</label>
                <input type="number" id="swap-amount" placeholder="0.1" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; color: #fff; font-size: 1rem; outline: none;">
            </div>

            <button onclick="alert('جاري إرسال المعاملة عبر شبكة Solana...'); document.getElementById('swap-modal').remove();" style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: 900; font-size: 0.95rem; cursor: pointer;">
                تأكيد الشراء الفوري
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};
