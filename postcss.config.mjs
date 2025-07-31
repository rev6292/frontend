const config = {
  plugins: [
    "@tailwindcss/postcss",
    [
      "autoprefixer",
      {
        flexbox: "no-2009",
        grid: "autoplace",
        overrideBrowserslist: [
          "> 1%",
          "last 2 versions",
          "not dead",
          "Chrome >= 60",
          "Firefox >= 60",
          "Safari >= 12",
          "Edge >= 79",
          "iOS >= 12",
          "Android >= 60"
        ],
        cascade: true,
        add: true,
        remove: false, // 既存のベンダープレフィックスを削除しない
        supports: true,
        flexbox: "no-2009",
        grid: "autoplace",
        env: "production"
      }
    ]
  ],
};

export default config;
