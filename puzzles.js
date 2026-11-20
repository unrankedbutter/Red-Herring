/*
 * Red Herring — puzzle catalog.
 *
 * Each answer has 6 TRUE clues and 4 HERRINGS (fallback false clues).
 * Every day the engine picks 5 of the 6 true clues and borrows 3 herrings from
 * TRUE clues belonging to other answers, then shuffles all 8 into a deck.
 * About 25% of rounds use one other question for all three herrings.
 *
 * RULES FOR WRITING CLUES:
 *  - True clues must be unambiguously true of the answer.
 *  - Herrings must be TRUE of a believable WRONG answer, so they feel real.
 *  - Never put the answer (or an obvious giveaway) in the clue text.
 *  - Append new entries only. Never reorder or edit existing entries —
 *    that would change old daily puzzles and break streaks.
 */
(function (root) {
  const PUZZLE_VERSION = 2;

  const CATALOG = [
    {
      answer: "Moth",
      clues: [
        { text: "I am drawn to a bright light after dark.", true: true },
        { text: "My wings often look dusty and pale.", true: true },
        { text: "I am the reason a wool sweater can get holes.", true: true },
        { text: "I usually rest with my wings spread flat.", true: true },
        { text: "My antennae look like little feathery combs.", true: true },
        { text: "Most of my kind are active after dusk.", true: true },
        { text: "I bask with my wings open in the midday sun.", true: false },
        { text: "My antennae end in tiny clubs.", true: false },
        { text: "I sip nectar through a coiled tongue.", true: false },
        { text: "I fold my wings upright together when I settle.", true: false }
      ]
    },
    {
      answer: "Compass",
      clues: [
        { text: "I always try to point north.", true: true },
        { text: "A small needle inside me pivots freely.", true: true },
        { text: "I am marked with four cardinal directions.", true: true },
        { text: "A lump of nearby iron can spoil my reading.", true: true },
        { text: "Sailors and hikers have carried me for centuries.", true: true },
        { text: "I work perfectly well without batteries.", true: true },
        { text: "My hands sweep around a face numbered one to twelve.", true: false },
        { text: "I must be wound up or plugged in to keep going.", true: false },
        { text: "I tell you how many hours have passed.", true: false },
        { text: "I have a second hand that ticks each second.", true: false }
      ]
    },
    {
      answer: "Kite",
      clues: [
        { text: "I need wind to get off the ground.", true: true },
        { text: "A long line keeps me from drifting away.", true: true },
        { text: "My frame is light, often wood or plastic.", true: true },
        { text: "A tail can be added to steady me.", true: true },
        { text: "Children run along a beach to launch me.", true: true },
        { text: "I am often diamond or delta shaped.", true: true },
        { text: "My job is to slow a falling person down.", true: false },
        { text: "I am tightly packed into a pack before use.", true: false },
        { text: "When open, I form a curved dome above you.", true: false },
        { text: "I am used to drop supplies from an aircraft.", true: false }
      ]
    },
    {
      answer: "Lighthouse",
      clues: [
        { text: "I warn ships away from a rocky coast.", true: true },
        { text: "My light can be seen for many miles out at sea.", true: true },
        { text: "A keeper used to live inside me.", true: true },
        { text: "I stand on a cliff, an island, or a breakwater.", true: true },
        { text: "My beam sweeps around so that it appears to flash.", true: true },
        { text: "I am often painted in bold bands of colour.", true: true },
        { text: "My blades turn to grind grain into flour.", true: false },
        { text: "I stand in the middle of a field of wheat.", true: false },
        { text: "The wind is what makes me useful.", true: false },
        { text: "My long arms are covered in canvas sails.", true: false }
      ]
    },
    {
      answer: "Piano",
      clues: [
        { text: "I have eighty-eight keys.", true: true },
        { text: "Felt-covered hammers strike strings inside me.", true: true },
        { text: "A foot pedal can make my notes ring on.", true: true },
        { text: "A skilled player uses both hands at once.", true: true },
        { text: "My black keys come in groups of two and three.", true: true },
        { text: "I need tuning about twice a year.", true: true },
        { text: "My sound is made by air pushed through pipes.", true: false },
        { text: "I am plucked directly with the fingertips.", true: false },
        { text: "My strings are all open and visible to the player.", true: false },
        { text: "I have a curved neck that rises above the strings.", true: false }
      ]
    },
    {
      answer: "Bee",
      clues: [
        { text: "I perform a dance to show my hive where flowers are.", true: true },
        { text: "I make wax and build cells with six sides.", true: true },
        { text: "After I sting, I die.", true: true },
        { text: "I carry pollen back on my hind legs.", true: true },
        { text: "Only the females among us can sting.", true: true },
        { text: "I live in a colony ruled by a queen.", true: true },
        { text: "I can sting again and again without dying.", true: false },
        { text: "My nest is built from chewed-up wood pulp.", true: false },
        { text: "I hunt other insects to feed my young.", true: false },
        { text: "My body is smooth and almost hairless.", true: false }
      ]
    },
    {
      answer: "Umbrella",
      clues: [
        { text: "I keep the rain off your head.", true: true },
        { text: "A spring mechanism pushes me open.", true: true },
        { text: "Fabric is stretched over a ring of ribs.", true: true },
        { text: "A sudden gust can turn me inside out.", true: true },
        { text: "You grip me by a handle underneath.", true: true },
        { text: "I fold down into a long, slim shape.", true: true },
        { text: "I am worn instead of held.", true: false },
        { text: "I have sleeves and a row of buttons.", true: false },
        { text: "I keep your clothes dry but leave your head bare.", true: false },
        { text: "I squash down small enough to fit in my own pocket.", true: false }
      ]
    },
    {
      answer: "Mirror",
      clues: [
        { text: "I show you your own reflection.", true: true },
        { text: "My back is coated in silver or aluminium.", true: true },
        { text: "My image swaps left and right.", true: true },
        { text: "I remember nothing of what I show.", true: true },
        { text: "I often hang above a bathroom sink.", true: true },
        { text: "Angled correctly, I can focus sunlight into heat.", true: true },
        { text: "Light passes straight through me to the far side.", true: false },
        { text: "You can watch the street through me.", true: false },
        { text: "I am set into a wall or a door frame.", true: false },
        { text: "I keep the cold out while letting the light in.", true: false }
      ]
    },
    {
      answer: "Camera",
      clues: [
        { text: "I focus light onto film or a sensor.", true: true },
        { text: "A shutter opens for a fraction of a second.", true: true },
        { text: "My lens has an aperture you can change.", true: true },
        { text: "I can freeze a subject in mid-motion.", true: true },
        { text: "Photographers carry me on a strap.", true: true },
        { text: "My pictures can be saved to a memory card.", true: true },
        { text: "I bring distant stars closer to your eye.", true: false },
        { text: "I am mounted on a tripod and aimed at the sky.", true: false },
        { text: "I have two barrels, one for each eye.", true: false },
        { text: "You look straight through me instead of at a screen.", true: false }
      ]
    },
    {
      answer: "Candle",
      clues: [
        { text: "I am made of wax around a cotton wick.", true: true },
        { text: "I slowly melt as I burn.", true: true },
        { text: "A puff of breath can put me out.", true: true },
        { text: "I give light when the power fails.", true: true },
        { text: "You make a wish before blowing me out on a birthday.", true: true },
        { text: "I leave wax drips down my sides.", true: true },
        { text: "I run on batteries or mains electricity.", true: false },
        { text: "I have a glass chimney and a heavy metal base.", true: false },
        { text: "I burn liquid fuel soaked into a wick.", true: false },
        { text: "I can be dimmed with a switch on the wall.", true: false }
      ]
    },
    {
      answer: "Octopus",
      clues: [
        { text: "I have eight arms.", true: true },
        { text: "I can change the colour of my skin in an instant.", true: true },
        { text: "Three hearts pump blood around my body.", true: true },
        { text: "I squirt ink to escape a predator.", true: true },
        { text: "I have no bones at all.", true: true },
        { text: "The suckers on my arms can taste what they touch.", true: true },
        { text: "I have ten arms, two of them much longer.", true: false },
        { text: "My body is torpedo-shaped with fins at the back.", true: false },
        { text: "A hard internal shell called a pen supports me.", true: false },
        { text: "I travel through open water in huge schools.", true: false }
      ]
    },
    {
      answer: "Bicycle",
      clues: [
        { text: "I roll along on two wheels.", true: true },
        { text: "The person riding me provides all the power.", true: true },
        { text: "Pedals turn a chain that drives a rear wheel.", true: true },
        { text: "I can coast for a while without pedalling.", true: true },
        { text: "Hand levers squeeze my brakes.", true: true },
        { text: "I produce no exhaust of any kind.", true: true },
        { text: "An engine burns fuel to make me go.", true: false },
        { text: "I can comfortably exceed a hundred miles an hour.", true: false },
        { text: "I have a loud exhaust pipe along one side.", true: false },
        { text: "You need a driving licence to take me on the road.", true: false }
      ]
    },
    {
      answer: "Book",
      clues: [
        { text: "I am many pages bound together.", true: true },
        { text: "You can read me from cover to cover.", true: true },
        { text: "I hold words but cannot speak them aloud.", true: true },
        { text: "A flat scrap of card can hold my place.", true: true },
        { text: "You can borrow me from a library.", true: true },
        { text: "I have a spine and two covers.", true: true },
        { text: "I am printed on cheap newsprint and thrown away.", true: false },
        { text: "I am read once, then used to wrap fish.", true: false },
        { text: "A date sits in my header and I come out in editions.", true: false },
        { text: "I am delivered to your door early each morning.", true: false }
      ]
    },
    {
      answer: "Raincoat",
      clues: [
        { text: "I keep your clothes dry in a shower.", true: true },
        { text: "My fabric is treated to repel water.", true: true },
        { text: "I often have a hood pulled over your head.", true: true },
        { text: "You wear me over your normal clothes.", true: true },
        { text: "I can be folded into a bag when it is sunny.", true: true },
        { text: "My cuffs and seams are sealed against rain.", true: true },
        { text: "I am held over your head by a handle.", true: false },
        { text: "Ribs stretch fabric into a canopy above me.", true: false },
        { text: "I spring open with the push of a button.", true: false },
        { text: "I am worn mainly to keep the sun off your face.", true: false }
      ]
    },
    {
      answer: "Alarm clock",
      clues: [
        { text: "I wake you up at a time you choose.", true: true },
        { text: "I can buzz or ring when the time comes.", true: true },
        { text: "A snooze button can give you a few more minutes.", true: true },
        { text: "I often sit beside a bed.", true: true },
        { text: "I show the time with hands or digits.", true: true },
        { text: "I keep working when the internet is down.", true: true },
        { text: "I am worn strapped to your wrist.", true: false },
        { text: "I am set by rotating a bezel on my case.", true: false },
        { text: "I need a needle that lines up with magnetic north.", true: false },
        { text: "I am carried in a pocket and checked with a glance.", true: false }
      ]
    },
    {
      answer: "Snail",
      clues: [
        { text: "I carry my home on my back.", true: true },
        { text: "I leave a shiny trail as I crawl.", true: true },
        { text: "I move slowly on a muscular foot.", true: true },
        { text: "Two long stalks carry my eyes.", true: true },
        { text: "I come out more after rain.", true: true },
        { text: "I nibble on leaves and garden plants.", true: true },
        { text: "I can change my colour in an instant.", true: false },
        { text: "Eight arms help me grab what I find.", true: false },
        { text: "I squirt ink when a predator appears.", true: false },
        { text: "I live in a colony ruled by a queen.", true: false }
      ]
    },
    {
      answer: "Kettle",
      clues: [
        { text: "I bring water to a boil.", true: true },
        { text: "A spout lets you pour me safely.", true: true },
        { text: "I have a handle that stays cool enough to hold.", true: true },
        { text: "I may whistle once the water is hot.", true: true },
        { text: "I sit on a stove or plug into a base.", true: true },
        { text: "I am often used to make a cup of tea.", true: true },
        { text: "I drip hot water over ground coffee.", true: false },
        { text: "A paper filter sits in my top section.", true: false },
        { text: "I keep a flask of water cold for hours.", true: false },
        { text: "I toast slices until they turn brown.", true: false }
      ]
    },
    {
      answer: "Broom",
      clues: [
        { text: "I sweep dust and crumbs across a floor.", true: true },
        { text: "Stiff bristles are fixed to my end.", true: true },
        { text: "A long handle lets me reach under furniture.", true: true },
        { text: "I am usually kept in a cupboard or corner.", true: true },
        { text: "A dustpan is often used alongside me.", true: true },
        { text: "I can be leaned upright against a wall.", true: true },
        { text: "A motor pulls dirt into a bag inside me.", true: false },
        { text: "I need a cord or a battery to work.", true: false },
        { text: "I mop the floor with a damp pad.", true: false },
        { text: "I have bristles made for scrubbing your teeth.", true: false }
      ]
    },
    {
      answer: "Snowshoes",
      clues: [
        { text: "I strap onto your boots for winter walks.", true: true },
        { text: "My wide frame spreads your weight over snow.", true: true },
        { text: "I stop you from sinking with every step.", true: true },
        { text: "A mesh or deck sits inside my frame.", true: true },
        { text: "I come as a matching pair.", true: true },
        { text: "I am used on trails after a snowfall.", true: true },
        { text: "Sharp blades on me let you glide on ice.", true: false },
        { text: "I am worn on your hands for warmth.", true: false },
        { text: "Small wheels help me roll along the path.", true: false },
        { text: "I grip rock with ropes and metal clips.", true: false }
      ]
    },
    {
      answer: "Lantern",
      clues: [
        { text: "I am a light you can carry from place to place.", true: true },
        { text: "A glass or plastic window protects my flame or bulb.", true: true },
        { text: "I can run on a candle, oil, or batteries.", true: true },
        { text: "A hook or handle lets me hang from a tent.", true: true },
        { text: "I cast a warm circle of light around camp.", true: true },
        { text: "I still work when the power is out.", true: true },
        { text: "My beam sweeps far out across the sea.", true: false },
        { text: "I warn ships away from a rocky shore.", true: false },
        { text: "A keeper used to live inside me.", true: false },
        { text: "I stand on a cliff or a small island.", true: false }
      ]
    },
    {
      answer: "Paintbrush",
      clues: [
        { text: "Bristles are fixed to the end of my handle.", true: true },
        { text: "I am dipped into paint before each stroke.", true: true },
        { text: "I can be flat, round, or fine-tipped.", true: true },
        { text: "Artists and decorators both use me.", true: true },
        { text: "I come in many sizes for different marks.", true: true },
        { text: "I need cleaning before the paint dries.", true: true },
        { text: "A sharp blade cuts paper along a line.", true: false },
        { text: "A graphite core leaves a grey mark.", true: false },
        { text: "I rub out pencil marks without tearing the page.", true: false },
        { text: "I stick two sheets together when wet.", true: false }
      ]
    },
    {
      answer: "Wallet",
      clues: [
        { text: "I hold your cards and folded notes.", true: true },
        { text: "I fit into a pocket or a handbag.", true: true },
        { text: "I have slots, sleeves, and a coin section.", true: true },
        { text: "Leather and fabric are both used to make me.", true: true },
        { text: "A window in me can show a photo or an ID.", true: true },
        { text: "If I am lost, a finder may return me.", true: true },
        { text: "I am buckled around your wrist.", true: false },
        { text: "I carry a ring of keys.", true: false },
        { text: "I hold your toothbrush when you travel.", true: false },
        { text: "I am used to lock and unlock a door.", true: false }
      ]
    },
    {
      answer: "Ferry",
      clues: [
        { text: "I carry people across a stretch of water.", true: true },
        { text: "My route is usually short and repeated.", true: true },
        { text: "Cars and trucks can drive onto my deck.", true: true },
        { text: "I dock at a terminal at each end.", true: true },
        { text: "I run to a timetable every day.", true: true },
        { text: "Railings line my open decks.", true: true },
        { text: "I fly between cities from a runway.", true: false },
        { text: "I run on rails and stop at stations.", true: false },
        { text: "I travel underground through a tunnel.", true: false },
        { text: "I am steered with a single paddle.", true: false }
      ]
    }
  ];

  const api = { PUZZLE_VERSION, CATALOG };
  root.RedHerringPuzzles = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
