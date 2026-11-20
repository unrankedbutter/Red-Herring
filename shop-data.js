/*
 * RED HERRING — shop catalog and avatar presets.
 * Exposes window.RedHerringShopData = { items, presets }.
 */
(function () {
  "use strict";

  window.RedHerringShopData = {
    items: [
      {
        id: "classic",
        type: "skin",
        name: "Classic",
        desc: "The original red herring.",
        price: 0,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="currentColor"/><rect x="3" y="3" width="10" height="10" fill="#0b0509"/><rect x="4" y="5" width="8" height="2" fill="currentColor"/><rect x="4" y="9" width="8" height="2" fill="currentColor"/></svg>',
        swatch: ["#ff5577", "#a32252", "#ffe08a"]
      },
      {
        id: "neon",
        type: "skin",
        name: "Neon",
        desc: "Electric blue glow.",
        price: 320,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="1" width="4" height="2" fill="currentColor"/><rect x="4" y="3" width="8" height="2" fill="currentColor"/><rect x="2" y="5" width="12" height="4" fill="currentColor"/><rect x="4" y="9" width="8" height="2" fill="currentColor"/><rect x="6" y="11" width="4" height="2" fill="currentColor"/><rect x="7" y="5" width="2" height="4" fill="#05030c"/></svg>',
        swatch: ["#35f0ff", "#ff3df2", "#e7ffff"]
      },
      {
        id: "matrix",
        type: "skin",
        name: "Matrix",
        desc: "Green code rain.",
        price: 380,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="currentColor"/><rect x="3" y="3" width="10" height="10" fill="#04140b"/><rect x="4" y="4" width="2" height="2" fill="currentColor"/><rect x="7" y="4" width="2" height="2" fill="currentColor"/><rect x="10" y="4" width="2" height="2" fill="currentColor"/><rect x="4" y="7" width="2" height="2" fill="currentColor"/><rect x="10" y="7" width="2" height="2" fill="currentColor"/><rect x="4" y="10" width="8" height="2" fill="currentColor"/></svg>',
        swatch: ["#39ff6a", "#04140b", "#b9ffcf"]
      },
      {
        id: "ocean",
        type: "skin",
        name: "Ocean",
        desc: "Cool deep-sea blues.",
        price: 440,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="5" width="7" height="6" fill="currentColor"/><rect x="2" y="4" width="2" height="2" fill="currentColor"/><rect x="1" y="6" width="3" height="4" fill="currentColor"/><rect x="2" y="10" width="2" height="2" fill="currentColor"/><rect x="4" y="12" width="8" height="1" fill="currentColor"/><rect x="6" y="14" width="8" height="1" fill="currentColor"/><rect x="9" y="7" width="1" height="1" fill="#05030c"/></svg>',
        swatch: ["#35f0ff", "#0b5f8a", "#e7ffff"]
      },
      {
        id: "ember",
        type: "skin",
        name: "Ember",
        desc: "Blazing orange and charred black.",
        price: 520,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="4" width="6" height="8" fill="currentColor"/><rect x="11" y="3" width="2" height="2" fill="currentColor"/><rect x="11" y="11" width="2" height="2" fill="currentColor"/><rect x="2" y="3" width="3" height="2" fill="currentColor"/><rect x="1" y="6" width="4" height="4" fill="currentColor"/><rect x="2" y="11" width="3" height="2" fill="currentColor"/><rect x="9" y="6" width="1" height="1" fill="#2b0b00"/></svg>',
        swatch: ["#ff6b1a", "#2b0b00", "#fff3c4"]
      },
      {
        id: "royal",
        type: "skin",
        name: "Royal",
        desc: "Purple with a gold crown.",
        price: 700,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="1" width="6" height="2" fill="currentColor"/><rect x="3" y="3" width="10" height="2" fill="currentColor"/><rect x="2" y="5" width="12" height="6" fill="currentColor"/><rect x="4" y="11" width="8" height="2" fill="currentColor"/><rect x="6" y="13" width="4" height="2" fill="currentColor"/><rect x="5" y="5" width="2" height="6" fill="#2b0b5a"/><rect x="9" y="5" width="2" height="6" fill="#2b0b5a"/></svg>',
        swatch: ["#7b4dff", "#2b0b5a", "#ffd166"]
      },
      {
        id: "slate",
        type: "skin",
        name: "Slate",
        desc: "Brushed steel and cold light.",
        price: 780,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="2" width="10" height="10" fill="currentColor"/><rect x="4" y="3" width="8" height="8" fill="#1a222b"/><rect x="5" y="5" width="6" height="2" fill="currentColor"/><rect x="5" y="9" width="6" height="2" fill="currentColor"/><rect x="7" y="12" width="2" height="3" fill="currentColor"/></svg>',
        swatch: ["#9fb3c8", "#1a222b", "#ffffff"]
      },
      {
        id: "honey",
        type: "skin",
        name: "Honey",
        desc: "Amber comb and warm gold.",
        price: 860,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="5" height="5" fill="currentColor"/><rect x="9" y="2" width="5" height="5" fill="currentColor"/><rect x="2" y="9" width="5" height="5" fill="currentColor"/><rect x="9" y="9" width="5" height="5" fill="currentColor"/><rect x="4" y="4" width="1" height="1" fill="#5a3000"/><rect x="11" y="4" width="1" height="1" fill="#5a3000"/><rect x="4" y="11" width="1" height="1" fill="#5a3000"/><rect x="11" y="11" width="1" height="1" fill="#5a3000"/></svg>',
        swatch: ["#ffb000", "#5a3000", "#fff3c4"]
      },
      {
        id: "violet",
        type: "skin",
        name: "Violet",
        desc: "Deep violet with lilac shine.",
        price: 980,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="2" width="6" height="12" fill="currentColor"/><rect x="3" y="4" width="10" height="8" fill="currentColor"/><rect x="4" y="5" width="8" height="6" fill="#2b0b5a"/><rect x="6" y="7" width="4" height="2" fill="currentColor"/></svg>',
        swatch: ["#b06cff", "#2b0b5a", "#f4d7ff"]
      },

      {
        id: "classic-theme",
        type: "theme",
        name: "Classic",
        desc: "Bright plain red, white and black.",
        price: 0,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="5" width="6" height="6" fill="currentColor"/><rect x="7" y="1" width="2" height="3" fill="currentColor"/><rect x="7" y="12" width="2" height="3" fill="currentColor"/><rect x="1" y="7" width="3" height="2" fill="currentColor"/><rect x="12" y="7" width="3" height="2" fill="currentColor"/><rect x="3" y="2" width="2" height="2" fill="currentColor"/><rect x="11" y="2" width="2" height="2" fill="currentColor"/><rect x="3" y="12" width="2" height="2" fill="currentColor"/><rect x="11" y="12" width="2" height="2" fill="currentColor"/></svg>',
        swatch: ["#ff5577", "#a32252", "#ffffff"]
      },
      {
        id: "midnight",
        type: "theme",
        name: "Midnight",
        desc: "Dark sky, bright stars.",
        price: 280,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="2" width="6" height="2" fill="currentColor"/><rect x="2" y="4" width="8" height="2" fill="currentColor"/><rect x="1" y="6" width="9" height="4" fill="currentColor"/><rect x="2" y="10" width="8" height="2" fill="currentColor"/><rect x="4" y="12" width="6" height="2" fill="currentColor"/><rect x="11" y="2" width="2" height="2" fill="currentColor"/><rect x="13" y="11" width="2" height="2" fill="currentColor"/></svg>',
        swatch: ["#0b0f14", "#1b2a4a", "#8fa9ff"]
      },
      {
        id: "retro",
        type: "theme",
        name: "Retro",
        desc: "Old-school arcade glow.",
        price: 340,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="1" width="4" height="3" fill="currentColor"/><rect x="6" y="12" width="4" height="3" fill="currentColor"/><rect x="1" y="6" width="3" height="4" fill="currentColor"/><rect x="12" y="6" width="3" height="4" fill="currentColor"/><rect x="3" y="3" width="10" height="10" fill="currentColor"/><rect x="6" y="6" width="4" height="4" fill="#7b2f00"/></svg>',
        swatch: ["#ffb000", "#7b2f00", "#35f0ff"]
      },
      {
        id: "arctic",
        type: "theme",
        name: "Arctic",
        desc: "Frost and frozen light.",
        price: 420,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="14" fill="currentColor"/><rect x="1" y="7" width="14" height="2" fill="currentColor"/><rect x="3" y="3" width="2" height="2" fill="currentColor"/><rect x="11" y="3" width="2" height="2" fill="currentColor"/><rect x="3" y="11" width="2" height="2" fill="currentColor"/><rect x="11" y="11" width="2" height="2" fill="currentColor"/><rect x="6" y="6" width="4" height="4" fill="#0b5f8a"/></svg>',
        swatch: ["#dff6ff", "#6cc6e8", "#0b5f8a"]
      },
      {
        id: "toxic",
        type: "theme",
        name: "Toxic",
        desc: "Radioactive sludge vibes.",
        price: 500,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="3" fill="currentColor"/><rect x="5" y="4" width="6" height="2" fill="currentColor"/><rect x="4" y="6" width="8" height="4" fill="currentColor"/><rect x="5" y="10" width="6" height="2" fill="currentColor"/><rect x="6" y="12" width="4" height="2" fill="currentColor"/><rect x="2" y="10" width="2" height="2" fill="currentColor"/><rect x="12" y="8" width="2" height="2" fill="currentColor"/><rect x="7" y="6" width="2" height="2" fill="#2b4d00"/></svg>',
        swatch: ["#9dff00", "#2b4d00", "#e7ffb3"]
      },
      {
        id: "candy",
        type: "theme",
        name: "Candy",
        desc: "Sweet pastel overload.",
        price: 600,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="5" width="8" height="6" fill="currentColor"/><rect x="2" y="6" width="2" height="4" fill="currentColor"/><rect x="12" y="6" width="2" height="4" fill="currentColor"/><rect x="6" y="5" width="2" height="6" fill="#7b1e6b"/><rect x="10" y="5" width="2" height="6" fill="#7b1e6b"/></svg>',
        swatch: ["#ff7ad9", "#7b1e6b", "#fff3c4"]
      },
      {
        id: "crimson",
        type: "theme",
        name: "Crimson",
        desc: "Dark wine and hot magenta.",
        price: 720,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="2" width="10" height="12" fill="currentColor"/><rect x="4" y="3" width="8" height="10" fill="#4d0033"/><rect x="6" y="5" width="4" height="6" fill="currentColor"/><rect x="7" y="7" width="2" height="2" fill="#4d0033"/></svg>',
        swatch: ["#ff1f8f", "#4d0033", "#ffb3e6"]
      },
      {
        id: "lagoon",
        type: "theme",
        name: "Lagoon",
        desc: "Tropical teal water.",
        price: 840,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="6" width="12" height="7" fill="currentColor"/><rect x="4" y="3" width="2" height="4" fill="currentColor"/><rect x="10" y="3" width="2" height="4" fill="currentColor"/><rect x="3" y="10" width="10" height="2" fill="#0b5f6e"/></svg>',
        swatch: ["#35f0d0", "#0b5f6e", "#d9fff8"]
      },
      {
        id: "eclipse",
        type: "theme",
        name: "Eclipse",
        desc: "Violet shadow, acid green rim.",
        price: 960,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="4" width="8" height="8" fill="currentColor"/><rect x="5" y="5" width="6" height="6" fill="#120a24"/><rect x="7" y="1" width="2" height="2" fill="currentColor"/><rect x="7" y="13" width="2" height="2" fill="currentColor"/></svg>',
        swatch: ["#b06cff", "#120a24", "#39ff6a"]
      },

      {
        id: "solid",
        type: "pattern",
        name: "Solid",
        desc: "Clean flat back. Let the skin shine.",
        price: 0,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="currentColor"/></svg>',
        swatch: ["#ffffff", "#0b0509", "#ffffff"]
      },
      {
        id: "checker",
        type: "pattern",
        name: "Checker",
        desc: "Crisp checkerboard with a soft sheen.",
        price: 240,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="6" height="6" fill="currentColor"/><rect x="8" y="8" width="6" height="6" fill="currentColor"/><rect x="8" y="2" width="6" height="6" fill="#0b0509"/><rect x="2" y="8" width="6" height="6" fill="#0b0509"/></svg>',
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "stripes",
        type: "pattern",
        name: "Stripes",
        desc: "Layered diagonal ribbons.",
        price: 360,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="3" height="12" fill="currentColor" transform="rotate(20 3 8)"/><rect x="7" y="2" width="3" height="12" fill="currentColor" transform="rotate(20 8 8)"/><rect x="12" y="2" width="3" height="12" fill="currentColor" transform="rotate(20 13 8)"/></svg>',
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "dots",
        type: "pattern",
        name: "Dots",
        desc: "Glowing pixel constellations.",
        price: 480,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="3" width="3" height="3" fill="currentColor"/><rect x="10" y="3" width="3" height="3" fill="currentColor"/><rect x="3" y="10" width="3" height="3" fill="currentColor"/><rect x="10" y="10" width="3" height="3" fill="currentColor"/></svg>',
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "grid",
        type: "pattern",
        name: "Grid",
        desc: "Neon graph paper with a glow.",
        price: 620,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="12" height="2" fill="currentColor"/><rect x="2" y="7" width="12" height="2" fill="currentColor"/><rect x="2" y="12" width="12" height="2" fill="currentColor"/><rect x="2" y="2" width="2" height="12" fill="currentColor"/><rect x="7" y="2" width="2" height="12" fill="currentColor"/><rect x="12" y="2" width="2" height="12" fill="currentColor"/></svg>',
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "waves",
        type: "pattern",
        name: "Waves",
        desc: "Stacked ripple bands.",
        price: 760,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="5" width="4" height="2" fill="currentColor"/><rect x="6" y="7" width="4" height="2" fill="currentColor"/><rect x="10" y="5" width="4" height="2" fill="currentColor"/><rect x="2" y="11" width="4" height="2" fill="currentColor"/><rect x="6" y="13" width="4" height="2" fill="currentColor"/><rect x="10" y="11" width="4" height="2" fill="currentColor"/></svg>',
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "gradient",
        type: "pattern",
        name: "Gradient",
        desc: "Smooth neon sweep.",
        price: 900,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><defs><linearGradient id="rh-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5577"/><stop offset="0.5" stop-color="#ffffff"/><stop offset="1" stop-color="#8a2be2"/></linearGradient></defs><rect x="2" y="2" width="12" height="12" fill="url(#rh-grad)"/></svg>',
        swatch: ["#ff5577", "#ffffff", "#8a2be2"]
      }
    ],

    presets: [
      {
        id: "fish",
        name: "Fish",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="3" width="7" height="10" fill="#35f0ff"/><rect x="2" y="5" width="3" height="6" fill="#0b5f8a"/><rect x="9" y="5" width="2" height="2" fill="#0b0f14"/><rect x="10" y="5" width="1" height="1" fill="#ffffff"/><rect x="6" y="11" width="5" height="1" fill="#e7ffff"/></svg>'
      },
      {
        id: "cat",
        name: "Cat",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="2" width="3" height="4" fill="#ffd166"/><rect x="10" y="2" width="3" height="4" fill="#ffd166"/><rect x="3" y="5" width="10" height="8" fill="#ffd166"/><rect x="5" y="7" width="2" height="2" fill="#0b0f14"/><rect x="9" y="7" width="2" height="2" fill="#0b0f14"/><rect x="7" y="10" width="2" height="1" fill="#7b0e3d"/></svg>'
      },
      {
        id: "ghost",
        name: "Ghost",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="2" width="8" height="9" fill="#e7ffff"/><rect x="4" y="11" width="2" height="3" fill="#e7ffff"/><rect x="7" y="11" width="2" height="3" fill="#e7ffff"/><rect x="10" y="11" width="2" height="3" fill="#e7ffff"/><rect x="6" y="6" width="2" height="2" fill="#0b0f14"/><rect x="9" y="6" width="2" height="2" fill="#0b0f14"/><rect x="7" y="9" width="2" height="1" fill="#0b0f14"/></svg>'
      },
      {
        id: "robot",
        name: "Robot",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="2" fill="#ff5c4d"/><rect x="3" y="3" width="10" height="10" fill="#9fb3c8"/><rect x="4" y="5" width="8" height="4" fill="#0b0f14"/><rect x="5" y="6" width="2" height="2" fill="#35f0ff"/><rect x="9" y="6" width="2" height="2" fill="#35f0ff"/><rect x="6" y="11" width="4" height="1" fill="#0b0f14"/></svg>'
      },
      {
        id: "skull",
        name: "Skull",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="2" width="8" height="8" fill="#f5f0e6"/><rect x="5" y="10" width="6" height="4" fill="#f5f0e6"/><rect x="5" y="5" width="3" height="3" fill="#0b0f14"/><rect x="9" y="5" width="3" height="3" fill="#0b0f14"/><rect x="7" y="9" width="2" height="2" fill="#0b0f14"/><rect x="6" y="12" width="1" height="2" fill="#0b0f14"/><rect x="9" y="12" width="1" height="2" fill="#0b0f14"/></svg>'
      },
      {
        id: "star",
        name: "Star",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="3" fill="#ffd166"/><rect x="6" y="4" width="4" height="8" fill="#ffd166"/><rect x="2" y="6" width="12" height="3" fill="#ffd166"/><rect x="4" y="12" width="3" height="3" fill="#ffd166"/><rect x="9" y="12" width="3" height="3" fill="#ffd166"/><rect x="7" y="5" width="2" height="2" fill="#0b0f14"/><rect x="7" y="10" width="2" height="2" fill="#0b0f14"/></svg>'
      },
      {
        id: "alien",
        name: "Alien",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="1" width="8" height="3" fill="#9dff00"/><rect x="2" y="4" width="12" height="8" fill="#9dff00"/><rect x="4" y="6" width="4" height="3" fill="#0b0f14"/><rect x="9" y="6" width="4" height="3" fill="#0b0f14"/><rect x="7" y="11" width="2" height="1" fill="#0b0f14"/></svg>'
      },
      {
        id: "crown",
        name: "Crown",
        svg: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="4" width="3" height="4" fill="#ffd166"/><rect x="7" y="2" width="3" height="6" fill="#ffd166"/><rect x="12" y="4" width="3" height="4" fill="#ffd166"/><rect x="2" y="9" width="13" height="4" fill="#ffd166"/><rect x="4" y="6" width="2" height="2" fill="#ff5c4d"/><rect x="8" y="4" width="2" height="2" fill="#ff5c4d"/><rect x="12" y="6" width="2" height="2" fill="#ff5c4d"/></svg>'
      }
    ]
  };
})();
