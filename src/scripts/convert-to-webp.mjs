import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';

await imagemin(['src/assets/images/*.{jpg,png}'], {
	destination: 'src/assets/images',
	plugins: [
		imageminWebp({ quality: 80 })
	]
});

console.log('Images converted to WebP');