import { createColorBends } from './effects/contact.js';

let colorBendsInstance = null;

// Функция для определения, является ли устройство мобильным
function isMobileDevice() {
	return window.innerWidth <= 768;
}

// Функция для управления классом desktop
function updateDesktopClass() {
	// Ищем элементы без учета класса desktop
	const card = document.querySelector('#contact-container .card');
	const accents = document.querySelector('#contact-container .accents');
	const panelRight = document.querySelector('.panel-right');

	const isMobile = isMobileDevice();

	if (card) {
		if (isMobile) {
			// На мобильных устройствах показываем карточку
			card.classList.remove('desktop');
		} else {
			// На десктопе скрываем карточку
			card.classList.add('desktop');
		}
	}

	if (accents) {
		if (isMobile) {
			// На мобильных устройствах показываем акценты
			accents.classList.remove('desktop');
		} else {
			// На десктопе скрываем акценты
			accents.classList.add('desktop');
		}
	}

	if (panelRight) {
		if (isMobile) {
			// На мобильных устройствах скрываем panel-right
			panelRight.style.display = 'none';
		} else {
			// На десктопе показываем panel-right
			panelRight.style.display = 'flex';
		}
	}
}

// Инициализация анимации для panel-right
export function initContactAnimation() {
	const container = document.querySelector('.panel-right .color-bends-container');

	if (!container) {
		console.warn('Contact animation container not found');
		return;
	}

	// Уничтожаем предыдущий экземпляр, если он существует
	if (colorBendsInstance) {
		colorBendsInstance.destroy();
		colorBendsInstance = null;
	}

	// Создаем анимацию только на десктопе
	if (!isMobileDevice()) {
		colorBendsInstance = createColorBends('.panel-right .color-bends-container', {
			rotation: 90,
			speed: 0.2,
			colors: ['#ff6060', '#FF9FFC'],
			transparent: true,
			autoRotate: 0,
			scale: 0.5,
			frequency: 1.4,
			warpStrength: 1,
			mouseInfluence: 1,
			parallax: 1.5,
			noise: 0.15,
			iterations: 1,
			intensity: 1,
			bandWidth: 7
		});
	}

	// Обновляем классы при инициализации
	updateDesktopClass();
}

// Обработчик изменения размера окна
function handleResize() {
	updateDesktopClass();

	// Пересоздаем анимацию при переходе между мобильным и десктопом
	const wasMobile = colorBendsInstance === null;
	const isMobile = isMobileDevice();

	if (wasMobile !== isMobile) {
		if (isMobile && colorBendsInstance) {
			// Переход на мобильное устройство - уничтожаем анимацию
			colorBendsInstance.destroy();
			colorBendsInstance = null;
		} else if (!isMobile && !colorBendsInstance) {
			// Переход на десктоп - создаем анимацию
			initContactAnimation();
		}
	}
}

// Инициализация при загрузке страницы
export function setupContactPage() {
	// Инициализируем анимацию
	initContactAnimation();

	// Добавляем обработчик изменения размера окна с debounce
	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(handleResize, 250);
	});

	// Обработчик для orientation change на мобильных устройствах
	window.addEventListener('orientationchange', () => {
		setTimeout(handleResize, 300);
	});
}

// Функция для очистки ресурсов
export function cleanupContactAnimation() {
	if (colorBendsInstance) {
		colorBendsInstance.destroy();
		colorBendsInstance = null;
	}
}
