// translation.js

import translations from '../json/i18n-data.json';

// --- (1) Константы и настройки ---
const STORAGE_KEY = 'siteLang';
const DEFAULT_LANG = 'ru';
const SUPPORTED_LANGS = ['ru', 'en']; // Список поддерживаемых классов для очистки

/**
 * Обновляет контент и устанавливает класс языка на <body>.
 * @param {string} langCode - Код языка ('ru', 'en').
 */
function updateContent(langCode) {
	const currentTranslations = translations[langCode];
	if (!currentTranslations) {
		console.error(`Translations not found for language code: ${langCode}`);
		return;
	}

	// 1. Обновляем все элементы с атрибутом data-i18n
	document.querySelectorAll('[data-i18n]').forEach(element => {
		const key = element.getAttribute('data-i18n');

		if (currentTranslations[key]) {
			// Используем innerHTML для поддержки тегов (например, <strong>)
			element.innerHTML = currentTranslations[key];
		} else {
			console.warn(`Translation key not found: ${key} for ${langCode}`);
		}
	});

	// --- 💡 ИЗМЕНЕНИЕ: Управление классами для стилизации шрифтов ---

	// 2. Очищаем старые классы языка с <body>, используя список SUPPORTED_LANGS
	document.body.classList.remove(...SUPPORTED_LANGS);

	// 3. Добавляем новый класс языка к <body>
	document.body.classList.add(langCode);

	document.querySelectorAll('[data-lang]').forEach(button => {
		button.classList.toggle('active', button.getAttribute('data-lang') === langCode);
	});
}

/**
 * Инициализирует язык при загрузке страницы и настраивает обработчики кликов.
 * Это основная функция, которая вызывается из app.js.
 */
export function initLanguage() {
	// 1. Определяем язык: сохраненный в localStorage или русский по умолчанию
	const savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

	// 2. Первоначальное обновление контента
	updateContent(savedLang);

	// 3. Устанавливаем обработчики событий для кнопок переключения
	// (Ищет все элементы, у которых есть атрибут data-lang)
	document.querySelectorAll('[data-lang]').forEach(button => {
		// Проверяем, что это не BODY/HTML элемент
		if (button.tagName !== 'BODY' && button.tagName !== 'HTML') {
			button.addEventListener('click', (event) => {
				const newLang = event.currentTarget.getAttribute('data-lang');

				// Сохраняем новый выбор в хранилище
				localStorage.setItem(STORAGE_KEY, newLang);

				// Обновляем контент
				updateContent(newLang);
			});
		}
	});
}