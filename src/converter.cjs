const ttl2jsonld = require("@frogcat/ttl2jsonld").parse;

module.exports = class Converter {
  constructor() {}

  ttl_jsonld(ttl) {
    return ttl2jsonld(ttl);
  }
};
