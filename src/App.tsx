import React, { useState, useEffect, useRef } from 'react';
import { Radio, Send, Volume2, Settings, Disc, Skull } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const synth = window.speechSynthesis;

  useEffect(() => {
    const savedVoice = localStorage.getItem('selectedVoice');
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }

    const loadVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
      
      if (!savedVoice && voices.length > 0) {
        const defaultVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('feminina')
        );
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
          localStorage.setItem('selectedVoice', defaultVoice.name);
        } else {
          setSelectedVoice(voices[0].name);
          localStorage.setItem('selectedVoice', voices[0].name);
        }
      }
    };

    loadVoices();
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      handleInitialGreeting();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    localStorage.setItem('selectedVoice', voiceName);
    setShowVoiceSettings(false);
  };

  const handleInitialGreeting = async () => {
    const greeting = "Olá! Eu sou BAI VOZ, sua locutora virtual especialista em rock! Estou aqui para conversar sobre música, especialmente sobre classic rock, hard rock e heavy metal. Como posso ajudar você hoje?";
    setConversation([{ role: 'ai', content: greeting }]);
    speakText(greeting);
  };

  const speakText = (text: string) => {
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.pitch = 1;
    utterance.rate = 1;
    
    const voice = availableVoices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    synth.speak(utterance);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are BAI VOZ, a female AI radio host specialized in rock music. Respond in Portuguese, focusing on rock music, especially classic rock, hard rock, and heavy metal. Current user message: ${userMessage}`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      setConversation(prev => [...prev, { role: 'ai', content: aiResponse }]);
      speakText(aiResponse);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = "Desculpe, estou tendo problemas técnicos no momento. Pode tentar novamente?";
      setConversation(prev => [...prev, { role: 'ai', content: errorMessage }]);
      speakText(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 noise"></div>
        <div className="text-center z-10">
          <div className="relative">
            <Skull className="w-24 h-24 text-white mx-auto mb-8 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Disc className="w-16 h-16 text-white animate-spin" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wider">RÁDIO TATUAPÉ FM</h1>
          <p className="text-zinc-400 text-lg tracking-widest uppercase">Carregando sua experiência musical...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute inset-0 noise"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Skull className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white tracking-wider">RÁDIO TATUAPÉ FM</h1>
          </div>
          <p className="text-zinc-400 text-lg tracking-widest uppercase">Sua rádio com IA</p>
          <a 
            href="https://radiotatuapefm.radiostream321.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 px-8 py-4 bg-zinc-900 text-white rounded-none font-bold text-lg shadow-lg hover:bg-zinc-800 transition-colors border border-zinc-700 group relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            <span className="relative flex items-center gap-2">
              <Disc className="w-5 h-5 animate-spin" />
              OUVIR AO VIVO
            </span>
          </a>
        </header>

        {/* Chat Interface */}
        <div className="max-w-2xl mx-auto bg-zinc-900/50 backdrop-blur-lg border border-zinc-800 p-8 shadow-2xl">
          {/* Voice Settings Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <Settings className="w-4 h-4" />
              <span>Configurar Voz</span>
            </button>
          </div>

          {/* Voice Selection Modal */}
          {showVoiceSettings && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-zinc-900 border border-zinc-800 p-6 shadow-xl max-w-md w-full m-4">
                <h3 className="text-xl font-bold mb-4 text-white">Selecionar Voz</h3>
                <div className="max-h-60 overflow-y-auto chat-container">
                  {availableVoices.map((voice) => (
                    <button
                      key={voice.name}
                      onClick={() => handleVoiceChange(voice.name)}
                      className={`w-full text-left px-4 py-2 mb-2 border ${
                        selectedVoice === voice.name
                          ? 'bg-zinc-700 text-white border-zinc-600'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {voice.name} ({voice.lang})
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowVoiceSettings(false)}
                  className="mt-4 px-4 py-2 bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-colors w-full"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          <div 
            ref={chatContainerRef}
            className="h-[400px] overflow-y-auto mb-6 space-y-4 chat-container"
          >
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Converse com a BAI VOZ..."
              className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 px-6 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700"
            />
            <button
              onClick={handleSendMessage}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 transition-colors border border-zinc-700"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-zinc-500">
          <p>© 2024 Rádio Tatuapé FM - Desenvolvido com 🤘</p>
        </footer>
      </div>
    </div>
  );
}

export default App;