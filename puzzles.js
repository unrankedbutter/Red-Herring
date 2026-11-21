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
    },
    {
      answer: "Toothbrush",
      clues: [
        { text: "I have a head of short, stiff bristles.", true: true },
        { text: "A squeeze of paste goes on me before use.", true: true },
        { text: "I am used to clean teeth twice a day.", true: true },
        { text: "I come in manual and electric versions.", true: true },
        { text: "Dentists suggest replacing me every few months.", true: true },
        { text: "I am kept upright in a cup in the bathroom.", true: true },
        { text: "I have wide bristles set into a flat oval back.", true: false },
        { text: "I am drawn through hair to remove tangles.", true: false },
        { text: "I smooth and style hair after a wash.", true: false },
        { text: "A handle lets me sweep through long hair.", true: false }
      ]
    },
    {
      answer: "Key",
      clues: [
        { text: "I turn inside a lock to open or close it.", true: true },
        { text: "Teeth or notches along my blade match a lock.", true: true },
        { text: "I am often carried on a ring with others.", true: true },
        { text: "A duplicate of me can be cut at a shop.", true: true },
        { text: "I can start a car when turned in the ignition.", true: true },
        { text: "Losing me can leave you locked out of a door.", true: true },
        { text: "I have a face with hands that show the hour.", true: false },
        { text: "I am worn strapped around your wrist.", true: false },
        { text: "A crown at my side is used to wind me up.", true: false },
        { text: "I tick quietly as the seconds go by.", true: false }
      ]
    },
    {
      answer: "Spoon",
      clues: [
        { text: "I have a shallow bowl at the end of my handle.", true: true },
        { text: "I am used to eat soup, cereal, and yoghurt.", true: true },
        { text: "I can stir a drink or a pot on the stove.", true: true },
        { text: "I come in sizes from teaspoon to tablespoon.", true: true },
        { text: "Metal, wood, and plastic are all used to make me.", true: true },
        { text: "I am usually part of a set with a fork and knife.", true: true },
        { text: "I have a sharp edge meant for cutting food.", true: false },
        { text: "I am used to slice bread, vegetables, and meat.", true: false },
        { text: "A blade and a handle make up my whole shape.", true: false },
        { text: "I can spread butter across a piece of toast.", true: false }
      ]
    },
    {
      answer: "Dog",
      clues: [
        { text: "I bark when someone unfamiliar comes near.", true: true },
        { text: "I wag my tail when I am pleased to see you.", true: true },
        { text: "I am taken for walks on a lead every day.", true: true },
        { text: "I can learn tricks such as sitting and fetching.", true: true },
        { text: "My sense of smell is far better than a human's.", true: true },
        { text: "I am often called a loyal companion to people.", true: true },
        { text: "I purr softly when I am content and relaxed.", true: false },
        { text: "I climb trees and perch on high windowsills.", true: false },
        { text: "I hunt small animals like mice and birds.", true: false },
        { text: "I am happy to be left alone for long stretches.", true: false }
      ]
    },
    {
      answer: "Cat",
      clues: [
        { text: "I purr when I am comfortable and content.", true: true },
        { text: "I chase mice and small creatures in the home.", true: true },
        { text: "I can climb trees and squeeze into tight spaces.", true: true },
        { text: "I sleep for many hours during the day.", true: true },
        { text: "My whiskers help me feel my way in the dark.", true: true },
        { text: "I am known for being independent and aloof.", true: true },
        { text: "I wait by the door for my daily walk on a lead.", true: false },
        { text: "I bark loudly when the postman calls.", true: false },
        { text: "I greet visitors with a wagging tail and jumps.", true: false },
        { text: "I am easily trained to obey spoken commands.", true: false }
      ]
    },
    {
      answer: "Horse",
      clues: [
        { text: "I can gallop at great speed across open ground.", true: true },
        { text: "A saddle is strapped onto my back for a rider.", true: true },
        { text: "I eat grass and hay through most of the day.", true: true },
        { text: "Metal shoes are fitted to my hooves for protection.", true: true },
        { text: "I have a long mane that falls over my neck.", true: true },
        { text: "People have ridden me for thousands of years.", true: true },
        { text: "I store fat in humps on my back for lean times.", true: false },
        { text: "I can go for days without drinking water.", true: false },
        { text: "I carry loads across hot sandy deserts.", true: false },
        { text: "My feet are wide and padded for walking on sand.", true: false }
      ]
    },
    {
      answer: "Owl",
      clues: [
        { text: "I am most active after the sun has gone down.", true: true },
        { text: "My large eyes help me see in very dim light.", true: true },
        { text: "I can fly almost silently to surprise my prey.", true: true },
        { text: "I hunt small mice and voles at night.", true: true },
        { text: "I perch on a branch and scan the ground below.", true: true },
        { text: "My calls are a familiar hooting in the dark.", true: true },
        { text: "I soar high above fields watching for prey in daylight.", true: false },
        { text: "I have a hooked beak for tearing at flesh.", true: false },
        { text: "I build a huge nest of sticks on a cliff ledge.", true: false },
        { text: "I am used as a symbol of a nation on its flag.", true: false }
      ]
    },
    {
      answer: "Penguin",
      clues: [
        { text: "I have a black back and a white front.", true: true },
        { text: "I walk with a waddle because my legs are short.", true: true },
        { text: "I cannot fly, but I am an excellent swimmer.", true: true },
        { text: "I live in huge colonies in cold southern lands.", true: true },
        { text: "I eat fish and krill caught in the sea.", true: true },
        { text: "A layer of fat keeps me warm in icy water.", true: true },
        { text: "My thick white fur blends into the snow and ice.", true: false },
        { text: "I am a large bear that roams the frozen north.", true: false },
        { text: "I hunt seals by waiting beside holes in the ice.", true: false },
        { text: "I can run fast and swim for long distances.", true: false }
      ]
    },
    {
      answer: "Dolphin",
      clues: [
        { text: "I am a mammal that breathes air at the surface.", true: true },
        { text: "I leap out of the water in graceful arcs.", true: true },
        { text: "I use clicks and echoes to find my way.", true: true },
        { text: "I live in oceans and sometimes swim with boats.", true: true },
        { text: "Fish and squid make up much of my diet.", true: true },
        { text: "I am known as a highly intelligent animal.", true: true },
        { text: "My skeleton is made of cartilage rather than bone.", true: false },
        { text: "My skin feels rough, like coarse sandpaper.", true: false },
        { text: "I can sense blood in the water from a distance.", true: false },
        { text: "Some of my kind are feared as dangerous predators.", true: false }
      ]
    },
    {
      answer: "Butterfly",
      clues: [
        { text: "I start life as a caterpillar before changing shape.", true: true },
        { text: "I have two pairs of wings covered in tiny scales.", true: true },
        { text: "I feed on nectar through a long, coiled tongue.", true: true },
        { text: "I am often seen fluttering around gardens in summer.", true: true },
        { text: "My wings can be bright and patterned in colour.", true: true },
        { text: "I rest with my wings held upright above my body.", true: true },
        { text: "I live in a colony ruled by a single queen.", true: false },
        { text: "I build cells with six sides out of wax.", true: false },
        { text: "I carry pollen back to my nest on my legs.", true: false },
        { text: "I can sting and then I die soon afterwards.", true: false }
      ]
    },
    {
      answer: "River",
      clues: [
        { text: "I flow downhill towards a lake or the sea.", true: true },
        { text: "Bridges are built across me so people can cross.", true: true },
        { text: "I have banks of soil or rock along each side.", true: true },
        { text: "Fish such as trout and salmon swim in me.", true: true },
        { text: "I am fed by rain and melting snow upstream.", true: true },
        { text: "My water is fresh rather than salty.", true: true },
        { text: "Cars and lorries travel along my smooth surface.", true: false },
        { text: "I am marked with lines and a central divider.", true: false },
        { text: "I link towns and cities across the countryside.", true: false },
        { text: "I am surfaced with tarmac or concrete.", true: false }
      ]
    },
    {
      answer: "Beach",
      clues: [
        { text: "I am a strip of sand or shingle by the sea.", true: true },
        { text: "Waves roll onto me and then pull back again.", true: true },
        { text: "I am a popular place to sunbathe in summer.", true: true },
        { text: "Seashells can be found scattered across me.", true: true },
        { text: "People build sandcastles and paddle in the shallows.", true: true },
        { text: "I mark the edge where the land meets the water.", true: true },
        { text: "Tall trees grow close together all around me.", true: false },
        { text: "I am home to birds, deer, and other wildlife.", true: false },
        { text: "Paths wind through me under a leafy canopy.", true: false },
        { text: "I am a good place for a quiet walk in shade.", true: false }
      ]
    },
    {
      answer: "Bridge",
      clues: [
        { text: "I carry a road or path over a gap below.", true: true },
        { text: "I often span a river, a valley, or a gorge.", true: true },
        { text: "I am supported by arches, piers, or cables.", true: true },
        { text: "Railings or barriers run along my two sides.", true: true },
        { text: "Traffic can cross me without getting wet.", true: true },
        { text: "I am checked regularly for wear and safety.", true: true },
        { text: "I pass underneath a hill or a busy waterway.", true: false },
        { text: "Drivers switch on their lights while inside me.", true: false },
        { text: "I am a long enclosed passage with a roof above.", true: false },
        { text: "I have an entrance and an exit at either end.", true: false }
      ]
    },
    {
      answer: "Train",
      clues: [
        { text: "I run on rails and stop at stations along the way.", true: true },
        { text: "I am made up of several carriages coupled together.", true: true },
        { text: "A locomotive or electric engine pulls me along.", true: true },
        { text: "I follow a timetable published for passengers.", true: true },
        { text: "I can carry hundreds of people at once.", true: true },
        { text: "I travel over long distances across the country.", true: true },
        { text: "I follow a route through streets on rubber tyres.", true: false },
        { text: "I stop at bus stops marked by a sign on the pavement.", true: false },
        { text: "A driver steers me with a steering wheel.", true: false },
        { text: "I can change lanes and overtake other vehicles.", true: false }
      ]
    },
    {
      answer: "Tent",
      clues: [
        { text: "I am made of light fabric stretched over poles.", true: true },
        { text: "I am pitched with pegs to hold me down.", true: true },
        { text: "People sleep inside me while camping outdoors.", true: true },
        { text: "I can be folded into a small carry bag.", true: true },
        { text: "A zip or flap forms my entrance.", true: true },
        { text: "I give shelter from wind and rain at night.", true: true },
        { text: "I need a strong wind to get me up in the air.", true: false },
        { text: "A long line keeps me from flying away.", true: false },
        { text: "I am often diamond-shaped with a tail for balance.", true: false },
        { text: "Children run across a field to launch me.", true: false }
      ]
    },
    {
      answer: "Backpack",
      clues: [
        { text: "I am worn on your back by two shoulder straps.", true: true },
        { text: "I have one large compartment and smaller pockets.", true: true },
        { text: "Students use me to carry books and lunch to school.", true: true },
        { text: "I have a handle on top for lifting me.", true: true },
        { text: "Zips or drawcords keep my contents safely inside.", true: true },
        { text: "Hikers fill me with water, food, and spare clothes.", true: true },
        { text: "I have wheels and a telescoping handle for pulling.", true: false },
        { text: "I am taken on holidays and stored in an overhead locker.", true: false },
        { text: "I open flat with two halves and a zip around the middle.", true: false },
        { text: "I am hard-sided and built to protect what is inside.", true: false }
      ]
    },
    {
      answer: "Scissors",
      clues: [
        { text: "I have two blades joined at a central pivot.", true: true },
        { text: "I cut paper, string, and fabric when the blades close.", true: true },
        { text: "A finger goes through each of my two handles.", true: true },
        { text: "I come in sizes from tiny embroidery to large tailoring.", true: true },
        { text: "The blades must be kept sharp to work well.", true: true },
        { text: "I am dangerous around small children.", true: true },
        { text: "I have two tips joined at one end only.", true: false },
        { text: "I am used to pluck out splinters and stray hairs.", true: false },
        { text: "I grip small objects rather than cutting them.", true: false },
        { text: "I am small enough to keep in a bathroom cabinet.", true: false }
      ]
    },
    {
      answer: "Balloon",
      clues: [
        { text: "I am filled with air or a lighter-than-air gas.", true: true },
        { text: "A string is often tied to me to hold me down.", true: true },
        { text: "I float upward if filled with the right gas.", true: true },
        { text: "I make a loud popping sound if I burst.", true: true },
        { text: "I am a common decoration at birthday parties.", true: true },
        { text: "I am made from thin rubber or a similar stretchy film.", true: true },
        { text: "I slow the fall of someone jumping from a plane.", true: false },
        { text: "I am packed tightly into a pack before use.", true: false },
        { text: "When open, I form a curved canopy above you.", true: false },
        { text: "I am used to drop supplies from an aircraft.", true: false }
      ]
    },
    {
      answer: "Sunflower",
      clues: [
        { text: "I grow tall on a single sturdy stem.", true: true },
        { text: "My flower head is round with a dark centre.", true: true },
        { text: "Bright yellow petals ring the edge of my head.", true: true },
        { text: "My seeds are eaten by birds and by people.", true: true },
        { text: "I track a bright light across the sky each day.", true: true },
        { text: "I am often grown in gardens and farm fields.", true: true },
        { text: "I have thin white petals around a yellow centre.", true: false },
        { text: "I am a small flower that grows low in lawns.", true: false },
        { text: "Children make chains from my flowers in spring.", true: false },
        { text: "I bloom in grassy fields and along roadsides.", true: false }
      ]
    },
    {
      answer: "Lamp",
      clues: [
        { text: "I give light when I am switched on.", true: true },
        { text: "A shade directs my glow downwards onto a surface.", true: true },
        { text: "I need electricity or a battery to work.", true: true },
        { text: "I sit on a table or stand on the floor.", true: true },
        { text: "My bulb can be changed when it stops working.", true: true },
        { text: "I am often used for reading in the evening.", true: true },
        { text: "I can be carried from place to place by hand.", true: false },
        { text: "A hook lets me hang from a tent or a tree.", true: false },
        { text: "I still work when the power is out.", true: false },
        { text: "I can burn oil or a candle as well as batteries.", true: false }
      ]
    }
  ];

  // Christmas-only pool for the arcade event. Same clue rules as the daily
  // catalog; never mixed into daily puzzles.
  const CHRISTMAS_CATALOG = [
    {
      answer: "Snowman",
      clues: [
        { text: "I am built in a garden from packed winter snow.", true: true },
        { text: "Three round sections stacked on top of each other form me.", true: true },
        { text: "A carrot is often pushed into my middle section as a nose.", true: true },
        { text: "Two sticks can stick out from my sides like arms.", true: true },
        { text: "I wear a scarf and a hat before I start to melt.", true: true },
        { text: "Coal pieces are commonly used for my eyes and buttons.", true: true }
      ]
    },
    {
      answer: "Reindeer",
      clues: [
        { text: "I pull a sleigh through the night in many stories.", true: true },
        { text: "Antlers grow on my head and are shed each year.", true: true },
        { text: "I live in cold northern herds and eat moss in winter.", true: true },
        { text: "My hooves make a clicking sound on hard ground.", true: true },
        { text: "A red nose belongs to one famous member of my kind.", true: true },
        { text: "I can run fast across snow without sinking deeply.", true: true }
      ]
    },
    {
      answer: "Christmas Tree",
      clues: [
        { text: "I am brought indoors and decorated in December.", true: true },
        { text: "Lights and baubles hang from my branches.", true: true },
        { text: "A star or an angel often sits at my very top.", true: true },
        { text: "I smell of pine when I am freshly cut.", true: true },
        { text: "Presents are placed around my base on the floor.", true: true },
        { text: "I stand in a pot or a stand so I do not fall.", true: true }
      ]
    },
    {
      answer: "Santa Claus",
      clues: [
        { text: "I deliver presents to children on Christmas Eve.", true: true },
        { text: "I travel through the sky in a sleigh pulled by reindeer.", true: true },
        { text: "I wear a red coat with a white fur trim.", true: true },
        { text: "I am said to live at the North Pole.", true: true },
        { text: "I check a list of who has been naughty or nice.", true: true },
        { text: "I come down chimneys in many traditional stories.", true: true }
      ]
    },
    {
      answer: "Gingerbread",
      clues: [
        { text: "I can be baked into sweet figures shaped like people.", true: true },
        { text: "Icing is often piped onto me in bright white lines.", true: true },
        { text: "A house made of me has candy for roof tiles.", true: true },
        { text: "My dough is flavoured with ginger and warm spices.", true: true },
        { text: "I am a popular treat at winter fairs and markets.", true: true },
        { text: "Gumdrops and sweets are used to decorate my walls.", true: true }
      ]
    },
    {
      answer: "Snowflake",
      clues: [
        { text: "I form in cold clouds from frozen water vapour.", true: true },
        { text: "No two of my kind are said to be exactly alike.", true: true },
        { text: "I fall gently to the ground in winter storms.", true: true },
        { text: "I have six arms made of tiny ice crystals.", true: true },
        { text: "I melt quickly when I land on a warm hand.", true: true },
        { text: "My shape is often copied into paper decorations.", true: true }
      ]
    },
    {
      answer: "Candy Cane",
      clues: [
        { text: "I am a striped sweet shaped like a shepherd's hook.", true: true },
        { text: "Peppermint gives me my sharp, cool flavour.", true: true },
        { text: "I am often hung from the branches of a festive tree.", true: true },
        { text: "Red and white stripes spiral along my length.", true: true },
        { text: "I can be snapped into pieces to share with a friend.", true: true },
        { text: "I am a classic treat found in Christmas stockings.", true: true }
      ]
    },
    {
      answer: "Mistletoe",
      clues: [
        { text: "I am a small evergreen plant with white berries.", true: true },
        { text: "I am hung in doorways as a Christmas custom.", true: true },
        { text: "A kiss under me is a well-known holiday tradition.", true: true },
        { text: "I grow attached to the branches of trees.", true: true },
        { text: "My leaves stay green through the coldest months.", true: true },
        { text: "I am poisonous if the berries are eaten.", true: true }
      ]
    },
    {
      answer: "Ornament",
      clues: [
        { text: "I am a small decoration hung on a Christmas tree.", true: true },
        { text: "Glass ones can catch the light and sparkle.", true: true },
        { text: "I might be shaped like a star, a bell, or a ball.", true: true },
        { text: "A loop or hook helps me hang from a branch.", true: true },
        { text: "I am carefully packed away after the holidays end.", true: true },
        { text: "Families often collect me over many years.", true: true }
      ]
    },
    {
      answer: "Wreath",
      clues: [
        { text: "I am a circle of greenery hung on a front door.", true: true },
        { text: "A red bow is often tied to my lower edge.", true: true },
        { text: "I am made from pine, holly, or artificial greenery.", true: true },
        { text: "I can be decorated with baubles and dried fruit.", true: true },
        { text: "Hanging me is a traditional Advent decoration.", true: true },
        { text: "My circular shape is meant to suggest endless life.", true: true }
      ]
    },
    {
      answer: "Stocking",
      clues: [
        { text: "I am hung by the fireplace with care in December.", true: true },
        { text: "Presents and small toys are tucked inside me on Christmas morning.", true: true },
        { text: "I am usually red with a white furry cuff.", true: true },
        { text: "A name is often sewn onto my top band.", true: true },
        { text: "Children hang me up before they go to bed.", true: true },
        { text: "I am traditionally emptied after the holidays begin.", true: true }
      ]
    },
    {
      answer: "Sleigh",
      clues: [
        { text: "I am a low sled used to travel over snow.", true: true },
        { text: "Reindeer are said to pull one through the night sky.", true: true },
        { text: "I have curved runners that glide on soft snow.", true: true },
        { text: "Bells are sometimes tied to my harness.", true: true },
        { text: "I can carry passengers and a large sack of gifts.", true: true },
        { text: "I am a familiar sight in winter holiday stories.", true: true }
      ]
    },
    {
      answer: "Carol",
      clues: [
        { text: "I am a cheerful song sung in the weeks before Christmas.", true: true },
        { text: "Groups of singers go from door to door performing me.", true: true },
        { text: "I often tell the story of a winter birth or a snowy scene.", true: true },
        { text: "Church services include many of my kind in December.", true: true },
        { text: "I can be heard in shopping streets and town squares.", true: true },
        { text: "People may sing me while collecting money for charity.", true: true }
      ]
    },
    {
      answer: "Cocoa",
      clues: [
        { text: "I am a warm drink made from chocolate and milk.", true: true },
        { text: "Marshmallows are often floated on top of me.", true: true },
        { text: "I am served in mugs on cold winter evenings.", true: true },
        { text: "A sprinkle of cinnamon can be added to my foam.", true: true },
        { text: "I help warm hands around a fireplace after playing in snow.", true: true },
        { text: "I am a favourite after a day in the cold.", true: true }
      ]
    },
    {
      answer: "Elf",
      clues: [
        { text: "I am a small helper in the stories told at Christmas.", true: true },
        { text: "I work in a workshop making toys for children.", true: true },
        { text: "I am often pictured wearing green and pointy shoes.", true: true },
        { text: "I help wrap gifts and check the list of names.", true: true },
        { text: "I have pointed ears and a mischievous grin.", true: true },
        { text: "I am said to live far away in a snowy northern home.", true: true },
        { text: "I have large wings and a halo above my head.", true: false },
        { text: "I am pictured in a flowing white robe.", true: false },
        { text: "I am sent to bring a message from heaven.", true: false },
        { text: "I am placed at the very top of a festive tree.", true: false }
      ]
    },
    {
      answer: "Angel",
      clues: [
        { text: "I am pictured with large wings and a halo.", true: true },
        { text: "I bring a message of good news in the Christmas story.", true: true },
        { text: "I am often shown wearing a flowing white robe.", true: true },
        { text: "A figure of me is placed on top of many festive trees.", true: true },
        { text: "I am said to watch over people and guide them.", true: true },
        { text: "I appear in the story of a birth in a stable.", true: true },
        { text: "I am small and wear a pointed hat and green tunic.", true: false },
        { text: "I spend December busy in a toy workshop.", true: false },
        { text: "I have pointed ears and a cheeky smile.", true: false },
        { text: "I help deliver presents by climbing down chimneys.", true: false }
      ]
    },
    {
      answer: "Bell",
      clues: [
        { text: "I make a ringing or jingling sound when shaken.", true: true },
        { text: "A small clapper inside me strikes the metal.", true: true },
        { text: "Bells like me are sewn onto festive harnesses.", true: true },
        { text: "I am rung to call people to a church service.", true: true },
        { text: "I can be held in the hand and rung in a group.", true: true },
        { text: "My sound is a familiar part of many winter songs.", true: true },
        { text: "I have a tight skin stretched over a round shell.", true: false },
        { text: "I am beaten with sticks to keep a steady rhythm.", true: false },
        { text: "I make a low booming sound rather than a ring.", true: false },
        { text: "I am carried in a parade and struck as people march.", true: false }
      ]
    },
    {
      answer: "Star",
      clues: [
        { text: "I shine brightly in the night sky.", true: true },
        { text: "A five-pointed shape of me crowns many festive trees.", true: true },
        { text: "I am said to have guided travellers long ago.", true: true },
        { text: "I twinkle because of the air around me.", true: true },
        { text: "I am a familiar symbol on cards and decorations.", true: true },
        { text: "I appear as a single bright point in the east.", true: true },
        { text: "I change shape from a thin sliver to a full circle.", true: false },
        { text: "I shine by reflecting the light of the sun.", true: false },
        { text: "I rise and set at different times each night.", true: false },
        { text: "I am linked with tides and with werewolf stories.", true: false }
      ]
    },
    {
      answer: "Gift",
      clues: [
        { text: "I am wrapped in paper and tied with a bow.", true: true },
        { text: "I am placed under a tree ready for the morning.", true: true },
        { text: "I am given to friends and family at Christmas.", true: true },
        { text: "I am a surprise that people enjoy unwrapping.", true: true },
        { text: "A tag with the receiver's name is fixed to me.", true: true },
        { text: "I can be a toy, a book, or a piece of clothing.", true: true },
        { text: "I am a folded piece of paper with a greeting inside.", true: false },
        { text: "I am posted in an envelope to friends far away.", true: false },
        { text: "I am opened by tearing along a sealed flap.", true: false },
        { text: "I carry a short handwritten message of good wishes.", true: false }
      ]
    },
    {
      answer: "Wrapping Paper",
      clues: [
        { text: "I come in rolls covered with festive patterns.", true: true },
        { text: "I am torn or cut to cover a present.", true: true },
        { text: "I may be plain, shiny, or printed with designs.", true: true },
        { text: "Tape or glue is used to hold me in place.", true: true },
        { text: "I am discarded once the present is opened.", true: true },
        { text: "I come in bright reds, greens, and golds.", true: true },
        { text: "I am printed with news and delivered each morning.", true: false },
        { text: "I am folded into sections and thrown away after reading.", true: false },
        { text: "I come out in daily or weekly editions with dates.", true: false },
        { text: "I am bought from a newsagent or shop.", true: false }
      ]
    },
    {
      answer: "Ribbon",
      clues: [
        { text: "I am a narrow strip of silky or shiny material.", true: true },
        { text: "I am tied into a bow on top of a present.", true: true },
        { text: "I come on a roll and can be curled with scissors.", true: true },
        { text: "I can be red, gold, silver, or any bright colour.", true: true },
        { text: "I am used to decorate cards and gift boxes.", true: true },
        { text: "I trail elegantly from a wrapped parcel.", true: true },
        { text: "I am a thin cord used for tying up parcels.", true: false },
        { text: "I come on a spool rather than a wide roll.", true: false },
        { text: "I am made of twisted fibre and feel rough.", true: false },
        { text: "I am used to tie a kite or a bundle of sticks.", true: false }
      ]
    },
    {
      answer: "Christmas Card",
      clues: [
        { text: "I am a folded greeting sent to friends in December.", true: true },
        { text: "I have a festive picture on my front cover.", true: true },
        { text: "I carry a short handwritten message inside.", true: true },
        { text: "I am posted in an envelope with a stamp.", true: true },
        { text: "Families display me on a mantle or a shelf.", true: true },
        { text: "I am sent to wish people well at this time of year.", true: true },
        { text: "I have no envelope and show a picture on my front.", true: false },
        { text: "I am written on one side and stamped on the other.", true: false },
        { text: "I am sent from places you visit on holiday.", true: false },
        { text: "I am a flat rectangular piece of thick card.", true: false }
      ]
    },
    {
      answer: "Advent Calendar",
      clues: [
        { text: "I count down the days before the big celebration.", true: true },
        { text: "I have a small door or window for each day.", true: true },
        { text: "I start being used on the first day of December.", true: true },
        { text: "A treat or a picture sits behind each flap.", true: true },
        { text: "Children open one section every morning.", true: true },
        { text: "I am often made of printed card with glitter.", true: true },
        { text: "I show all the days and months of the whole year.", true: false },
        { text: "I am hung on a wall and turned over each month.", true: false },
        { text: "I mark birthdays and appointments as well as holidays.", true: false },
        { text: "I can be a paper pad or a digital display.", true: false }
      ]
    },
    {
      answer: "Holly",
      clues: [
        { text: "I am an evergreen plant with glossy green leaves.", true: true },
        { text: "My leaves have sharp, prickly edges along them.", true: true },
        { text: "I bear small bright red berries in winter.", true: true },
        { text: "I am a traditional decoration in festive garlands.", true: true },
        { text: "My berries are poisonous if eaten by mistake.", true: true },
        { text: "I stay green through the coldest part of the year.", true: true },
        { text: "I have pale white berries that are also poisonous.", true: false },
        { text: "I grow attached to the branches of other trees.", true: false },
        { text: "I am hung in doorways where people exchange kisses.", true: false },
        { text: "My leaves are soft and rounded rather than prickly.", true: false }
      ]
    },
    {
      answer: "Poinsettia",
      clues: [
        { text: "I am a potted plant sold in great numbers in December.", true: true },
        { text: "My bright red parts are actually modified leaves.", true: true },
        { text: "I am a popular decoration in churches and homes.", true: true },
        { text: "I need warmth and careful watering to stay healthy.", true: true },
        { text: "I originally come from a warm country in Mexico.", true: true },
        { text: "My star-shaped top is a familiar festive sight.", true: true },
        { text: "I have velvety petals and a sweet, famous scent.", true: false },
        { text: "I grow on thorny stems in gardens and hedges.", true: false },
        { text: "I am given as a token of love on special days.", true: false },
        { text: "My petals are soft and my leaves are saw-toothed.", true: false }
      ]
    },
    {
      answer: "Christmas Pudding",
      clues: [
        { text: "I am a rich, dark dessert served at the festive meal.", true: true },
        { text: "I am made with dried fruit, spices, and suet.", true: true },
        { text: "I am steamed for hours and reheated before serving.", true: true },
        { text: "A splash of brandy is lit on top of me.", true: true },
        { text: "I am often served with custard or cream.", true: true },
        { text: "I am round and dusted with sugar before the table.", true: true },
        { text: "I am a dense cake packed with candied fruit and nuts.", true: false },
        { text: "I am baked in a loaf tin and sliced thinly.", true: false },
        { text: "I am wrapped in marzipan and iced for weddings.", true: false },
        { text: "I keep for months without going stale.", true: false }
      ]
    },
    {
      answer: "Mince Pie",
      clues: [
        { text: "I am a small pastry with a sweet spiced filling.", true: true },
        { text: "I am eaten in great numbers during the festive season.", true: true },
        { text: "I am often dusted with sugar on my top.", true: true },
        { text: "My filling is made from dried fruit and spices.", true: true },
        { text: "I am round with a crimped edge around the filling.", true: true },
        { text: "I am served warm with tea or a glass of milk.", true: true },
        { text: "I am a large pie cut into wedges at the table.", true: false },
        { text: "My filling is made from sliced fruit and sugar.", true: false },
        { text: "I have a pastry crust on both top and bottom.", true: false },
        { text: "I am eaten warm or cold with custard or cream.", true: false }
      ]
    },
    {
      answer: "Roast Turkey",
      clues: [
        { text: "I am a large bird cooked for the main festive meal.", true: true },
        { text: "I am stuffed with breadcrumbs, herbs, and onion.", true: true },
        { text: "I am roasted in an oven until my skin is golden.", true: true },
        { text: "Slices of me are served with gravy and stuffing.", true: true },
        { text: "I am carved at the table by the head of the house.", true: true },
        { text: "I feed a large crowd of family and friends.", true: true },
        { text: "I am a joint of beef cooked in the oven for hours.", true: false },
        { text: "I am sliced thinly and served with Yorkshire puddings.", true: false },
        { text: "I am eaten with horseradish sauce and roasted potatoes.", true: false },
        { text: "A pink centre is considered ideal by many cooks.", true: false }
      ]
    },
    {
      answer: "Eggnog",
      clues: [
        { text: "I am a creamy drink served around the festive season.", true: true },
        { text: "I am made with milk, cream, sugar, and eggs.", true: true },
        { text: "A sprinkle of nutmeg is added on top of me.", true: true },
        { text: "I am served in small cups or glasses at parties.", true: true },
        { text: "I can be made with or without alcohol.", true: true },
        { text: "I am rich, thick, and sweet to drink.", true: true },
        { text: "I am made from chocolate and hot milk.", true: false },
        { text: "I am served in a mug to warm cold hands.", true: false },
        { text: "Marshmallows are often floated on top of me.", true: false },
        { text: "I am a favourite after a day out in the snow.", true: false }
      ]
    },
    {
      answer: "Snow Globe",
      clues: [
        { text: "I am a glass ball with a scene inside it.", true: true },
        { text: "Shaking me sends glitter floating like snow.", true: true },
        { text: "I sit on a base and can be used as a paperweight.", true: true },
        { text: "I contain water and tiny flakes that swirl around.", true: true },
        { text: "I show a miniature winter scene or a little house.", true: true },
        { text: "I am kept on a shelf as a festive decoration.", true: true },
        { text: "I am a bowl of water kept for a pet fish.", true: false },
        { text: "I have a little pump to keep the water clean.", true: false },
        { text: "I need feeding and cleaning regularly.", true: false },
        { text: "I am home to plants and swimming goldfish.", true: false }
      ]
    },
    {
      answer: "Fairy Lights",
      clues: [
        { text: "I am a string of many small coloured bulbs.", true: true },
        { text: "I am draped along the edges of houses and trees.", true: true },
        { text: "I twinkle and flash in a sequence when switched on.", true: true },
        { text: "I am plugged into a socket or run on batteries.", true: true },
        { text: "I am put up in December and taken down afterwards.", true: true },
        { text: "I make a garden or a room look magical at night.", true: true },
        { text: "I am made of wax with a wick that I burn down.", true: false },
        { text: "I am lit with a match and need watching closely.", true: false },
        { text: "A puff of breath can put me out.", true: false },
        { text: "I drip melted wax as I burn.", true: false }
      ]
    },
    {
      answer: "Christmas Cracker",
      clues: [
        { text: "I am pulled apart by two people at the dinner table.", true: true },
        { text: "I make a loud snap when I am pulled.", true: true },
        { text: "A paper crown is tucked inside me.", true: true },
        { text: "I contain a small toy, a joke, or a trinket.", true: true },
        { text: "I am placed beside each plate at the festive meal.", true: true },
        { text: "I am made of cardboard with a rough striped wrapper.", true: true },
        { text: "I am held pointing away from people and twisted.", true: false },
        { text: "I shoot out streamers with a loud bang.", true: false },
        { text: "I am used to celebrate a birthday or New Year.", true: false },
        { text: "I am a small cone with a pull-string at the bottom.", true: false }
      ]
    },
    {
      answer: "Nutcracker",
      clues: [
        { text: "I am a wooden figure with a hinged jaw.", true: true },
        { text: "A lever at my back closes my jaw to crack shells.", true: true },
        { text: "I am often dressed as a soldier in a red uniform.", true: true },
        { text: "I stand on a shelf as a festive decoration.", true: true },
        { text: "A famous ballet was written about me.", true: true },
        { text: "I am given as a gift or kept as a collection.", true: true },
        { text: "I am a small painted tin figure with a toy gun.", true: false },
        { text: "I am lined up in rows on a playroom floor.", true: false },
        { text: "I march in parades in stories and old songs.", true: false },
        { text: "I am made of lead or plastic rather than wood.", true: false }
      ]
    },
    {
      answer: "Nativity Scene",
      clues: [
        { text: "I show figures of a family gathered in a stable.", true: true },
        { text: "I include a baby lying in a manger of straw.", true: true },
        { text: "Shepherds and wise men are part of my figures.", true: true },
        { text: "I am set up in churches and homes in December.", true: true },
        { text: "I tell the story of a famous winter birth.", true: true },
        { text: "I am made from carved wood, clay, or plastic.", true: true },
        { text: "I have tiny rooms with miniature furniture inside.", true: false },
        { text: "I am opened at the front to reveal my rooms.", true: false },
        { text: "I am furnished with little beds, chairs, and rugs.", true: false },
        { text: "I am a toy that children play with for hours.", true: false }
      ]
    }
  ];

  const api = { PUZZLE_VERSION, CATALOG, CHRISTMAS_CATALOG };
  root.RedHerringPuzzles = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
