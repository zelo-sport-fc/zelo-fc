// ==========================================
// ⚽ Zelo Sport - Auto Launchpad & Trading Engine
// ==========================================

// بيانات المباريات (تتضمن حالة السوق وحالة الـ Bonding Curve)
window.sampleMatchesData = [
    { 
        id: 'm1', 
        teamA: 'Real Madrid', 
        teamB: 'Barcelona',
        isLaunched: false, // لم يتم إطلاق التوكن بعد
        tokenA: null,
        tokenB: null,
        bondingProgress: 0 // نسبة اكتمال منحنى التسعير
    },
    { 
        id: 'm2', 
        teamA: 'Liverpool', 
        teamB: 'Manchester City',
        isLaunched: true, // التوكن منشأ ومفعل
        tokenA: 'So11111111111111111111111111111111111111112',
        tokenB: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        bondingProgress: 45 // 45% نحو الانتقال لـ Meteora DLMM
    }
];

// 1. دالة إطلاق توكنات المباراة على Meteora DBC
window.handleLaunchMatchTokens = async function(matchId) {
    const match = window.sampleMatchesData.find(m => m.id === matchId);
    if (!match) return;

    try {
        const btn = document.getElementById(`launch-btn-${matchId}`);
        if (btn) {
            btn.disabled = true;
            btn.innerText = '⚡ جاري إنشاء التوكنات على Solana...';
        }

        // طلب الباك إند لإنشاء التوكنات والـ Bonding Curve Pool
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

        if (data.success) {
            // تحديث حالة المباراة محلياً
            match.isLaunched = true;
            match.tokenA = data.tokenAMint;
            match.tokenB = data.tokenBMint;
            match.bondingProgress = 5; // بداية المنحنى

            alert(`🎉 تم إطلاق سوق توكنات المباراة بنجاح عبر Meteora DBC!\n\nReal Madrid Token: ${data.tokenAMint.substring(0,8)}...\nBarcelona Token: ${data.tokenBMint.substring(0,8)}...`);
            
            // إعادة تحديث الواجهة فوراً
            const mainContent = document.getElementById("main-content");
            if (mainContent) window.renderMeteoraPage(mainContent);
        } else {
            alert(`❌ فشل إطلاق السوق: ${data.error}`);
        }
    } catch (err) {
        console.error('Launch Error:', err);
        alert('حدث خطأ أثناء الاتصال بسيرفر الإطلاق');
    }
};

// 2. دالة توليد بطاقة المباراة الاحترافية للمسابقة
window.renderMatchTradeCard = function(match) {
    // إذا لم تطلق المباراة بعد، نُظهر زر "إطلاق التوكن"
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

    // إذا كانت منشأة، نُظهر أزرار التداول وشريط تقدم منحنى الـ Bonding Curve
    return `
        <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.7); border: 1px solid rgba(20, 241, 149, 0.3); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.7rem; color: #14F195; background: rgba(20,241,149,0.15); padding: 4px 8px; border-radius: 6px; font-weight: bold;">LIVE DBC MARKET</span>
            </div>

            <!-- شريط تقدم الـ Bonding Curve للمسابقة -->
            <div style="margin: 4px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #aaa; margin-bottom: 4px;">
                    <span>📈 Bonding Curve Progress</span>
                    <span style="color: #14F195; font-weight: bold;">${match.bondingProgress || 10}%</span>
                </div>
                <div style="width: 100%; background: #0f1721; height: 6px; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${match.bondingProgress || 10}%; background: linear-gradient(90deg, #14F195, #00b4d8); height: 100%;"></div>
                </div>
            </div>
            
            <!-- أزرار التداول المباشر -->
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
