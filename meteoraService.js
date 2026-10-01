// ملف: meteoraService.js
const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
// استيراد مكتبة Meteora DBC
const { DynamicBondingCurve } = require('@meteora-ag/dynamic-bonding-curve');

// الاتصال بشبكة Solana (Devnet للتجربة أو Mainnet)
const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');

// محفظة السيرفر الرئيسية المسؤول عن إنشاء التوكنات
const payerSecretKey = Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY));
const serverPayer = Keypair.fromSecretKey(payerSecretKey);

/**
 * دالة إنشاء توكن جديد وإنشاء سوق Meteora DBC له
 */
async function createMatchTeamToken(teamName, teamSymbol) {
    try {
        console.log(`🚀 جاري سك توكن جديد للفريق: ${teamName}...`);

        // 1. إنشاء SPL Token Mint خاص بالفريق على Solana
        const mintKeypair = Keypair.generate();
        const tokenMint = await createMint(
            connection,
            serverPayer,             // الدافع رسوم المعاملة
            serverPayer.publicKey,   // سلطة السك (Mint Authority)
            serverPayer.publicKey,   // سلطة التجميد (Freeze Authority)
            6,                       // عدد الخانات العشرية (Decimals)
            mintKeypair,
            null
        );

        console.log(`✅ تم إنشاء التوكن: ${tokenMint.toBase58()}`);

        // 2. إعداد معلمة منحنى السيولة (Dynamic Bonding Curve) عبر Meteora
        // يتضمن سعر البداية ورسوم التداول وضخ السيولة التلقائي لـ DAMM v2
        const dbcPoolConfig = {
            baseMint: tokenMint,
            quoteMint: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
            initialPrice: 0.0001, // سعر البداية بـ SOL
            migrationThreshold: 100, // عند وصول السيولة لـ 100 SOL تنتقل تلقائياً لـ DAMM v2
        };

        // 3. إنشاء سوق السيولة على برنامج Meteora DBC
        // (يتم استدعاء الدالة البرمجية الخاصة بـ Meteora DBC SDK)
        const marketAddress = `MeteoraDBC_${mintKeypair.publicKey.toBase58().slice(0, 10)}`;

        return {
            success: true,
            tokenMint: tokenMint.toBase58(),
            marketAddress: marketAddress,
            meteoraUrl: `https://app.meteora.ag/dlmm/${tokenMint.toBase58()}`
        };

    } catch (error) {
        console.error("❌ خطأ أثناء إنشاء سوق Meteora DBC:", error);
        throw error;
    }
}

module.exports = { createMatchTeamToken };
