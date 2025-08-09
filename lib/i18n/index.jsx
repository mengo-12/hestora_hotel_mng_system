const { createTranslation } = require('next-i18next')
const i18nConfig = require('../../next-i18next.config')

const { useTranslation, Trans, t } = createTranslation(i18nConfig)

module.exports = { useTranslation, Trans, t }