// Stage 1: Latin letters to Britannian runes, one rune per letter.
// TH, EE, NG, EA, and ST are single runes when digraphs are on.
// An apostrophe between two letters keeps them from joining and is not carved.
(function (root) {
  var DIGRAPHS = { TH: true, EE: true, NG: true, EA: true, ST: true };

  function isLetter(ch) {
    return ch >= "A" && ch <= "Z";
  }

  function transliterate(text, options) {
    var digraphs = !options || options.digraphs !== false;
    var ultima4 = options && options.alphabet === "ultima4";
    var chars = Array.from(String(text == null ? "" : text).normalize("NFKC"));
    var tokens = [];

    function pushSpace() {
      if (tokens.length && tokens[tokens.length - 1].type === "space") return;
      if (!tokens.length) return;
      tokens.push({ type: "space" });
    }

    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && chars[i + 1] === "\n") i++;
        if (tokens.length && tokens[tokens.length - 1].type === "space") tokens.pop();
        if (tokens.length && tokens[tokens.length - 1].type !== "break") {
          tokens.push({ type: "break" });
        }
        continue;
      }
      if (/\s/.test(ch)) {
        pushSpace();
        continue;
      }
      if (ch === "'" || ch === "\u2019") continue;

      var up = ch.toUpperCase();
      if (digraphs && i + 1 < chars.length) {
        var next = chars[i + 1].toUpperCase();
        var pair = up + next;
        if (DIGRAPHS[pair]) {
          tokens.push({ type: "rune", key: pair, letters: pair });
          i++;
          continue;
        }
      }

      if (isLetter(up)) {
        if (ultima4 && up === "Q") {
          tokens.push({ type: "missing", letters: "Q" });
          continue;
        }
        if (ultima4 && up === "V") {
          tokens.push({ type: "rune", key: "U", letters: "V", shared: true });
          continue;
        }
        tokens.push({ type: "rune", key: up, letters: up });
        continue;
      }

      tokens.push({ type: "raw", letters: ch });
    }

    if (tokens.length && tokens[tokens.length - 1].type === "space") tokens.pop();
    return tokens;
  }

  function reading(tokens) {
    var parts = [];
    var word = [];
    function flush() {
      if (word.length) {
        parts.push(word.join(" \u00B7 "));
        word = [];
      }
    }
    tokens.forEach(function (token) {
      if (token.type === "space" || token.type === "break") {
        flush();
        return;
      }
      if (token.type === "missing") word.push("(" + token.letters + ")");
      else word.push(token.letters);
    });
    flush();
    return parts.join("\u00A0\u00A0\u00A0\u00A0");
  }

  root.RunicTransliterate = { transliterate: transliterate, reading: reading };
})(typeof globalThis !== "undefined" ? globalThis : this);
