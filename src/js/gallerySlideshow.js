import gsap from 'gsap';
import Delaunator from 'delaunator';

// Import all gallery images
import img1 from '../assets/images/gallery/1.jpeg';
import img2 from '../assets/images/gallery/2.jpeg';
import img3 from '../assets/images/gallery/3.jpeg';
import img4 from '../assets/images/gallery/4.jpeg';
import img5 from '../assets/images/gallery/5.jpeg';
import img6 from '../assets/images/gallery/6.jpeg';
import img7 from '../assets/images/gallery/7.jpeg';
import img8 from '../assets/images/gallery/8.jpeg';
import img9 from '../assets/images/gallery/9.jpeg';
import img10 from '../assets/images/gallery/10.jpeg';
import img11 from '../assets/images/gallery/11.jpeg';
import img12 from '../assets/images/gallery/12.jpeg';
import img13 from '../assets/images/gallery/13.jpeg';

const TWO_PI = Math.PI * 2;

var images = [],
	imageIndex = 0;

var image,
	imageWidth = 0,
	imageHeight = 0;

var vertices = [],
	indices = [],
	fragments = [];

var container;

var clickPosition = [0, 0];

export function initGallerySlideshow() {
	// Check if screen width is greater than 768px
	if (window.innerWidth <= 768) {
		return null;
	}

	container = document.querySelector('.player-page__gallery');

	if (!container) {
		console.warn('Gallery container not found');
		return null;
	}

	// Get container dimensions
	const rect = container.getBoundingClientRect();
	imageWidth = rect.width;
	imageHeight = rect.height;
	clickPosition = [imageWidth * 0.5, imageHeight * 0.5];

	gsap.set(container, { perspective: 500 });

	// Load images - exactly like in animation.js
	var urls = [
		img1, img2, img3, img4, img5, img6, img7,
		img8, img9, img10, img11, img12, img13
	];

	var loaded = 0;

	// Load first image immediately
	images[0] = image = new Image();
	image.onload = function () {
		if (++loaded === 1) {
			imagesLoaded();
			// Load rest of images
			for (var i = 1; i < urls.length; i++) {
				images[i] = image = new Image();
				image.src = urls[i];
			}
		}
	};
	image.src = urls[0];
}

function imagesLoaded() {
	placeImage(false);
	triangulate();
	shatter();
}

function placeImage(transitionIn) {
	image = images[imageIndex];

	if (++imageIndex === images.length) imageIndex = 0;

	// Add click listener for manual trigger (but we'll use auto-trigger)
	image.addEventListener('click', imageClickHandler);

	// Don't set inline styles - let CSS handle it
	container.appendChild(image);

	if (transitionIn !== false) {
		// Dynamic Island style animation: scale + fade
		gsap.fromTo(image,
			{
				scale: 0.8,
				opacity: 0
			},
			{
				scale: 1,
				opacity: 1,
				duration: 0.6,
				ease: 'power2.out'
			}
		);
	}

	// Auto-trigger after 3 seconds
	setTimeout(function () {
		if (image && image.parentNode === container) {
			imageClickHandler();
		}
	}, 3000);
}

function imageClickHandler(event) {
	// Update dimensions in case of resize
	const rect = container.getBoundingClientRect();
	imageWidth = rect.width;
	imageHeight = rect.height;

	// Use center position for auto-trigger
	if (event) {
		var box = image.getBoundingClientRect(),
			top = box.top,
			left = box.left;
		clickPosition[0] = event.clientX - left;
		clickPosition[1] = event.clientY - top;
	} else {
		clickPosition[0] = imageWidth * 0.5;
		clickPosition[1] = imageHeight * 0.5;
	}

	triangulate();
	shatter();
}

