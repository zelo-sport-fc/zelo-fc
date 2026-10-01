// ==========================================
// ⚽ Zelo Sport - Devnet Prediction & Trading Engine
// ==========================================

// تفعيل وضع الشبكة التجريبية (Devnet)
window.IS_DEVNET = true;
window.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

// بيانات المباريات (تركيز التداول على المباريات الممتازة Featured فقط)
window.sampleMatchesData = [
    { 
        id: 'm1', 
        teamA: 'Real Madrid', 
        teamB: 'Barcelona',
        isFeatured: true, // مباراة قمة مفعّل لها التداول والتخمين
        matchStartTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // تبدأ بعد 3 ساعات
        status: 'TRADING_LIVE', // TRADING_LIVE | UPCOMING | SETTLED
        tokenA: 'DevnetRMA1111111111111111111111111111111111',
        tokenB: 'DevnetBAR1111111111111111111111111111111111',
        bondingProgressTeamA: 62, // 62% تخمينات لصالح الريال
        bondingProgressTeamB: 38   // 38% تخمينات لصالح برشلونة
    },
    { 
        id: 'm2', 
        teamA: 'Liverpool', 
        teamB: 'Manchester City',
        isFeatured: true,
        matchStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // انتهت
        status: 'SETTLED',
        winner: 'Liverpool',
        tokenA: 'DevnetLIV1111111111111111111111111111111111',
        tokenB: 'DevnetMCI1111111111111111111111111111111111',
        bondingProgressTeamA: 100,
        bondingProgressTeamB: 0
    }
];

// 1. الدالة الرئيسية لعرض صفحة Meteora / Devnet Launchpad
window.renderMeteoraPage = function(container) {
    if (!container) return;

    // تصفية المباريات الممتازة فقط (Featured Matches)
    const featuredMatches = window.sampleMatchesData.filter(m => m.isFeatured);

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; color: #14F195; font-weight: bold; margin-bottom: 8px;">
                🌐 SOLANA DEVNET (وضع تجريبي)
            </div>
            <h2 style="margin: 0; color: var(--accent-gold, #fcb045); font-size: 1.3rem;">سوق التخمين والتداول المباشر</h2>
            <p style="margin: 5px 0 0 0; font-size: 0.78rem; color: var(--text-muted, #888899);">
                اشترِ توكن الفريق المتوقع فوزه بالـ Devnet SOL - السيولة تُوزع على الفائزين بعد المباراة!
            </p>
        </div>

        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 0.9rem; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                🔥 مباراة القمة المتاحة للتداول
            </h3>
    `;

    if (featuredMatches.length > 0) {
        featuredMatches.forEach(match => {
            html += window.renderPredictionCard(match);
        });
    } else {
        html += `
            <div style="text-align:center; padding:30px 15px; color:#aaa; background:rgba(255,255,255,0.03); border-radius:15px;">
                <p style="margin:0; font-size:0.85rem;">⏳ لا توجد مباراة قمة مفعّلة حالياً.</p>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
};

// 2. دالة بناء بطاقات التخمين للمباريات
window.renderPredictionCard = function(match) {
    // حالة أ) المباراة انتهت وتم حسم الأرباح
    if (match.status === 'SETTLED') {
        return `
            <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(20, 241, 149, 0.05); border: 1px solid rgba(20, 241, 149, 0.3); border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                    <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                    <span style="font-size: 0.7rem; color: #14F195; background: rgba(20,241,149,0.2); padding: 4px 8px; border-radius: 6px; font-weight: bold;">انتهت المباراة</span>
                </div>
                
                <div style="text-align: center; padding: 6px 0;">
                    <span style="font-size: 0.8rem; color: #aaa;">الفائز بالتخمين: </span>
                    <strong style="color: #fcb045; font-size: 0.95rem;">🏆 ${match.winner}</strong>
                </div>

                <button 
                    onclick="alert('🎉 تم تحويل أرباح سيولة المباراة التجريبية إلى محفظتك!')" 
                    style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 0.85rem; cursor: pointer;">
                    💰 استلام الأرباح والسيولة
                </button>
            </div>
        `;
    }

    // حالة ب) التداول والتخمين مفتوح الآن قبل المباراة
    return `
        <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.8); border: 1px solid rgba(252, 176, 69, 0.3); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.7rem; color: #14F195; background: rgba(20,241,149,0.15); padding: 4px 8px; border-radius: 6px; font-weight: bold;">🔴 التخمين مباشر</span>
            </div>

            <!-- شريط توزيع سيولة التخمينات -->
            <div style="margin: 4px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #ccc; margin-bottom: 4px;">
                    <span style="color: #14F195; font-weight: bold;">${match.teamA} (${match.bondingProgressTeamA}%)</span>
                    <span style="color: #f72585; font-weight: bold;">${match.teamB} (${match.bondingProgressTeamB}%)</span>
                </div>
                <div style="width: 100%; background: #0f1721; height: 8px; border-radius: 10px; overflow: hidden; display: flex;">
                    <div style="width: ${match.bondingProgressTeamA}%; background: #14F195; height: 100%;"></div>
                    <div style="width: ${match.bondingProgressTeamB}%; background: #f72585; height: 100%;"></div>
                </div>
            </div>

            <p style="font-size: 0.72rem; color: #aaa; margin: 2px 0 6px 0; text-align: center;">
                اختر الفريق الذي تتوقع فوزه واشترِ توكنه لتدعم سيولته:
            </p>
            
            <!-- أزرار التخمين بـ Devnet SOL -->
            <div style="display: flex; gap: 10px;">
                <button 
                    onclick="window.openSwapModal('${match.tokenA}', '${match.teamA}')" 
                    style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                    🔥 تخمين ${match.teamA}
                </button>
                <button 
                    onclick="window.openSwapModal('${match.tokenB}', '${match.teamB}')" 
                    style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                    🔥 تخمين ${match.teamB}
                </button>
            </div>
        </div>
    `;
};

// 3. نافذة التداول والتخمين بـ Devnet SOL
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
        <div style="background: #1c1c22; border: 1px solid rgba(20, 241, 149, 0.4); border-radius: 20px; width: 100%; max-width: 380px; padding: 20px; color: #fff; position: relative;">
            <button onclick="document.getElementById('swap-modal').remove()" style="position: absolute; top: 12px; left: 12px; background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;">✕</button>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <span style="background: rgba(20,241,149,0.2); color: #14F195; font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: bold;">SOLANA DEVNET</span>
                <h3 style="margin: 6px 0 0 0; color: #fcb045; font-size: 1.15rem;">تخمين فوز ${teamName}</h3>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 12px; margin-bottom: 15px;">
                <label style="font-size: 0.75rem; color: #aaa; display: block; margin-bottom: 6px;">المبلغ بـ Devnet SOL:</label>
                <input type="number" id="swap-amount" value="0.1" step="0.1" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; color: #fff; font-size: 1rem; outline: none;">
            </div>

            <button onclick="window.executeDevnetSwap('${teamName}')" style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: 900; font-size: 0.9rem; cursor: pointer;">
                🚀 تأكيد الشراء بالـ Devnet SOL
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

// 4. تنفيذ معاملة الشراء التجريبية
window.executeDevnetSwap = function(teamName) {
    const amount = document.getElementById("swap-amount")?.value || "0.1";
    alert(`✅ تم الشراء بنجاح عبر Solana Devnet!\n\nتم خصم ${amount} Devnet SOL لتخمين فوز ${teamName}.`);
    const modal = document.getElementById("swap-modal");
    if (modal) modal.remove();
};
        
