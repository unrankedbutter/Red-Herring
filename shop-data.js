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
        swatch: ["#ff5577", "#a32252", "#ffe08a"]
      },
      {
        id: "neon",
        type: "skin",
        name: "Neon",
        desc: "Electric blue glow.",
        price: 320,
        swatch: ["#35f0ff", "#ff3df2", "#e7ffff"]
      },
      {
        id: "matrix",
        type: "skin",
        name: "Matrix",
        desc: "Green code rain.",
        price: 380,
        swatch: ["#39ff6a", "#04140b", "#b9ffcf"]
      },
      {
        id: "ocean",
        type: "skin",
        name: "Ocean",
        desc: "Cool deep-sea blues.",
        price: 440,
        swatch: ["#35f0ff", "#0b5f8a", "#e7ffff"]
      },
      {
        id: "ember",
        type: "skin",
        name: "Ember",
        desc: "Blazing orange and charred black.",
        price: 520,
        swatch: ["#ff6b1a", "#2b0b00", "#fff3c4"]
      },
      {
        id: "royal",
        type: "skin",
        name: "Royal",
        desc: "Purple with a gold crown.",
        price: 700,
        swatch: ["#7b4dff", "#2b0b5a", "#ffd166"]
      },
      {
        id: "slate",
        type: "skin",
        name: "Slate",
        desc: "Brushed steel and cold light.",
        price: 780,
        swatch: ["#9fb3c8", "#1a222b", "#ffffff"]
      },
      {
        id: "honey",
        type: "skin",
        name: "Honey",
        desc: "Amber comb and warm gold.",
        price: 860,
        swatch: ["#ffb000", "#5a3000", "#fff3c4"]
      },
      {
        id: "violet",
        type: "skin",
        name: "Violet",
        desc: "Deep violet with lilac shine.",
        price: 980,
        swatch: ["#b06cff", "#2b0b5a", "#f4d7ff"]
      },
      {
        id: "chrome",
        type: "skin",
        name: "Chrome",
        desc: "Mirror steel with a cold blue flash.",
        price: 1100,
        swatch: ["#d9f2ff", "#24384a", "#ffffff"]
      },
      {
        id: "copper",
        type: "skin",
        name: "Copper",
        desc: "Warm copper plates and dark patina.",
        price: 1240,
        swatch: ["#ff9d5c", "#4a1d0b", "#ffe3bd"]
      },
      {
        id: "frostbite",
        type: "skin",
        name: "Frostbite",
        desc: "Frosted glass and icy blue.",
        price: 1400,
        event: true,
        swatch: ["#bfefff", "#2b6f9e", "#ffffff"]
      },
      {
        id: "holly",
        type: "skin",
        name: "Holly",
        desc: "Holly green with ruby berries.",
        price: 1500,
        event: true,
        swatch: ["#1f9d55", "#0a2a16", "#ff5577"]
      },
      {
        id: "ginger",
        type: "skin",
        name: "Gingerbread",
        desc: "Spiced brown with white icing.",
        price: 1600,
        event: true,
        swatch: ["#b9682e", "#3a1808", "#fff3d6"]
      },

      {
        id: "classic-theme",
        type: "theme",
        name: "Classic",
        desc: "Bright plain red, white and black.",
        price: 0,
        swatch: ["#ff5577", "#a32252", "#ffffff"]
      },
      {
        id: "midnight",
        type: "theme",
        name: "Midnight",
        desc: "Dark sky, bright stars.",
        price: 280,
        swatch: ["#0b0f14", "#1b2a4a", "#8fa9ff"]
      },
      {
        id: "retro",
        type: "theme",
        name: "Retro",
        desc: "Old-school arcade glow.",
        price: 340,
        swatch: ["#ffb000", "#7b2f00", "#35f0ff"]
      },
      {
        id: "arctic",
        type: "theme",
        name: "Arctic",
        desc: "Frost and frozen light.",
        price: 420,
        swatch: ["#dff6ff", "#6cc6e8", "#0b5f8a"]
      },
      {
        id: "toxic",
        type: "theme",
        name: "Toxic",
        desc: "Radioactive sludge vibes.",
        price: 500,
        swatch: ["#9dff00", "#2b4d00", "#e7ffb3"]
      },
      {
        id: "candy",
        type: "theme",
        name: "Candy",
        desc: "Sweet pastel overload.",
        price: 600,
        swatch: ["#ff7ad9", "#7b1e6b", "#fff3c4"]
      },
      {
        id: "crimson",
        type: "theme",
        name: "Crimson",
        desc: "Dark wine and hot magenta.",
        price: 720,
        swatch: ["#ff1f8f", "#4d0033", "#ffb3e6"]
      },
      {
        id: "lagoon",
        type: "theme",
        name: "Lagoon",
        desc: "Tropical teal water.",
        price: 840,
        swatch: ["#35f0d0", "#0b5f6e", "#d9fff8"]
      },
      {
        id: "eclipse",
        type: "theme",
        name: "Eclipse",
        desc: "Violet shadow, acid green rim.",
        price: 960,
        swatch: ["#b06cff", "#120a24", "#39ff6a"]
      },
      {
        id: "aurora",
        type: "theme",
        name: "Aurora",
        desc: "Northern lights over deep navy.",
        price: 1080,
        swatch: ["#7cffd4", "#3d2b8f", "#d6b3ff"]
      },
      {
        id: "sunburst",
        type: "theme",
        name: "Sunburst",
        desc: "Golden rays over burnt orange.",
        price: 1180,
        swatch: ["#ffd45e", "#7a2400", "#fff3c4"]
      },
      {
        id: "frostlit",
        type: "theme",
        name: "Frostlit",
        desc: "Blue-white winter glow.",
        price: 1700,
        event: true,
        swatch: ["#bfefff", "#2b6f9e", "#ffffff"]
      },
      {
        id: "evergreen",
        type: "theme",
        name: "Evergreen",
        desc: "Deep green, gold and berry red.",
        price: 1800,
        event: true,
        swatch: ["#39d98a", "#0a2a16", "#ff5577"]
      },
      {
        id: "gingerbread",
        type: "theme",
        name: "Gingerbread",
        desc: "Warm spice, cream icing, candy red.",
        price: 1900,
        event: true,
        swatch: ["#d98a45", "#4a1c0a", "#fff3d6"]
      },

      {
        id: "solid",
        type: "pattern",
        name: "Solid",
        desc: "Clean flat back. Let the color shine.",
        price: 0,
        swatch: ["#ffffff", "#0b0509", "#ffffff"]
      },
      {
        id: "checker",
        type: "pattern",
        name: "Checker",
        desc: "Crisp checkerboard with a soft sheen.",
        price: 240,
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "stripes",
        type: "pattern",
        name: "Stripes",
        desc: "Layered diagonal ribbons.",
        price: 360,
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "dots",
        type: "pattern",
        name: "Dots",
        desc: "Big glowing polka dots and tiny sparkles.",
        price: 480,
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "grid",
        type: "pattern",
        name: "Grid",
        desc: "Crisp neon graph lines. No dots, no confusion.",
        price: 620,
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "waves",
        type: "pattern",
        name: "Waves",
        desc: "Rolling ripple waves up the card.",
        price: 760,
        swatch: ["#ff3d6e", "#0b0509", "#ffffff"]
      },
      {
        id: "gradient",
        type: "pattern",
        name: "Gradient",
        desc: "Smooth neon sweep.",
        price: 900,
        swatch: ["#ff5577", "#ffffff", "#8a2be2"]
      },
      {
        id: "snowflakes",
        type: "pattern",
        name: "Snowflakes",
        desc: "Falling pixel snowflakes.",
        price: 1300,
        event: true,
        swatch: ["#dff6ff", "#0b2740", "#ffffff"]
      },
      {
        id: "candywrap",
        type: "pattern",
        name: "Candy Wrap",
        desc: "Red and white candy stripes.",
        price: 1400,
        event: true,
        swatch: ["#ff5577", "#7a0018", "#ffffff"]
      },
      {
        id: "fairylights",
        type: "pattern",
        name: "Fairy Lights",
        desc: "Twinkling strings of warm light.",
        price: 1500,
        event: true,
        swatch: ["#ffd166", "#123d20", "#ff5577"]
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
