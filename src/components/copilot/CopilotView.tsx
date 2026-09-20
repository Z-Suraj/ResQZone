import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  ChevronRight, 
  ShieldAlert, 
  MapPin,
  Clock,
  Database,
  Radio,
  SlidersHorizontal,
  ExternalLink,
  Layers
} from 'lucide-react';
import { queryCopilot, getCopilotGroundingContext, CopilotResponse } from '../../services/copilotService';
import { emergencyStore } from '../../services/emergencyStore';
import { getLatestSimulationResult } from '../../services/simulationEngine';
import { IMAGES } from '../../data/assets';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';

interface CopilotViewProps {
  onNavigateTab: (tab: string) => void;
  darkMode: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  response?: CopilotResponse;
}

export const CopilotView: React.FC<CopilotViewProps> = ({ onNavigateTab, darkMode }) => {
  const [grounding, setGrounding] = useState(getCopilotGroundingContext());
  const [latestSim, setLatestSim] = useState(() => getLatestSimulationResult());

  const [messages, setMessages] = useState<Message[]>(() => {
    const ctx = getCopilotGroundingContext();
    return [
      {
        id: 'm-initial',
        sender: 'assistant',
        text: `Greetings Commander. I am **ResQZone AI Copilot**, your conversational operational intelligence assistant for **${ctx.locationName}**.

I am grounded in live CWC hydrological sensors, Census demographics, GIS hazard polygons, active citizen incident reports, and emergency shelter carrying capacities.

Ask me anything regarding the current situation in **${ctx.locationName}**, or pick from the operational questions below.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to location & emergencyStore changes
  useEffect(() => {
    return emergencyStore.subscribe(() => {
      const newCtx = getCopilotGroundingContext();
      setGrounding(newCtx);
      setLatestSim(getLatestSimulationResult());
    });
  }, []);

  const standardQuestions = [
    'What is happening in this location?',
    'Which areas are at risk?',
    'How many people/habitations are affected?',
    'Which incidents are active?',
    'Which safe zones have capacity?',
    'What response action is currently pending?',
    'Why is this area marked high/critical risk?',
    'What should Authority investigate next?',
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      const copilotResult = queryCopilot(query);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: copilotResult.answer,
        response: copilotResult,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 400);
  };

  const handleCardAction = (actionType?: string, targetId?: string) => {
    if (!actionType) return;
    if (actionType === 'NAVIGATE_RELOCATION') {
      onNavigateTab('relocation');
    } else if (actionType === 'NAVIGATE_CAPACITY') {
      onNavigateTab('capacity');
    } else if (actionType === 'NAVIGATE_MAP') {
      onNavigateTab('map');
    } else if (actionType === 'NAVIGATE_INCIDENTS') {
      onNavigateTab('incidents');
    } else if (actionType === 'NAVIGATE_WHAT_IF') {
      onNavigateTab('whatif');
    } else if (actionType === 'NAVIGATE_DASHBOARD') {
      onNavigateTab('dashboard');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.copilot}
        darkMode={darkMode}
        alt="AI Copilot Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-5 max-w-5xl w-full mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-semibold mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI COPILOT &bull; SITUATIONAL INTELLIGENCE</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Operational AI Copilot
            </h1>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Conversational operational guidance grounded in current map data, habitations, active incidents, and safe capacity.
            </p>
          </div>

          {/* Location Badge */}
          <div className={`px-4 py-2.5 rounded-2xl border text-xs flex items-center gap-3 backdrop-blur-md ${
            darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700 shadow-xs'
          }`}>
            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <div className={`font-bold font-mono text-[11px] truncate max-w-[200px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {grounding.locationName}
              </div>
              <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {grounding.coordinates[0].toFixed(2)}°N, {grounding.coordinates[1].toFixed(2)}°E &bull; {grounding.weatherWarning} Warning
              </div>
            </div>
          </div>
        </div>

        {/* Live Grounding Bar */}
        <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          darkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Grounding Context:</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">{grounding.habitationsCount} Habitations</span>
            <span>&bull;</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{grounding.hazardsCount} Hazards</span>
            <span>&bull;</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{grounding.safeZonesCount} Safe Zones</span>
            <span>&bull;</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">{grounding.activeIncidentsCount} Incidents</span>
          </div>

          <div className={`flex items-center gap-3 font-mono text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              Source: {grounding.source}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className={`w-3 h-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              {grounding.lastUpdated}
            </span>
          </div>
        </div>

        {/* Simulation Sandbox Notice (if simulation was run) */}
        {latestSim && (
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            darkMode ? 'bg-purple-950/30 border-purple-800/60 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Latest Simulation Available:</strong> "{latestSim.scenarioTitle}" simulated at {latestSim.runAt} for {latestSim.locationName}.
              </span>
            </div>
            <button
              onClick={() => handleSend('Explain the latest simulation run')}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Explain Scenario Impact
            </button>
          </div>
        )}

        {/* Suggested Quick Question Pills */}
        <div className="space-y-1.5">
          <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <HelpCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Suggested Operational Inquiries:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {standardQuestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                  darkMode
                    ? 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500/60 hover:bg-slate-800/90'
                    : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Conversational Stream Container */}
        <div className={`rounded-2xl border p-4 sm:p-6 flex flex-col h-[520px] ${
          darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
        }`}>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-950/30 font-medium'
                      : darkMode
                        ? 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className={`whitespace-pre-line prose prose-xs max-w-none ${darkMode ? 'prose-invert' : 'text-slate-800'}`}>
                    {msg.text}
                  </div>

                  {/* Operational Cards */}
                  {msg.response?.cards && msg.response.cards.length > 0 && (
                    <div className={`space-y-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {msg.response.cards.map((card, cIdx) => (
                        <div key={cIdx} className={`p-3 rounded-xl border space-y-2.5 ${
                          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {card.title}
                            </span>
                            {card.badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                                card.badgeColor === 'red'
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : card.badgeColor === 'green'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : card.badgeColor === 'orange'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              }`}>
                                {card.badge}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            {card.metrics.map((m, mIdx) => (
                              <div key={mIdx} className={`p-1.5 rounded-lg border ${
                                darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div className={darkMode ? 'text-slate-400 text-[10px]' : 'text-slate-500 text-[10px]'}>{m.label}</div>
                                <div className={`font-bold font-mono ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{m.value}</div>
                              </div>
                            ))}
                          </div>

                          <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {card.summary}
                          </div>

                          {card.actionText && (
                            <button
                              onClick={() => handleCardAction(card.actionType, card.targetId)}
                              className={`w-full py-1.5 text-center rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                                darkMode 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-cyan-700'
                              }`}
                            >
                              <span>{card.actionText}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Prompts */}
                  {msg.response?.suggestedFollowUps && msg.response.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.response.suggestedFollowUps.map((fu, fuIdx) => (
                        <button
                          key={fuIdx}
                          onClick={() => handleSend(fu)}
                          className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            darkMode 
                              ? 'bg-slate-900 border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-400' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          &rarr; {fu}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] opacity-60 mt-1 font-mono text-right">{msg.time}</div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className={`border p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Cross-referencing {grounding.locationName} GIS coordinates and live sensors...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`mt-4 pt-3 border-t flex items-center gap-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
          >
            <input
              type="text"
              placeholder={`Ask Copilot about ${grounding.locationName} (e.g. Which areas are at risk?, Safe zones capacity?)...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 ${
                darkMode 
                  ? 'bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-cyan-950/30 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
