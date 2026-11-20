/*
 * RED HERRING — detailed 32x20 pixel fish SVGs.
 * Exposes window.RedHerringFishSVG(type, opts).
 */
(function () {
  "use strict";

  var PALETTES = {
    red:  { body: "#ff3d6e", shadow: "#7b0e3d", accent: "#ffd166" },
    blue: { body: "#35f0ff", shadow: "#0b5f8a", accent: "#e7ffff" },
    gold: { body: "#ffd166", shadow: "#a86a12", accent: "#fff3c4" }
  };

  var EYE = "#0b0f14";
  var WHITE = "#ffffff";
  var rainbowSeq = 0;

  var RAINBOW_STOPS = [
    [0, "#ff3d6e"], [16, "#ff9f1c"], [33, "#ffe066"],
    [50, "#63f5a8"], [67, "#35f0ff"], [84, "#7b6cff"], [100, "#ff5ce1"]
  ];

  /* Head faces right; the tail is on the left. Rows are inclusive: [y, x0, x1]. */
  var TAIL = [
    [5, 2, 4],
    [6, 2, 5],
    [7, 3, 6],
    [8, 4, 8],
    [9, 6, 8],
    [10, 6, 8],
    [11, 4, 8],
    [12, 3, 6],
    [13, 2, 5],
    [14, 2, 4]
  ];

  var DORSAL = [
    [2, 18, 19],
    [3, 16, 21],
    [4, 14, 23]
  ];

  var LOWER = [
    [16, 15, 21],
    [17, 16, 20],
    [18, 18, 19]
  ];

  var BODY = [
    [5, 13, 24],
    [6, 11, 26],
    [7, 9, 27],
    [8, 8, 28],
    [9, 7, 28],
    [10, 7, 28],
    [11, 8, 28],
    [12, 9, 27],
    [13, 10, 26],
    [14, 12, 24],
    [15, 14, 22]
  ];

  window.RedHerringFishSVG = function (type, opts) {
    var rainbow = type === "rainbow";
    var gradId = "rh-rainbow-" + (++rainbowSeq);
    var custom = opts && opts.palette && opts.palette.body && opts.palette.shadow && opts.palette.accent;
    var palette = rainbow
      ? { body: "url(#" + gradId + ")", shadow: "#4b1e78", accent: "#ffffff" }
      : (custom ? opts.palette : (PALETTES[type] || PALETTES.red));
    var groups = {};

    function rect(x, y, w, h, color) {
      if (!groups[color]) groups[color] = [];
      groups[color].push("    <rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + w + "\" height=\"" + h + "\"/>");
    }

    function span(y, x0, x1, color) {
      rect(x0, y, x1 - x0 + 1, 1, color);
    }

    function outline(spans, color) {
      for (var i = 0; i < spans.length; i++) {
        var y = spans[i][0];
        var x0 = spans[i][1];
        var x1 = spans[i][2];
        rect(x0 - 1, y, x1 - x0 + 3, 1, color);
        if (i === 0) rect(x0 - 1, y - 1, x1 - x0 + 3, 1, color);
        if (i === spans.length - 1) rect(x0 - 1, y + 1, x1 - x0 + 3, 1, color);
      }
    }

    function solid(spans, color) {
      for (var i = 0; i < spans.length; i++) span(spans[i][0], spans[i][1], spans[i][2], color);
    }

    /* 1px shadow silhouette for every part (drawn first, covered by the fills). */
    outline(TAIL, palette.shadow);
    outline(DORSAL, palette.shadow);
    outline(LOWER, palette.shadow);
    outline(BODY, palette.shadow);

    /* Solid layered body, forked tail, dorsal fin and lower fin. */
    solid(TAIL, palette.body);
    solid(DORSAL, palette.body);
    solid(LOWER, palette.body);
    solid(BODY, palette.body);

    /* Top sheen. */
    rect(14, 5, 8, 1, palette.accent);
    rect(11, 6, 4, 1, palette.accent);

    /* Three diagonal scale / stripe accents. */
    rect(12, 7, 2, 1, palette.accent);
    rect(13, 8, 2, 1, palette.accent);
    rect(14, 9, 2, 1, palette.accent);
    rect(17, 7, 2, 1, palette.accent);
    rect(18, 8, 2, 1, palette.accent);
    rect(19, 9, 2, 1, palette.accent);
    rect(20, 10, 2, 1, palette.accent);
    rect(19, 11, 2, 1, palette.accent);
    rect(18, 12, 2, 1, palette.accent);

    /* Belly highlight. */
    rect(11, 13, 14, 1, palette.accent);
    rect(14, 14, 9, 1, palette.accent);
    rect(16, 15, 5, 1, palette.accent);

    /* Fin and tail glints. */
    rect(18, 3, 2, 1, palette.accent);
    rect(17, 16, 2, 1, palette.accent);
    rect(3, 6, 2, 1, palette.accent);
    rect(3, 13, 2, 1, palette.accent);

    /* Curved gill line. */
    rect(22, 8, 1, 3, palette.shadow);
    rect(21, 11, 1, 3, palette.shadow);

    /* Eye: dark socket, dark pixel, white highlight. */
    rect(24, 6, 3, 3, palette.shadow);
    rect(25, 7, 2, 2, EYE);
    rect(26, 7, 1, 1, WHITE);

    var chunks = Object.keys(groups).map(function (color) {
      return "  <g fill=\"" + color + "\">\n" + groups[color].join("\n") + "\n  </g>";
    });

    var style = opts && opts.face === -1 ? " style=\"transform:scaleX(-1)\"" : "";
    var defs = "";
    if (rainbow) {
      var stops = RAINBOW_STOPS.map(function (s) {
        return '<stop offset="' + s[0] + '%" stop-color="' + s[1] + '"/>';
      }).join("");
      defs = '  <defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="0">' +
        stops + '</linearGradient></defs>\n';
    }
    return "<svg class=\"pixel-fish\" viewBox=\"0 0 32 20\" shape-rendering=\"crispEdges\" aria-hidden=\"true\"" + style + ">\n" +
      defs + chunks.join("\n") + "\n</svg>";
  };
})();
