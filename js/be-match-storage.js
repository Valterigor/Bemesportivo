(() => {
  const memory = new Map();
  let native = null;
  try {
    native = window.localStorage;
    const probe = '__be_match_storage_probe__';
    native.setItem(probe, '1');
    native.removeItem(probe);
  } catch { native = null; }
  window.BeMatchStorage = {
    getItem(key) {
      try { if (native) return native.getItem(key); } catch { native = null; }
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      const text = String(value);
      memory.set(key, text);
      try { native?.setItem(key, text); } catch { native = null; }
    },
    removeItem(key) {
      memory.delete(key);
      try { native?.removeItem(key); } catch { native = null; }
    },
    get persistent() { return Boolean(native); }
  };
})();
