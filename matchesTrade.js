// ==========================================
// ⚽ Zelo Sport - Meteora Devnet Launchpad Engine
// ==========================================

window.IS_DEVNET = true;
window.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const VAULT_PUBLIC_KEY = 'G2zT2vK1y2426mKxT1p3zT2vK1y2426mKxT1p3zT2vK1'; 

// 1. جلب المباريات لصفحة Meteora بنفس سرعة قسم التوقعات
window.fetchMatchesForMeteora = async function() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        try {
            const { data, error } = await supabaseClient
                .from('matches')
                .select('*')
                .neq('status', 'FINISHED')
                .order('match_date', { ascending: true })
                .limit(20);

            if (!error && data && data.length > 0) {
                return data.map(m => {
                    const priceA = (1.25 + (m.bonding_progress_team_a || 50) * 0.02).toFixed(2);
                    const priceB = (1.25 + (m.bonding_progress_team_b || 50) * 0.02).toFixed(2);
                    return {
                        id: m.id,
                        teamA: m.team_a || 'Team A',
                        teamB: m.team_b || 'Team B',
                        matchTime: m.match_date,
                        priceA: priceA,
                        priceB: priceB,
                        bondingProgressA: m.bonding_progress_team_a || 50,
                        bondingProgressB: m.bonding_progress_team_b || 50
                    };
                });
            }
        } catch (err) {
            console.error("خطأ في جلب مباريات Meteora:", err);
        }
    }
    return [];
};

// 2. عرض واجهة سوق Meteora فوراً
window.renderMeteoraPage = async function(container) {
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 30px 15px;">
            <div style="display: inline-block; width: 26px; height: 26px; border: 3px solid rgba(252,176,69,0.2); border-radius: 50%; border-top-color: #fcb045; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #aaa; font-size: 0.8rem; margin-top: 10px;">جاري تحميل سوق Meteora SOL...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    const matches = await window.fetchMatchesForMeteora();

    let html = `
        <div style="text-align: center; margin-bottom: 18px;">
            <div style="display: inline-block; background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); padding: 3px 10px; border-radius: 15px; font-size: 0.68rem; color: #14F195; font-weight: bold; margin-bottom: 6px;">
                ⚡ METEORA DBC LAUNCHPAD
            </div>
            <h3 style="margin: 0; color: #fcb045; font-size: 1.1rem;">سوق تداول توكنات المباريات</h3>
        </div>
    `;

    if (matches.length > 0) {
        matches.forEach(m => {
            const matchDate = new Date(m.matchTime);
            const formattedDate = !isNaN(matchDate.getTime()) ? matchDate.toLocaleDateString('ar-EG') : '';
            const formattedTime = !isNaN(matchDate.getTime()) ? matchDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

            html += `
                <div class="card" style="padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.9); border: 1px solid rgba(252, 176, 69, 0.25); border-radius: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                        <span style="font-size: 0.72rem; color: #14F195; font-weight: bold;">⚽ ${m.teamA} VS ${m.teamB}</span>
                        <span style="font-size: 0.68rem; color: #aaa;">📅 ${formattedDate} ${formattedTime}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 8px;">
                        <div style="text-align: center; flex: 1;">
                            <span style="font-size: 0.65rem; color: #aaa; display: block;">${m.teamA}</span>
                            <strong style="font-size: 0.82rem; color: #14F195;">${m.priceA} SOL</strong>
                        </div>
                        <div style="border-left: 1px solid rgba(255,255,255,0.1);"></div>
                        <div style="text-align: center; flex: 1;">
                            <span style="font-size: 0.65rem; color: #aaa; display: block;">${m.teamB}</span>
                            <strong style="font-size: 0.82rem; color: #f72585;">${m.priceB} SOL</strong>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.openSwapModal(${m.id}, '${m.teamA}', '${m.priceA}')" style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                            شراء ${m.teamA}
                        </button>
                        <button onclick="window.openSwapModal(${m.id}, '${m.teamB}', '${m.priceB}')" style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                            شراء ${m.teamB}
                        </button>
                    </div>
                </div>
            `;
        });
    } else {
        html += `<div style="text-align:center; color:#aaa; padding:20px;">لا توجد مباريات متاحة للتداول حالياً.</div>`;
    }

    container.innerHTML = html;
};
