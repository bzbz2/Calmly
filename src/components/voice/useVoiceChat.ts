"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/critter/catalog";
import { detectLang } from "@/lib/critter/match";
import { SPEECH_LANG, chunkForSpeech, cleanForSpeech, pickVoice } from "@/lib/voice";

// Hands-free voice chat on the browser's built-in Web Speech APIs (free, no keys):
//   Talk -> listen until the user has finished (a ~2s pause, or they tap Done)
//   -> send transcript -> speak the reply -> listen again
// until End. Recognition is off while Calmly speaks, so it never hears itself.
// Language is automatic: the caller passes the user's language (from what they last
// said or typed, else the browser's). If a turn comes back unclear, the next turn
// listens in the other language.
// Note: in Chrome/Edge, speech recognition audio is processed by the browser vendor's
// speech service; synthesis uses voices installed on the device.

export type VoicePhase = "off" | "listening" | "thinking" | "speaking";

// Minimal typings: SpeechRecognition isn't in every TS DOM lib, and Chrome/Safari prefix it.
type RecResultList = { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string; confidence: number } } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: RecResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** After this many silent listens in a row (~8s each), voice mode pauses itself. */
const MAX_SILENT_TURNS = 6;
/** The user is done when they've been quiet this long after speaking. Short pauses mid-sentence don't count. */
export const END_OF_SPEECH_MS = 2200;
/** Below this the recognizer probably heard the other language. 0 means "not reported". */
const LOW_CONFIDENCE = 0.35;

const other = (l: Lang): Lang => (l === "en" ? "zh" : "en");

export function useVoiceChat({ lang, onUtterance }: { lang: Lang; onUtterance: (text: string) => Promise<string | null> }) {
  const [phase, setPhase] = useState<VoicePhase>("off");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [supported, setSupported] = useState({ stt: false, tts: false });
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const activeRef = useRef(false);
  const recRef = useRef<Recognition | null>(null);
  const silentRef = useRef(0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const langRef = useRef(lang);
  // Set when a turn came back unclear: listen in the other language until the caller's language catches up.
  const switchedRef = useRef<{ from: Lang; to: Lang } | null>(null);
  const retriedRef = useRef(false); // ask again at most once per utterance
  const onUtteranceRef = useRef(onUtterance);
  useEffect(() => {
    langRef.current = lang;
    onUtteranceRef.current = onUtterance;
    if (switchedRef.current && switchedRef.current.from !== lang) switchedRef.current = null;
  });
  const listenLang = () => switchedRef.current?.to ?? langRef.current;

  // Feature detection runs on the client only (avoids hydration mismatches).
  useEffect(() => {
    const tts = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported({ stt: !!recognitionCtor(), tts });
    if (!tts) return;
    const load = () => (voicesRef.current = window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  /** Speak text; resolves when finished or cancelled. Language follows the text itself. */
  const speak = useCallback((text: string): Promise<void> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const chunks = chunkForSpeech(cleanForSpeech(text));
    if (!chunks.length) return Promise.resolve();
    const l = detectLang(text);
    const voice = pickVoice(voicesRef.current, l);
    setSpeakingText(text);
    return new Promise((resolve) => {
      let left = chunks.length;
      const done = () => {
        if (--left > 0) return;
        setSpeakingText((t) => (t === text ? null : t));
        resolve();
      };
      for (const c of chunks) {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = SPEECH_LANG[l];
        if (voice) u.voice = voice;
        u.rate = 1;
        u.onend = done;
        u.onerror = done; // "interrupted"/"canceled" also land here
        synth.speak(u);
      }
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingText(null);
  }, []);

  const silenceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const end = useCallback(() => {
    activeRef.current = false;
    clearTimeout(silenceTimer.current);
    recRef.current?.abort();
    recRef.current = null;
    stopSpeaking();
    setInterim("");
    setNotice("");
    setPhase("off");
  }, [stopSpeaking]);

  /** The user tapped Done: stop listening now and send what they said. */
  const finish = useCallback(() => {
    clearTimeout(silenceTimer.current);
    recRef.current?.stop();
  }, []);

  const listen = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!activeRef.current || !Ctor) return;
    const rec = new Ctor();
    const turnLang = listenLang();
    rec.lang = SPEECH_LANG[turnLang];
    rec.interimResults = true;
    // Keep listening through short pauses; the turn ends after END_OF_SPEECH_MS of quiet or on Done.
    rec.continuous = true;
    rec.maxAlternatives = 1;
    let finalText = "";
    let partial = "";
    const confidences: number[] = [];

    rec.onresult = (e) => {
      partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
          if (r[0].confidence > 0) confidences.push(r[0].confidence);
        } else partial += r[0].transcript;
      }
      setInterim((finalText + partial).trim());
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => rec.stop(), END_OF_SPEECH_MS);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access is blocked. Allow it in your browser's site settings, then try Talk again.");
        end();
      } else if (e.error === "network") {
        setError("The browser's speech service is unreachable. Check your connection, or type instead.");
        end();
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Voice input error: ${e.error}`);
      }
    };
    rec.onend = async () => {
      clearTimeout(silenceTimer.current);
      recRef.current = null;
      if (!activeRef.current) return;
      // A stop() can land before the last words are finalized; keep them.
      const text = (finalText + partial).trim();
      setInterim("");
      if (!text) {
        if (++silentRef.current >= MAX_SILENT_TURNS) {
          setError("Voice chat paused after a quiet minute. Tap Talk to continue.");
          end();
        } else listen();
        return;
      }
      silentRef.current = 0;
      // Unclear in this language? Probably the other one: ask again and listen in that language.
      const avg = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 1;
      if (avg < LOW_CONFIDENCE && detectLang(text) === turnLang && !retriedRef.current) {
        retriedRef.current = true;
        const to = other(turnLang);
        switchedRef.current = { from: langRef.current, to };
        setNotice(to === "zh" ? "没听清，换成中文再听一次，请再说一遍。" : "Didn't catch that. Listening in English now, please say it again.");
        listen();
        return;
      }
      retriedRef.current = false;
      setNotice("");
      setPhase("thinking");
      const reply = await onUtteranceRef.current(text);
      if (!activeRef.current) return;
      if (reply) {
        setPhase("speaking");
        await speak(reply);
      }
      if (activeRef.current) {
        setPhase("listening");
        listen();
      }
    };

    recRef.current = rec;
    setPhase("listening");
    try {
      rec.start();
    } catch {
      // start() throws if a previous session is still closing; retry shortly.
      setTimeout(() => activeRef.current && listen(), 250);
    }
  }, [end, speak]);

  const start = useCallback(() => {
    if (!recognitionCtor()) {
      setError("Voice input isn't supported in this browser. Try Chrome, Edge or Safari, or type instead.");
      return;
    }
    setError("");
    stopSpeaking();
    silentRef.current = 0;
    activeRef.current = true;
    listen();
  }, [listen, stopSpeaking]);

  /** While Calmly is speaking: stop talking and go straight back to listening. */
  const skip = useCallback(() => stopSpeaking(), [stopSpeaking]);

  useEffect(() => () => end(), [end]);

  return { supported, phase, interim, error, setError, notice, start, finish, end, skip, speak, stopSpeaking, speakingText };
}
