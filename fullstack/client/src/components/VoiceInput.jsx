import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, Square } from 'lucide-react';

// Global voice-input affordance: floats a mic button over whichever text field
// is focused, and dictates speech into it via the Web Speech API. Works on every
// <input> / <textarea> in the app without touching individual fields.

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

const isEditable = (el) => {
  if (!el) return false;
  if (el.disabled || el.readOnly) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    const t = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'email', 'url', 'tel', 'number', ''].includes(t);
  }
  return false;
};

// Set a controlled input's value the way React expects, so onChange handlers fire.
function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter ? setter.call(el, value) : (el.value = value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export default function VoiceInput() {
  const [target, setTarget] = useState(null);
  const [rect, setRect] = useState(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  // Track the focused text field.
  useEffect(() => {
    if (!SR) return;
    const onFocusIn = (e) => { if (isEditable(e.target)) setTarget(e.target); };
    const onFocusOut = () => setTimeout(() => {
      if (!isEditable(document.activeElement)) { setTarget(null); recRef.current?.stop(); }
    }, 150);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Keep the mic glued to the field on scroll / resize.
  useEffect(() => {
    if (!target) { setRect(null); return; }
    const update = () => setRect(target.getBoundingClientRect());
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [target]);

  const start = () => {
    if (!target || !SR) return;
    const el = target;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    const baseVal = el.value;
    const startPos = el.selectionStart ?? baseVal.length;
    const endPos = el.selectionEnd ?? baseVal.length;
    let finalText = '';
    rec.onresult = (ev) => {
      let interim = '', fin = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript;
      }
      finalText += fin;
      const before = baseVal.slice(0, startPos);
      const after = baseVal.slice(endPos);
      const sep = before && !/\s$/.test(before) ? ' ' : '';
      const spoken = (finalText + interim);
      setNativeValue(el, before + sep + spoken + after);
      const pos = (before + sep + spoken).length;
      try { el.setSelectionRange(pos, pos); } catch { /* number inputs etc. */ }
    };
    rec.onend = () => { setListening(false); recRef.current = null; };
    rec.onerror = () => { setListening(false); recRef.current = null; };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  // mousedown (not click) so the field keeps focus while we toggle.
  const toggle = (e) => {
    e.preventDefault();
    if (listening) { recRef.current?.stop(); setListening(false); }
    else start();
  };

  if (!SR || !target || !rect) return null;
  return createPortal(
    <button
      type="button"
      className={`voice-mic ${listening ? 'on' : ''}`}
      style={{ top: rect.top + rect.height / 2 - 12, left: rect.right - 32 }}
      title={listening ? 'Stop dictation' : 'Voice input'}
      onMouseDown={toggle}>
      {listening ? <Square size={13} style={{ fill: 'currentColor' }} /> : <Mic size={15} />}
    </button>,
    document.body,
  );
}
