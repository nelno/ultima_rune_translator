(function () {
  var SVG = "http://www.w3.org/2000/svg";
  var alphabet = globalThis.RunicAlphabet;
  var pipeline = globalThis.RunicPipeline;

  var source = document.getElementById("source");
  var output = document.getElementById("output");
  var reading = document.getElementById("reading");
  var key = document.getElementById("key");
  var digraphsInput = document.getElementById("digraphs");
  var alphabetInputs = document.querySelectorAll('input[name="alphabet"]');

  function options() {
    var alphabetName = "full";
    alphabetInputs.forEach(function (input) {
      if (input.checked) alphabetName = input.value;
    });
    return { digraphs: digraphsInput.checked, alphabet: alphabetName };
  }

  function svgFor(glyphKey, label) {
    var glyph = alphabet.glyphs[glyphKey];
    var svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", glyph.box.join(" "));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
    var title = document.createElementNS(SVG, "title");
    title.textContent = label;
    svg.appendChild(title);
    glyph.paths.forEach(function (d) {
      var path = document.createElementNS(SVG, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  function render() {
    var tokens = pipeline.run(source.value, options());
    output.replaceChildren();
    tokens.forEach(function (token) {
      if (token.type === "rune") {
        var label = token.shared ? token.letters + ", written with the U rune" : token.letters;
        output.appendChild(svgFor(token.key, label));
        return;
      }
      if (token.type === "space") {
        var gap = document.createElement("span");
        gap.className = "gap";
        gap.setAttribute("role", "separator");
        gap.setAttribute("aria-label", "space");
        output.appendChild(gap);
        return;
      }
      if (token.type === "break") {
        var br = document.createElement("span");
        br.className = "break";
        output.appendChild(br);
        return;
      }
      var span = document.createElement("span");
      span.className = token.type === "missing" ? "missing" : "raw";
      span.textContent = token.letters;
      if (token.type === "missing") {
        span.title = "The Ultima IV alphabet has no rune for Q";
      }
      output.appendChild(span);
    });
    var text = globalThis.RunicTransliterate.reading(tokens);
    reading.textContent = text;
    reading.hidden = !text;
  }

  function insertAtCursor(letters) {
    var start = source.selectionStart;
    var end = source.selectionEnd;
    var value = source.value;
    if (start == null) {
      source.value = value + letters;
    } else {
      source.value = value.slice(0, start) + letters + value.slice(end);
      var caret = start + letters.length;
      source.selectionStart = caret;
      source.selectionEnd = caret;
    }
    source.focus();
    render();
  }

  function buildKey() {
    var mode = options().alphabet;
    key.replaceChildren();
    alphabet.letters.forEach(function (letter) {
      key.appendChild(keyButton(letter, mode));
    });
    alphabet.digraphs.forEach(function (pair) {
      key.appendChild(keyButton(pair, mode));
    });
  }

  function keyButton(name, mode) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "key-item";
    button.dataset.letters = name;
    var showMissingQ = mode === "ultima4" && name === "Q";
    var sharesU = mode === "ultima4" && name === "V";
    if (showMissingQ) {
      var mark = document.createElement("span");
      mark.className = "key-missing";
      mark.textContent = "Q";
      button.appendChild(mark);
    } else {
      button.appendChild(svgFor(sharesU ? "U" : name, name));
    }
    var caption = document.createElement("span");
    caption.className = "key-caption";
    caption.textContent = showMissingQ ? "no rune" : sharesU ? "U / V" : name;
    button.appendChild(caption);
    button.addEventListener("click", function () {
      insertAtCursor(name.toLowerCase());
    });
    return button;
  }

  source.addEventListener("input", render);
  digraphsInput.addEventListener("change", render);
  alphabetInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      buildKey();
      render();
    });
  });

  buildKey();
  render();
})();
