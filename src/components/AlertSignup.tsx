import React, { useState } from 'react';
import { Mail, CheckCircle2, BellRing, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AlertSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setSubscribed(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <section className="bg-[#B5C7EB] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border-3.5 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[7px_7px_0px_#1E293B] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Decorative Badge & Title */}
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-2xl bg-[#FEE440] border-3 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_#1E293B] shrink-0 rotate-3">
            <BellRing className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00E676] text-emerald-950 font-peachy text-xs font-bold border border-slate-900 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Real-Time Alert Feed</span>
            </div>
            <h3 className="font-peachy text-2xl sm:text-3xl font-extrabold text-slate-900">
              Get anomaly alerts in your inbox
            </h3>
            <p className="font-body text-xs sm:text-sm text-slate-600">
              Receive automated GPS coordinates & ghost net hazard reports whenever AUVs trigger &gt;90% confidence matches.
            </p>
          </div>
        </div>

        {/* Form Input / Success State */}
        <div className="w-full md:w-auto shrink-0">
          {subscribed ? (
            <div className="bg-[#00E676] text-emerald-950 px-6 py-3.5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] font-peachy font-bold text-base flex items-center gap-2.5 animate-bounce">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              <span>Alerts Activated! Welcome aboard.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="oceanographer@marine.org"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2.5 border-slate-900 rounded-2xl font-body text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#305CDE] shadow-[2px_2px_0px_#1E293B]"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto font-peachy font-extrabold text-base bg-[#305CDE] hover:bg-[#2D68C4] text-white px-6 py-3 rounded-2xl border-2.5 border-slate-900 shadow-[3px_3px_0px_#1E293B] hover:shadow-[5px_5px_0px_#1E293B] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
