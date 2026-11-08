// Scene id → art + motion. Scenes without art yet fall back to the neutral one.

import { NEUTRAL_SCENE, type SceneId } from "@/lib/story/scenes";
import type { SceneArt } from "./kit";
import { brainLogoff } from "./scenes/brainLogoff";
import { calendarAttack } from "./scenes/calendarAttack";
import { canStartle } from "./scenes/canStartle";
import { catFlatten } from "./scenes/catFlatten";
import { dndBlanket } from "./scenes/dndBlanket";
import { emailClose } from "./scenes/emailClose";
import { emailSent } from "./scenes/emailSent";
import { everythingFine } from "./scenes/everythingFine";
import { filesDouble } from "./scenes/filesDouble";
import { kiddingMe } from "./scenes/kiddingMe";
import { lifeTogether } from "./scenes/lifeTogether";
import { messageArrives } from "./scenes/messageArrives";
import { neutralSurprise } from "./scenes/neutralSurprise";
import { oneMoreMeeting } from "./scenes/oneMoreMeeting";
import { peekHello } from "./scenes/peekHello";
import { penguinHug } from "./scenes/penguinHug";
import { peoplePillow } from "./scenes/peoplePillow";
import { survivedMonday } from "./scenes/survivedMonday";
import { todoGrows } from "./scenes/todoGrows";
import { upsideMap } from "./scenes/upsideMap";
import { vacationSuitcase } from "./scenes/vacationSuitcase";
import { waitingPhone } from "./scenes/waitingPhone";
import { whatIf } from "./scenes/whatIf";

export const SCENE_ART: Partial<Record<SceneId, SceneArt>> = {
  brain_logoff: brainLogoff,
  calendar_attack: calendarAttack,
  can_startle: canStartle,
  cat_flatten: catFlatten,
  dnd_blanket: dndBlanket,
  email_close: emailClose,
  email_sent: emailSent,
  everything_fine: everythingFine,
  files_double: filesDouble,
  kidding_me: kiddingMe,
  life_together: lifeTogether,
  message_arrives: messageArrives,
  neutral_surprise: neutralSurprise,
  one_more_meeting: oneMoreMeeting,
  peek_hello: peekHello,
  penguin_hug: penguinHug,
  people_pillow: peoplePillow,
  survived_monday: survivedMonday,
  todo_grows: todoGrows,
  upside_map: upsideMap,
  vacation_suitcase: vacationSuitcase,
  waiting_phone: waitingPhone,
  what_if: whatIf,
};

export const hasArt = (id: SceneId) => id in SCENE_ART;
export const sceneArt = (id: SceneId): SceneArt => SCENE_ART[id] ?? SCENE_ART[NEUTRAL_SCENE]!;
