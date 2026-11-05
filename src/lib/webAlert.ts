import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * react-native-web ships Alert.alert as a no-op, so every confirmation and action sheet silently
 * did nothing in the browser. This installs a small DOM dialog with the same API.
 */
function showDialog(title: string, message?: string, buttons?: AlertButton[]) {
  const list: AlertButton[] = buttons && buttons.length ? buttons : [{ text: 'OK' }];
  const doc = document;
  const overlay = doc.createElement('div');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;font-family:system-ui,sans-serif';
  const box = doc.createElement('div');
  box.style.cssText = 'background:#fff;color:#111827;border-radius:16px;max-width:380px;width:100%;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.3);max-height:90vh;overflow:auto';
  const h = doc.createElement('div');
  h.textContent = title;
  h.style.cssText = 'font-size:18px;font-weight:700;margin-bottom:6px';
  box.appendChild(h);
  if (message) {
    const m = doc.createElement('div');
    m.textContent = message;
    m.style.cssText = 'font-size:14px;color:#4b5563;margin-bottom:12px;line-height:1.4';
    box.appendChild(m);
  }
  const close = () => overlay.remove();
  const cancel = list.find((b) => b.style === 'cancel');
  for (const b of list) {
    const btn = doc.createElement('button');
    btn.textContent = b.text ?? 'OK';
    const isCancel = b.style === 'cancel';
    const destructive = b.style === 'destructive';
    btn.style.cssText = `display:block;width:100%;margin-top:8px;padding:12px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;border:1px solid ${isCancel ? '#d1d5db' : 'transparent'};background:${isCancel ? '#fff' : destructive ? '#b91c1c' : '#e4002b'};color:${isCancel ? '#111827' : '#fff'}`;
    btn.onclick = () => { close(); b.onPress?.(); };
    box.appendChild(btn);
  }
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => { if (e.target === overlay && cancel) { close(); cancel.onPress?.(); } });
  doc.body.appendChild(overlay);
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => showDialog(title, message, buttons);
}
