const path = require('path');

module.exports = {
  webpack: {
    alias: {
      "components": path.resolve(__dirname, "src/components"),
      "utils": path.resolve(__dirname, "src/utils"),
      "i18n": path.resolve(__dirname, "src/i18n"),
      "interfaces": path.resolve(__dirname, "src/interfaces"),
      "layouts": path.resolve(__dirname, "src/layouts"),
      "providers": path.resolve(__dirname, "src/providers"),
      "views": path.resolve(__dirname, "src/views"),
      "services": path.resolve(__dirname, "src/services"),
      "styles": path.resolve(__dirname, "src/styles"),
      "assets": path.resolve(__dirname, "src/assets"),
      "config": path.resolve(__dirname, "src/config"),
    },
  },
};
