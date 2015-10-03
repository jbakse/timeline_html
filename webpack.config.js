module.exports = {
    entry: "./javascript/entry.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.scss$/, loader: "style!css!autoprefixer-loader!sass" },
            { test: /\.css$/, loader: "style!css" },
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
            { test: /\.(png|jpg|svg)$/, loader: 'url?limit=25000'}
        ]
    }
};
