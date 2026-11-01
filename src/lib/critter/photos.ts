// Real animal photos for the critter page. All are freely licensed on Wikimedia Commons
// (CC0, public domain, CC BY or CC BY-SA), self-hosted in /public/critters as 560px
// JPEGs, and credited on the card. Each feeling lists photos whose real expression fits it;
// the first is the default and "Another photo" cycles the rest.

import type { Feeling } from "./catalog";

export type Photo = {
  alt: string;
  author: string;
  license: string; // "CC0", "Public domain", "CC BY 2.0", "CC BY-SA 4.0", ...
  licenseUrl: string;
  source: string; // Commons file page
  pos?: string; // CSS object-position focal point for the square crop
};

export const PHOTOS = {
  "koala-yawn": { alt: "A koala mid-yawn, clinging to a branch", author: "Eric Kilby", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", source: "https://commons.wikimedia.org/wiki/File:Koala_Yawning_Ferociously_(47860049021).jpg", pos: "65% 40%" },
  "kitten-yawn": { alt: "A tabby kitten yawning wide", author: "Nancy Wong", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:SFSPCA_Kitten.jpg", pos: "60% 50%" },
  "dog-nap": { alt: "A dog fast asleep on a cushion", author: "Pippo-b", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:Dog_sleeping_Rome.JPG", pos: "100% 50%" },
  "seal-pup": { alt: "A white harp seal pup with big dark eyes, chin on the snow", author: "Hotel Kaesong", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", source: "https://commons.wikimedia.org/wiki/File:Harp_seal_whitecoat.jpg", pos: "35% 50%" },
  "basset-bench": { alt: "A basset hound with long droopy ears slumped on a bench", author: "eda", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Male_basset_hound_.jpg", pos: "60% 30%" },
  "basset-pup": { alt: "A basset hound puppy looking up with sad eyes", author: "eda", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Basset_hound_jeune.jpg", pos: "45% 40%" },
  "cone-dog": { alt: "A dog in a cone collar, chin down, looking up pitifully", author: "Geoff Stearns", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Sad_Cone_Puppy.jpg", pos: "60% 50%" },
  "shepherd-chin": { alt: "A German shepherd lying with its chin on the grass, eyes looking up", author: "PROPOLI87", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Sguardo_colpevole.jpg", pos: "50% 50%" },
  "pom-flat": { alt: "A fluffy white dog lying flat on the floor", author: "Diosa Marie Aguila", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Sad_puppy.jpg", pos: "60% 50%" },
  "hamster-flat": { alt: "A hamster flattened on the carpet", author: "Firelord at English Wikipedia", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Mesocricetus_auratus_(golden).jpg" },
  "guilty-dog": { alt: "A dog looking up with a guilty, sorry face", author: "cogdogblog", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:2016-366-124_%22It_Wasn%27t_Me!%22_(26710345282).jpg", pos: "30% 40%" },
  "dog-snow": { alt: "A small fluffy dog standing in the snow", author: "Savexig63", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Cute_dog_playing_on_snow.jpg", pos: "40% 50%" },
  "seal-alone": { alt: "A seal pup lying alone on the snow", author: "Lysogeny", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Weaned_harp_seal_pup.jpg", pos: "75% 60%" },
  "manul-log": { alt: "A Pallas's cat lying on a log with a disapproving look", author: "Albinfo", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Manul_close.jpg", pos: "55% 40%" },
  "kitten-shock": { alt: "A wide-eyed kitten with its mouth open in shock", author: "Jarek Tuszyński", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Gray_stripy_Kitten_-_1.JPG" },
  "kitten-blanket": { alt: "A kitten hiding under a blanket, only its face peeking out", author: "Mikhail Vasilyev", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Kitten_hiding_under_a_plaid.jpg", pos: "52% 50%" },
  "kitten-leaves": { alt: "A kitten peeking through leaves", author: "Ivan Radic", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Kitten_hiding_in_the_shrubs_-_Flickr_-_Ivan_Radic.jpg", pos: "40% 50%" },
  "redpanda-peek": { alt: "A red panda peeking over mossy branches", author: "Sunuwargr", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Curious_Red_Panda_in_Langtang_National_Park.jpg" },
  "meerkat-stare": { alt: "A meerkat staring straight ahead", author: "BFS Man", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Ever_on_the_Alert_(5798610458).jpg", pos: "35% 40%" },
  "hamster-stand": { alt: "A hamster standing upright, staring", author: "Wschlitz", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Juvenile_Female_Mesocricetus_auratus_in_Pet_Store_enclosure,_Illinois,_USA.jpg", pos: "50% 30%" },
  "redpanda-curious": { alt: "A red panda looking with wide curious eyes", author: "H. Zell", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Ailurus_fulgens_-_Karlsruhe_Zoo_01.jpg" },
  "husky-pup": { alt: "A husky puppy looking up with wide eyes", author: "Paulconwall", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Pomsky_Dog_Breed_-_Pomeranian_Husky_Mix.jpg", pos: "55% 30%" },
  "pom-tilt": { alt: "A fluffy dog tilting its head", author: "Tsaag Valren", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Mittelspitz_LOF_Malo,_2,5_months.jpg", pos: "50% 55%" },
  "redpanda-branch": { alt: "A red panda on a branch, looking puzzled", author: "Mathias Appel", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Red_Panda_(25193861686).jpg", pos: "40% 50%" },
  "panda-cub": { alt: "A panda cub resting, looking ahead", author: "Sheilalau at English Wikipedia", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Panda_Cub_from_Wolong,_Sichuan,_China.JPG" },
  "siamese-flehmen": { alt: "A Siamese cat curling its lip in a scrunched 'ew' face", author: "Bravevesperia8", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Cat_flehmen_response.jpg", pos: "50% 25%" },
  "tabby-flehmen": { alt: "A tabby cat making a disgusted open-mouth face", author: "MouFengcoo", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Domestic_Shorthair_cat_displaying_Flehmen_response.png", pos: "35% 45%" },
  "redpanda-tongue": { alt: "A red panda sticking out its tongue", author: "Christian Mehlführer", license: "CC BY 2.5", licenseUrl: "https://creativecommons.org/licenses/by/2.5", source: "https://commons.wikimedia.org/wiki/File:MC_Kleiner_Panda.jpg", pos: "35% 50%" },
  "basset-flower": { alt: "A basset hound holding a flower in its mouth, with sad eyes", author: "Palmarin776", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Basset-hound-flower_20240122_by_Palmarin776.jpg" },
  "redpanda-rope": { alt: "A red panda lying flat on a rope bridge", author: "User Bernard Landgraf on de.wikipedia.org", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:Red_Panda.JPG", pos: "60% 50%" },
  "shiba-carrier": { alt: "A shiba inu lying in a carrier bag", author: "Taro the Shiba Inu", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Shiba_Inu_in_the_carrier.jpg", pos: "55% 40%" },
  "fold-eyesclosed": { alt: "A grey-and-white cat with its eyes peacefully closed", author: "Takashi Hososhima", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", source: "https://commons.wikimedia.org/wiki/File:Marimo_(5369843501)_(2011;_cropped_2023).jpg", pos: "60% 45%" },
  "otter-float": { alt: "A sea otter floating on its back", author: "Matt Zalewski", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Sea_Otter_0.jpg", pos: "65% 40%" },
  "panda-log": { alt: "A panda cub sprawled over a log", author: "fortherock", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", source: "https://commons.wikimedia.org/wiki/File:Yun_Zi_-_Baby_Giant_Panda_-_IMG_1456_(4305497181).jpg", pos: "100% 50%" },
  "samoyed-smile": { alt: "A samoyed with a big open smile", author: "VirtualWolf", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", source: "https://commons.wikimedia.org/wiki/File:Samoyed_(9046242341).jpg", pos: "45% 40%" },
  "shiba-smile": { alt: "A shiba inu smiling", author: "Roberto Vasarri", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Shiba_inu_taiki.jpg", pos: "50% 35%" },
  "shiba-squint": { alt: "A shiba inu squinting happily", author: "Nancy Wong", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:A_Shiba_Inu_enjoying_a_sunny_day.jpg", pos: "45% 30%" },
  "papillon-run": { alt: "A papillon dog running with its tongue out", author: "Huggorm", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Papillon_running_(cropped).JPG", pos: "50% 30%" },
  "sheepdog-run": { alt: "A fluffy sheepdog bounding across the grass", author: "Sheila Sund", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Shaggy_Dog_running.jpg", pos: "50% 25%" },
  "quokka-hold": { alt: "A quokka sitting up, holding a sprig, looking at the camera", author: "patrickkavanagh", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Quokka_(Setonix_brachyurus)_(27725086285).jpg", pos: "45% 35%" },
  "quokka-look": { alt: "A quokka on sandy ground looking up at the camera", author: "Christophe95", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Setonix_brachyurus_on_Rottnest_Island_1.jpg", pos: "35% 50%" },
  "capybara-front": { alt: "A capybara face-on, calm and unbothered", author: "Till.niermann", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Hydrochoerus_hydrochaeris_Cologne_Portrait.jpg", pos: "50% 30%" },
  "capybara-stand": { alt: "A capybara standing by the water, looking at the camera", author: "Scottmliddell", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0", source: "https://commons.wikimedia.org/wiki/File:Capybara_zoo.jpg", pos: "40% 30%" },
  "capybara-tray": { alt: "A capybara resting its chin on the edge of a tray", author: "shankar s. from sharjah, united arab emirates", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Capybara-_the_world%27s_largest_rodent_(15821317874).jpg", pos: "35% 50%" },
  "puppy-sand": { alt: "A black puppy dusted with sand, looking up with big eyes", author: "Sathiyamaran Praveen", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Attractive_Eyes.jpg", pos: "50% 10%" },
  "lab-couch": { alt: "A yellow Labrador curled on a couch, looking up with one eye", author: "ArtHistoryIsDank", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Yellow_Lab_on_Couch.jpg", pos: "60% 75%" },
  "persian-grump": { alt: "A fluffy silver Persian cat with a grumpy look", author: "Andrey", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Doll_face_silver_Persian.jpg", pos: "45% 35%" },
  "persian-white": { alt: "A white Persian cat gazing upward", author: "Bambooo", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Persian_silver_dollface.jpg", pos: "50% 35%" },
  "persian-frown": { alt: "A grey and white Persian cat with a stern frown", author: "Si Griffiths", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Thoughtful_Persian_Cat.jpg", pos: "45% 30%" },
  "tabby-sideeye": { alt: "A tabby cat lounging, giving a suspicious side-eye", author: "Texas Lane", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Black_Shorthaired_Tabby_Cat.jpg", pos: "55% 15%" },
  "tabby-annoyed": { alt: "A tabby cat glaring down, clearly annoyed", author: "", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:Tabby-cat.jpg", pos: "60% 50%" },
  "corgi-snow": { alt: "A corgi bounding happily through the snow", author: "Cmalaspina", license: "Public domain", licenseUrl: "", source: "https://commons.wikimedia.org/wiki/File:CorgiRunning.jpg", pos: "40% 55%" },
  "kitten-down": { alt: "A kitten on a sofa, looking down", author: "Gugalcrom123", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Curious_European_tabby_cat.jpg", pos: "50% 60%" },
} satisfies Record<string, Photo>;

export type PhotoId = keyof typeof PHOTOS;

export const photo = (id: PhotoId): Photo => PHOTOS[id];

export const photoSrc = (id: PhotoId) => `/critters/${id}.jpg`;

/** Attribution is required for CC BY / BY-SA; CC0 and public domain need none. */
export const needsCredit = (p: Photo) => /^CC BY/i.test(p.license);

export const FEELING_PHOTOS: Record<Feeling, PhotoId[]> = {
  tired: ["koala-yawn", "kitten-yawn", "dog-nap"],
  sad: ["seal-pup", "puppy-sand", "basset-bench"],
  wronged: ["cone-dog", "puppy-sand", "basset-pup"],
  jealous: ["tabby-sideeye", "tabby-annoyed", "manul-log"],
  regret: ["guilty-dog", "kitten-down", "shepherd-chin"],
  dejected: ["shepherd-chin", "lab-couch", "pom-flat"],
  forlorn: ["seal-alone", "dog-snow", "lab-couch"],
  lonely: ["lab-couch", "seal-alone", "basset-bench"],
  indignant: ["persian-frown", "manul-log", "tabby-annoyed"],
  furious: ["persian-frown", "persian-grump"],
  scared: ["kitten-blanket", "redpanda-peek"],
  anxious: ["kitten-leaves", "redpanda-peek", "meerkat-stare"],
  on_edge: ["meerkat-stare", "kitten-leaves", "redpanda-peek"],
  shocked: ["kitten-shock", "siamese-flehmen"],
  stunned: ["capybara-front", "hamster-stand", "seal-pup"],
  surprised: ["redpanda-curious", "husky-pup", "persian-white"],
  baffled: ["pom-tilt", "husky-pup", "redpanda-branch"],
  confused: ["panda-cub", "quokka-look", "dog-snow"],
  disgusted: ["siamese-flehmen", "tabby-flehmen", "redpanda-tongue"],
  overwhelmed: ["hamster-flat", "capybara-tray", "pom-flat"],
  torn: ["basset-flower", "persian-white", "redpanda-rope"],
  wistful: ["persian-white", "basset-flower", "redpanda-rope"],
  bored: ["capybara-tray", "redpanda-rope", "shiba-carrier"],
  relieved: ["fold-eyesclosed", "otter-float", "quokka-hold"],
  calm: ["capybara-front", "capybara-stand", "otter-float"],
  relaxed: ["capybara-tray", "panda-log", "fold-eyesclosed"],
  happy: ["samoyed-smile", "shiba-smile", "shiba-squint"],
  elated: ["corgi-snow", "papillon-run", "sheepdog-run"],
  mixed: ["capybara-stand", "persian-grump", "manul-log"],
};

/** Default photo for a feeling. */
export function defaultPhoto(feeling: Feeling): PhotoId {
  return FEELING_PHOTOS[feeling][0];
}

/** Next photo for the same feeling, used by "Another photo". */
export function nextPhoto(feeling: Feeling, current: PhotoId): PhotoId {
  const list = FEELING_PHOTOS[feeling];
  const i = list.indexOf(current);
  return list[(i + 1) % list.length];
}
