/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-require-imports */
const cacheArray = require("./cache");
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  sw: "service-worker.js",
  runtimeCaching: cacheArray,
});

module.exports = withPWA({});
