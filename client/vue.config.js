module.exports = {
    transpileDependencies: ['vuetify'],
    publicPath: './',
    chainWebpack: config => {
        // ios で reload 時に更新内容が反映されないため
        config.plugins.delete('preload');
        // 画像ファイルを base64 に変換する
        config.module
        .rule('images')
        .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
        .use('url-loader')
        .loader('url-loader')
        .options({
          limit: 4096,
          fallback: {
            loader: 'file-loader',
            options: {
                    name: 'img/[name].[hash:8].[ext]'
                }
            }
        })
    },
};