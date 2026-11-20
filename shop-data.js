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
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="currentColor"/><rect x="3" y="3" width="10" height="10" fill="#0b0f14"/><rect x="4" y="5" width="8" height="2" fill="currentColor"/><rect x="4" y="9" width="8" height="2" fill="currentColor"/></svg>',
        swatch: ["#ff5c4d", "#7b0e3d", "#ffd166"]
      },
      {
        id: "neon",
        type: "skin",
        name: "Neon",
        desc: "Electric blue glow.",
        price: 190,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="1" width="4" height="2" fill="currentColor"/><rect x="4" y="3" width="8" height="2" fill="currentColor"/><rect x="2" y="5" width="12" height="4" fill="currentColor"/><rect x="4" y="9" width="8" height="2" fill="currentColor"/><rect x="6" y="11" width="4" height="2" fill="currentColor"/><rect x="7" y="5" width="2" height="4" fill="#0b0f14"/></svg>',
        swatch: ["#35f0ff", "#ff3df2", "#e7ffff"]
      },
      {
        id: "ember",
        type: "skin",
        name: "Ember",
        desc: "Hot coals and fire.",
        price: 280,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="4" width="6" height="8" fill="currentColor"/><rect x="11" y="3" width="2" height="2" fill="currentColor"/><rect x="11" y="11" width="2" height="2" fill="currentColor"/><rect x="2" y="3" width="3" height="2" fill="currentColor"/><rect x="1" y="6" width="4" height="4" fill="currentColor"/><rect x="2" y="11" width="3" height="2" fill="currentColor"/><rect x="9" y="6" width="1" height="1" fill="#0b0f14"/></svg>',
        swatch: ["#ff6b1a", "#7b0e3d", "#ffd166"]
      },
      {
        id: "ocean",
        type: "skin",
        name: "Ocean",
        desc: "Cool deep-sea blues.",
        price: 250,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="5" width="7" height="6" fill="currentColor"/><rect x="2" y="4" width="2" height="2" fill="currentColor"/><rect x="1" y="6" width="3" height="4" fill="currentColor"/><rect x="2" y="10" width="2" height="2" fill="currentColor"/><rect x="4" y="12" width="8" height="1" fill="currentColor"/><rect x="6" y="14" width="8" height="1" fill="currentColor"/><rect x="9" y="7" width="1" height="1" fill="#0b0f14"/></svg>',
        swatch: ["#35f0ff", "#0b5f8a", "#e7ffff"]
      },
      {
        id: "royal",
        type: "skin",
        name: "Royal",
        desc: "Purple with a gold crown.",
        price: 450,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="1" width="6" height="2" fill="currentColor"/><rect x="3" y="3" width="10" height="2" fill="currentColor"/><rect x="2" y="5" width="12" height="6" fill="currentColor"/><rect x="4" y="11" width="8" height="2" fill="currentColor"/><rect x="6" y="13" width="4" height="2" fill="currentColor"/><rect x="5" y="5" width="2" height="6" fill="#0b0f14"/><rect x="9" y="5" width="2" height="6" fill="#0b0f14"/></svg>',
        swatch: ["#7b4dff", "#2b0b5a", "#ffd166"]
      },
      {
        id: "matrix",
        type: "skin",
        name: "Matrix",
        desc: "Green code rain.",
        price: 230,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="currentColor"/><rect x="3" y="3" width="10" height="10" fill="#0b0f14"/><rect x="4" y="4" width="2" height="2" fill="currentColor"/><rect x="7" y="4" width="2" height="2" fill="currentColor"/><rect x="10" y="4" width="2" height="2" fill="currentColor"/><rect x="4" y="7" width="2" height="2" fill="currentColor"/><rect x="10" y="7" width="2" height="2" fill="currentColor"/><rect x="4" y="10" width="8" height="2" fill="currentColor"/></svg>',
        swatch: ["#39ff6a", "#04140b", "#b9ffcf"]
      },
      {
        id: "midnight",
        type: "theme",
        name: "Midnight",
        desc: "Dark sky, bright stars.",
        price: 0,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="2" width="6" height="2" fill="currentColor"/><rect x="2" y="4" width="8" height="2" fill="currentColor"/><rect x="1" y="6" width="9" height="4" fill="currentColor"/><rect x="2" y="10" width="8" height="2" fill="currentColor"/><rect x="4" y="12" width="6" height="2" fill="currentColor"/><rect x="11" y="2" width="2" height="2" fill="currentColor"/><rect x="13" y="11" width="2" height="2" fill="currentColor"/></svg>',
        swatch: ["#0b0f14", "#1b2a4a", "#8fa9ff"]
      },
      {
        id: "sunset",
        type: "theme",
        name: "Sunset",
        desc: "Golden hour forever.",
        price: 150,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="5" width="6" height="6" fill="currentColor"/><rect x="7" y="1" width="2" height="3" fill="currentColor"/><rect x="7" y="12" width="2" height="3" fill="currentColor"/><rect x="1" y="7" width="3" height="2" fill="currentColor"/><rect x="12" y="7" width="3" height="2" fill="currentColor"/><rect x="3" y="2" width="2" height="2" fill="currentColor"/><rect x="11" y="2" width="2" height="2" fill="currentColor"/><rect x="3" y="12" width="2" height="2" fill="currentColor"/><rect x="11" y="12" width="2" height="2" fill="currentColor"/></svg>',
        swatch: ["#ff6b3d", "#7b1e4b", "#ffd166"]
      },
      {
        id: "arctic",
        type: "theme",
        name: "Arctic",
        desc: "Frost and frozen light.",
        price: 200,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="14" fill="currentColor"/><rect x="1" y="7" width="14" height="2" fill="currentColor"/><rect x="3" y="3" width="2" height="2" fill="currentColor"/><rect x="11" y="3" width="2" height="2" fill="currentColor"/><rect x="3" y="11" width="2" height="2" fill="currentColor"/><rect x="11" y="11" width="2" height="2" fill="currentColor"/><rect x="6" y="6" width="4" height="4" fill="#0b0f14"/></svg>',
        swatch: ["#dff6ff", "#6cc6e8", "#0b5f8a"]
      },
      {
        id: "toxic",
        type: "theme",
        name: "Toxic",
        desc: "Radioactive sludge vibes.",
        price: 230,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="1" width="2" height="3" fill="currentColor"/><rect x="5" y="4" width="6" height="2" fill="currentColor"/><rect x="4" y="6" width="8" height="4" fill="currentColor"/><rect x="5" y="10" width="6" height="2" fill="currentColor"/><rect x="6" y="12" width="4" height="2" fill="currentColor"/><rect x="2" y="10" width="2" height="2" fill="currentColor"/><rect x="12" y="8" width="2" height="2" fill="currentColor"/><rect x="7" y="6" width="2" height="2" fill="#0b0f14"/></svg>',
        swatch: ["#9dff00", "#2b4d00", "#e7ffb3"]
      },
      {
        id: "candy",
        type: "theme",
        name: "Candy",
        desc: "Sweet pastel overload.",
        price: 250,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="5" width="8" height="6" fill="currentColor"/><rect x="2" y="6" width="2" height="4" fill="currentColor"/><rect x="12" y="6" width="2" height="4" fill="currentColor"/><rect x="6" y="5" width="2" height="6" fill="#0b0f14"/><rect x="10" y="5" width="2" height="6" fill="#0b0f14"/></svg>',
        swatch: ["#ff7ad9", "#7b1e6b", "#fff3c4"]
      },
      {
        id: "retro",
        type: "theme",
        name: "Retro",
        desc: "Old-school arcade glow.",
        price: 180,
        icon: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="1" width="4" height="3" fill="currentColor"/><rect x="6" y="12" width="4" height="3" fill="currentColor"/><rect x="1" y="6" width="3" height="4" fill="currentColor"/><rect x="12" y="6" width="3" height="4" fill="currentColor"/><rect x="3" y="3" width="10" height="10" fill="currentColor"/><rect x="6" y="6" width="4" height="4" fill="#0b0f14"/></svg>',
        swatch: ["#ffb000", "#7b2f00", "#35f0ff"]
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
