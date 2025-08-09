

module.exports = {
    i18n: {
        defaultLocale: 'ar',
        locales: ['ar', 'en'],
        // localeDetection: false,
    },
    localePath: './public/locales',
    reloadOnPrerender: process.env.NODE_ENV === 'development',
};

// module.exports.languages = module.exports.i18n.locales;