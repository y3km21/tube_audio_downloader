const HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

var definePlugin = new webpack.DefinePlugin({
  __DISABLE_ELECTRON__: JSON.stringify(
    JSON.parse(process.env.DISABLE_ELECTRON || false)
  ),
});

var config = {
  // webpack
  mode: "production",
  entry: "./src/index.js",
  devtool: "inline-source-map",
  target: "electron-renderer",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    definePlugin,
  ],

  module: {
    rules: [
      //elm
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        use: [
          { loader: "elm-hot-webpack-loader" },
          {
            loader: "elm-webpack-loader",
            options: {},
          },
        ],
        exclude: [/node_modules/],
      },
      //scss
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".elm"],
    /*
    fallback: {
      fs: require.resolve("fs-extra"),
      path: require.resolve("path-browserify"),
      stream: require.resolve("stream-browserify"),
      constants: require.resolve("constants-browserify"),
      buffer: require.resolve("buffer/"),
      assert: require.resolve("assert/"),
      util: require.resolve("util/"),
    },
    */
  },
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    config.mode = "development";
    config.output = {
      path: path.resolve(__dirname, "./dist_dev"),
      filename: "index.js",
    };
    // config.target = "web";

    config.devServer = {
      contentBase: path.join(__dirname, "./dist_dev"),
      compress: true,
      port: 8080,
    };
  }

  return config;
};
