import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, Check, Share, MoreVertical, Plus } from 'lucide-react';

const Install: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="container max-w-2xl py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
          <Smartphone className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold">Install Bongo Old Skool</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Get the full app experience on your phone. Works offline, loads instantly, and feels like a native app.
        </p>
      </div>

      {isInstalled ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold">Already Installed!</h2>
          <p className="text-muted-foreground">Bongo Old Skool is installed on your device. Open it from your home screen.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Direct install button for supported browsers */}
          {deferredPrompt && (
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
              <h2 className="text-xl font-semibold">Quick Install</h2>
              <Button size="lg" onClick={handleInstall} className="gap-2">
                <Download className="h-5 w-5" /> Install App
              </Button>
            </div>
          )}

          {/* iOS Instructions */}
          {isIOS && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> Install on iPhone/iPad
              </h2>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">1</span>
                  <span>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">2</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="inline h-4 w-4" /></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">3</span>
                  <span>Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>
            </div>
          )}

          {/* Android Instructions */}
          {isAndroid && !deferredPrompt && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> Install on Android
              </h2>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">1</span>
                  <span>Tap the <MoreVertical className="inline h-4 w-4" /> menu in Chrome</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">2</span>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">3</span>
                  <span>Tap <strong>"Install"</strong> to confirm</span>
                </li>
              </ol>
            </div>
          )}

          {/* Desktop Instructions */}
          {!isIOS && !isAndroid && !deferredPrompt && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" /> Install on Desktop
              </h2>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">1</span>
                  <span>Look for the install icon <Download className="inline h-4 w-4" /> in the browser address bar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">2</span>
                  <span>Click <strong>"Install"</strong> to add it to your desktop</span>
                </li>
              </ol>
            </div>
          )}

          {/* Features */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Why Install?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '⚡', title: 'Instant Loading', desc: 'Opens in under a second' },
                { icon: '📱', title: 'Full Screen', desc: 'No browser bars, feels native' },
                { icon: '🔔', title: 'Home Screen', desc: 'Quick access from your phone' },
                { icon: '🎵', title: 'All Features', desc: 'Stream, earn, and create shorts' },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Install;
