import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  HelpCircle, 
  Droplets, 
  Navigation, 
  CheckSquare, 
  Camera, 
  X,
  Bot,
  User
} from 'lucide-react';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';

interface CitizenAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onNavigateTab: (tab: string) => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  actionTab?: string;
  actionLabel?: string;
}

const PRESET_QUESTIONS = [
  'What should I do during a flood?',
  'Where is my nearest safe zone?',
  'What should I pack in an evacuation bag?',
  'How do I report a disaster?',
];

export const CitizenAiAssistantModal: React.FC<CitizenAiAssistantModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Namaste! I am your ResQZone Safety Assistant. I can help guide you through immediate disaster preparedness, evacuation routes, and emergency procedures. How can I assist you right now?',
    },
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const question = textToSend || input;
    if (!question.trim()) return;

    const userMsg: Message = { sender: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Generate tailored, helpful citizen response
    setTimeout(() => {
      const qLower = question.toLowerCase();
      let aiResponse: Message;

      if (qLower.includes('flood') || qLower.includes('water')) {
        aiResponse = {
          sender: 'ai',
          text: 'During a flash flood:\n1. Immediately move to higher ground or top floor of your building.\n2. Do NOT attempt to walk or drive through moving water.\n3. Turn off electricity at the main switch.\n4. If trapped, signal from a high point and request rescue via ResQZone SOS.',
          actionTab: 'rescue',
          actionLabel: 'Request Emergency SOS',
        };
      } else if (qLower.includes('safe zone') || qLower.includes('shelter') || qLower.includes('nearest')) {
        const nearest = DEMO_SAFE_ZONES[0];
        aiResponse = {
          sender: 'ai',
          text: `Your nearest verified safe zone is "${nearest.name}", located ${nearest.distanceKm} km away. It has ${nearest.availableCapacity} beds available with drinking water, food, and SDRF medical staff ready.`,
          actionTab: 'citizen-map',
          actionLabel: 'View Safe Route on Map',
        };
      } else if (qLower.includes('pack') || qLower.includes('bag') || qLower.includes('carry')) {
        aiResponse = {
          sender: 'ai',
          text: 'In your emergency go-bag, pack:\n• Essential ID documents (Aadhaar/voter ID) in a sealed plastic pouch\n• 7-day prescription medicines\n• Flashlight with spare batteries & fully charged power bank\n• 2L bottled drinking water & dry biscuits/nuts\n• Warm woolen clothes & a whistle.',
          actionTab: 'emergency-help',
          actionLabel: 'Open Go-Bag Checklist',
        };
      } else if (qLower.includes('report') || qLower.includes('incident') || qLower.includes('hazard')) {
        aiResponse = {
          sender: 'ai',
          text: 'To report a hazard or road blockage:\n1. Open "Report Disaster"\n2. Choose the disaster category (Flood, Landslide, Rockfall)\n3. Take or attach a photo\n4. Confirm your GPS location and submit. The report goes directly to the Authority Triage Desk.',
          actionTab: 'report',
          actionLabel: 'Report Disaster Now',
        };
      } else {
        aiResponse = {
          sender: 'ai',
          text: `For your safety in the Joshimath Helang sector, please stay tuned to active emergency broadcasts. If you are in immediate danger or cut off, dial 112 or dispatch a rescue request so NDRF/SDRF can reach you.`,
          actionTab: 'rescue',
          actionLabel: 'Request Rescue (SOS)',
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl border flex flex-col h-[560px] shadow-2xl overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                ResQZone Citizen Safety Assistant
              </h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Simple, human safety Q&A • Evacuation & preparedness advice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[80%] p-3.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : darkMode
                  ? 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs'
                  : 'bg-slate-100 text-slate-900 rounded-tl-xs'
              }`}>
                {msg.text}

                {msg.actionTab && (
                  <div className="mt-3 pt-2 border-t border-slate-700/40">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab(msg.actionTab!);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{msg.actionLabel}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preset Suggestions */}
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/60 no-scrollbar">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 transition-colors ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-700/40 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a safety question (e.g., What to do in a flood?)..."
            className={`flex-1 px-3.5 py-2.5 rounded-2xl border text-xs ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          <button
            onClick={() => handleSend()}
            className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
