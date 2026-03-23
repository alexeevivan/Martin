const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const posthtmlInclude = require('posthtml-include');

module.exports = (env, argv) => {
	const isDev = argv.mode === 'development';

	return {
		entry: './src/js/index.js',

		output: {
			publicPath: '/Martin/',
			path: path.resolve(__dirname, 'dist'),
			filename: 'bundle.js',
			clean: true,
		},

		mode: isDev ? 'development' : 'production',

		devServer: {
			static: path.join(__dirname, 'dist'),
			port: 3000,
			open: true,
			hot: true,
		},

		module: {
			rules: [
				// HTML + includes
				{
					test: /\.html$/,
					use: [
						{
							loader: 'posthtml-loader',
							options: {
								plugins: [
									posthtmlInclude({
										root: path.resolve(__dirname, 'src/html'),
									}),
								],
							},
						},
						'html-loader',
					],
				},

				// SCSS
				{
					test: /\.s[ac]ss$/i,
					use: [
						isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
						'css-loader',
						'sass-loader',
					],
				},

				// Images
				{
					test: /\.(png|jpe?g|gif|webp|svg)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'images/[name][hash][ext]',
					},
				},

				// Videos
				{
					test: /\.(mp4|webm|ogg)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'videos/[name][hash][ext]',
					},
				},

				// Audio
				{
					test: /\.(mp3|wav|ogg)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'audio/[name][hash][ext]',
					},
				},
			],
		},

		plugins: [
			new HtmlWebpackPlugin({
				template: './src/index.html',
				minify: !isDev && {
					collapseWhitespace: true,
					removeComments: true,
				},
			}),
			!isDev &&
			new MiniCssExtractPlugin({
				filename: 'styles.css',
			}),
		].filter(Boolean),

		optimization: {
			minimize: !isDev,
			minimizer: ['...', new CssMinimizerPlugin()],
		},
	};
};