function triangulate() {
	var rings = [
		{ r: 50, c: 12 },
		{ r: 150, c: 12 },
		{ r: 300, c: 12 },
		{ r: 1200, c: 12 }
	],
		x,
		y,
		centerX = clickPosition[0],
		centerY = clickPosition[1];

	vertices = [];
	vertices.push([centerX, centerY]);

	rings.forEach(function (ring) {
		var radius = ring.r,
			count = ring.c,
			variance = radius * 0.25;

		for (var i = 0; i < count; i++) {
			x = Math.cos((i / count) * TWO_PI) * radius + centerX + randomRange(-variance, variance);
			y = Math.sin((i / count) * TWO_PI) * radius + centerY + randomRange(-variance, variance);
			vertices.push([x, y]);
		}
	});

	vertices.forEach(function (v) {
		v[0] = clamp(v[0], 0, imageWidth);
		v[1] = clamp(v[1], 0, imageHeight);
	});

	const delaunay = Delaunator.from(vertices);
	indices = Array.from(delaunay.triangles);
}

function shatter() {
	var p0, p1, p2, fragment;

	var tl0 = gsap.timeline({ onComplete: shatterCompleteHandler });

	for (var i = 0; i < indices.length; i += 3) {
		p0 = vertices[indices[i + 0]];
		p1 = vertices[indices[i + 1]];
		p2 = vertices[indices[i + 2]];

		fragment = new Fragment(p0, p1, p2);

		var dx = fragment.centroid[0] - clickPosition[0],
			dy = fragment.centroid[1] - clickPosition[1],
			d = Math.sqrt(dx * dx + dy * dy),
			rx = 30 * sign(dy),
			ry = 90 * -sign(dx),
			delay = d * 0.003 * randomRange(0.9, 1.1);

		fragment.canvas.style.zIndex = Math.floor(d).toString();

		var tl1 = gsap.timeline();

		tl1.to(fragment.canvas, {
			z: -500,
			rotationX: rx,
			rotationY: ry,
			duration: 1,
			ease: 'cubic.in'
		});
		tl1.to(fragment.canvas, { opacity: 0, duration: 0.4 }, 0.6);

		tl0.add(tl1, delay);

		fragments.push(fragment);
		container.appendChild(fragment.canvas);
	}

	container.removeChild(image);
	image.removeEventListener('click', imageClickHandler);
}

function shatterCompleteHandler() {
	fragments.forEach(function (f) {
		container.removeChild(f.canvas);
	});
	fragments.length = 0;
	vertices.length = 0;
	indices.length = 0;

	placeImage();
}

function randomRange(min, max) {
	return min + (max - min) * Math.random();
}

function clamp(x, min, max) {
	return x < min ? min : (x > max ? max : x);
}

function sign(x) {
	return x < 0 ? -1 : 1;
}

var Fragment = function (v0, v1, v2) {
	this.v0 = v0;
	this.v1 = v1;
	this.v2 = v2;

	this.computeBoundingBox();
	this.computeCentroid();
	this.createCanvas();
	this.clip();
};

Fragment.prototype = {
	computeBoundingBox: function () {
		var xMin = Math.min(this.v0[0], this.v1[0], this.v2[0]),
			xMax = Math.max(this.v0[0], this.v1[0], this.v2[0]),
			yMin = Math.min(this.v0[1], this.v1[1], this.v2[1]),
			yMax = Math.max(this.v0[1], this.v1[1], this.v2[1]);

		this.box = {
			x: xMin,
			y: yMin,
			w: xMax - xMin,
			h: yMax - yMin
		};
	},
	computeCentroid: function () {
		var x = (this.v0[0] + this.v1[0] + this.v2[0]) / 3,
			y = (this.v0[1] + this.v1[1] + this.v2[1]) / 3;

		this.centroid = [x, y];
	},
	createCanvas: function () {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.box.w;
		this.canvas.height = this.box.h;
		this.canvas.style.width = this.box.w + 'px';
		this.canvas.style.height = this.box.h + 'px';
		this.canvas.style.left = this.box.x + 'px';
		this.canvas.style.top = this.box.y + 'px';
		this.canvas.style.position = 'absolute';
		this.canvas.style.backfaceVisibility = 'hidden';
		this.ctx = this.canvas.getContext('2d');
	},
	clip: function () {
		this.ctx.translate(-this.box.x, -this.box.y);
		this.ctx.beginPath();
		this.ctx.moveTo(this.v0[0], this.v0[1]);
		this.ctx.lineTo(this.v1[0], this.v1[1]);
		this.ctx.lineTo(this.v2[0], this.v2[1]);
		this.ctx.closePath();
		this.ctx.clip();
		this.ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
	}
};
