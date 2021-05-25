import { resolve } from "path";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

export default {
  entry: "./src/index.ts",
  devtool: "inline-source-map",
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
  plugins: [new BundleAnalyzerPlugin()],
};
