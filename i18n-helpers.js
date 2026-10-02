function t(key) {
    const lang = (typeof userState !== 'undefined' && userState?.lang) || 'ar';
    return (typeof i18n !== 'undefined' && i18n[lang]?.[key]) || key;
}

function getClubName(club) {
    if (!club) return '';
    const lang = (typeof userState !== 'undefined' && userState?.lang) || 'ar';
    return lang === 'ar' ? (club.nameAr || club.nameEn || '') : (club.nameEn || club.nameAr || '');
}

function getTaskName(task) {
    if (!task) return '';
    const lang = (typeof userState !== 'undefined' && userState?.lang) || 'ar';
    return lang === 'ar' ? (task.textAr || task.textEn || '') : (task.textEn || task.textAr || '');
}

function applyLanguageSettings() {
    const lang = (typeof userState !== 'undefined' && userState?.lang) || 'ar';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    const navItems = document.querySelectorAll('.nav-item span:not(.icon)');
    if (navItems.length >= 5) {
        ['navHome', 'navTasks', 'navFriends', 'navLeaderboard', 'navWallet'].forEach((key, i) => {
            navItems[i].innerText = t(key);
        });
    }
}
