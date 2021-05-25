import { resolve } from "path";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
console.log(resolve("dist"));

export default {
  entry: {
    main: "./src/index.ts",
    components: "./src/components/components.ts",
  },
  mode: process.env.NODE_ENV || "production",
  stats: {
    errorDetails: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  //plugins: [new BundleAnalyzerPlugin()],
  output: {
    filename: "[name].bundle.js",
    path: resolve("dist"),
  },
};
