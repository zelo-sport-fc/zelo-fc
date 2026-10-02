const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
const bs58 = require('bs58'); // للتأكد من فك تشفير المفتاح الخاص بجميع الصيغ

// الاتصال بشبكة Solana Devnet
const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');

// دالة جلب محفظة السيرفر الرئيسية بطريقة آمنة
function getServerPayer() {
    const rawKey = process.env.SOLANA_PRIVATE_KEY;
    if (!rawKey) {
        throw new Error("⚠️ لم يتم العثور على SOLANA_PRIVATE_KEY في متغيرات البيئة.");
    }

    try {
        if (rawKey.startsWith('[')) {
            // صيغة JSON Array: [1, 2, 3...]
            return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(rawKey)));
        } else {
            // صيغة Base58 String
            return Keypair.fromSecretKey(bs58.decode(rawKey));
        }
    } catch (e) {
        throw new Error("❌ فشل في فك تشفير SOLANA_PRIVATE_KEY: " + e.message);
    }
}

/**
 * دالة إنشاء توكن جديد وتجهيز سوق Meteora DBC له
 */
async function createMatchTeamToken(teamName, teamSymbol) {
    try {
        const serverPayer = getServerPayer();
        console.log(`🚀 جاري سك توكن جديد للفريق: ${teamName} (${teamSymbol})...`);
        console.log(`👤 عنوان محفظة المنشئ: ${serverPayer.publicKey.toBase58()}`);

        // 1. إنشاء SPL Token Mint خاص بالفريق على Solana
        const mintKeypair = Keypair.generate();
        const tokenMint = await createMint(
            connection,
            serverPayer,             // الدافع لرسوم المعاملة
            serverPayer.publicKey,   // سلطة السك (Mint Authority)
            serverPayer.publicKey,   // سلطة التجميد (Freeze Authority)
            6,                       // 6 خانات عشرية
            mintKeypair
        );

        const mintAddress = tokenMint.toBase58();
        console.log(`✅ تم إنشاء التوكن بنجاح!`);
        console.log(`🔑 Token Mint Address: ${mintAddress}`);

        // 2. إعداد معلمة منحنى السيولة (Dynamic Bonding Curve)
        const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
        
        const dbcPoolConfig = {
            baseMint: tokenMint,
            quoteMint: WSOL_MINT,
            initialPrice: 0.0001,      // سعر البداية بـ SOL
            migrationThreshold: 100,    // حد انتقال السيولة لـ DAMM v2
        };

        // 3. بناء عنوان السوق التجريبي (Pool Address)
        // عند استخدام Meteora DBC SDK في المرحلة القادمة سنستبدل هذا بالاستدعاء المباشر للعقد
        const marketAddress = mintAddress; 

        return {
            success: true,
            teamName: teamName,
            tokenMint: mintAddress,
            marketAddress: marketAddress,
            meteoraUrl: `https://app.meteora.ag/pools/${mintAddress}`
        };

    } catch (error) {
        console.error("❌ خطأ أثناء إنشاء توكن الفريق مع Meteora DBC:", error);
        throw error;
    }
}

module.exports = { createMatchTeamToken };
