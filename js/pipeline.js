// Translation pipeline.
//
// Stage 1, implemented: transliterate a Latin spelling into runes.
// Stage 2, not implemented: translate English into the spelling that
// should be carved, then hand that spelling to stage 1.
//
// A stage is (text, options) => string. registerStage() inserts it
// before transliteration. Stages must not draw glyphs. Mark a pair
// that should stay two runes with an apostrophe (moon'glow); stage 1
// already honors that and does not carve the apostrophe.
//
// Stage 2 should:
//   1. Normalize English (case, quotes, contractions such as don't).
//   2. Leave punctuation in place for stage 1 to pass through.
//   3. Apply a lexicon where the carved spelling differs from modern
//      English, including proper names and pairs that must not join.
// The glyph table and the renderer stay as they are. Britannian is
// English written in runes, so stage 1 already writes English text
// in the alphabet. Stage 2 is only for when the carved spelling
// should differ from the letters the user typed.
(function (root) {
  var stages = [];

  function registerStage(fn) {
    if (typeof fn !== "function") throw new TypeError("A stage must be a function");
    stages.push(fn);
    return stages.length;
  }

  function prepare(text, options) {
    return stages.reduce(function (value, stage) {
      return stage(value, options);
    }, String(text == null ? "" : text));
  }

  function run(text, options) {
    var spelling = prepare(text, options);
    return root.RunicTransliterate.transliterate(spelling, options);
  }

  root.RunicPipeline = {
    registerStage: registerStage,
    prepare: prepare,
    run: run
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
