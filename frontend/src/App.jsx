
import React, { useState, useRef, useEffect, useCallback } from "react";
import { fetchAnswer } from "./api";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [micStatus, setMicStatus] = useState("");
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const autoSubmitTimeoutRef = useRef(null);
  const manuallyStoppedRef = useRef(false);
  const speechDetectedRef = useRef(false);
  const accumulatedFinalRef = useRef("");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, finalTranscript, interimTranscript, scrollToBottom]);

  // Normalize spoken text to math expressions - supports multiple languages
  const normalizeTranscript = useCallback((text) => {
    if (!text) return "";
    
    let normalized = text.toLowerCase().trim();
    
    // English numbers 0-100
    const numberMap = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
      'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
      'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
      'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
      'eighty': '80', 'ninety': '90'
    };
    
    Object.entries(numberMap).forEach(([word, num]) => {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), num);
    });
    
    // Spanish numbers
    const spanishNumbers = {
      'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
      'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10'
    };
    Object.entries(spanishNumbers).forEach(([word, num]) => {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), num);
    });
    
    // Math operations - multiple languages
    normalized = normalized
      .replace(/\bplus\b|\badd\b|\bmás\b|\bmas\b/gi, '+')
      .replace(/\bminus\b|\bsubtract\b|\bmenos\b/gi, '-')
      .replace(/\btimes\b|\bmultiply\b|\bmultiplied by\b|\binto\b|\bpor\b|\bfois\b/gi, '*')
      .replace(/\bdivided by\b|\bdivide\b|\bdivide by\b|\bentre\b|\bdivisé par\b/gi, '/')
      .replace(/\bequals\b|\bequal\b|\bis\b|\bequal to\b|\bigual\b/gi, '=')
      .replace(/\s+/g, ' ')
      .replace(/\s*([+\-*/=])\s*/g, '$1')
      .trim();
    
    return normalized;
  }, []);

  // Auto-submit when user stops speaking
  const scheduleAutoSubmit = useCallback((text) => {
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    
    autoSubmitTimeoutRef.current = setTimeout(() => {
      if (text.trim() && !loading) {
        const normalized = normalizeTranscript(text);
        if (normalized) {
          setInput(normalized);
          handleSend(null, normalized);
        }
      }
    }, 1000);
  }, [loading, normalizeTranscript]);

  const handleSend = useCallback(async (e, textToSend = null) => {
    e?.preventDefault();
    const messageToSend = (textToSend || input).trim();
    if (!messageToSend || loading) return;

    setInput("");
    setInterimTranscript("");
    setFinalTranscript("");
    accumulatedFinalRef.current = "";
    
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    
    setMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    setLoading(true);

    try {
      const res = await fetchAnswer(messageToSend);
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Error: ${e.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey && !isListening) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isListening]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
        setFinalTranscript("");
        accumulatedFinalRef.current = "";
        setInput("");
        speechDetectedRef.current = false;
        setMicStatus("🎤 Listening...");
        
        navigator.mediaDevices?.getUserMedia({ audio: true })
          .then((stream) => {
            setMicStatus("✅ Ready - Speak now!");
            stream.getTracks().forEach(track => {
              console.log('Mic track:', track.label, 'enabled:', track.enabled);
            });
          })
          .catch((err) => {
            console.error('Microphone error:', err);
            setMicStatus("❌ Microphone access needed");
          });
      };
      
      recognition.onresult = (event) => {
        speechDetectedRef.current = true;
        
        let newFinal = accumulatedFinalRef.current;
        let interim = "";
        
        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          
          if (result.isFinal) {
            newFinal += (newFinal ? " " : "") + transcript;
          } else {
            interim = transcript;
          }
        }
        
        // Update accumulated final
        accumulatedFinalRef.current = newFinal;
        
        // Update state immediately for fast display
        setFinalTranscript(newFinal);
        setInterimTranscript(interim);
        
        // Update input field
        const displayText = (newFinal + (interim ? " " + interim : "")).trim();
        if (displayText) {
          setInput(displayText);
        }
        
        // Schedule auto-submit
        if (newFinal) {
          const normalized = normalizeTranscript(newFinal);
          if (normalized) {
            scheduleAutoSubmit(normalized);
          }
        }
      };
      
      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          if (speechDetectedRef.current) {
            setMicStatus("✅ Listening for more...");
          }
        } else if (event.error === 'not-allowed') {
          setIsListening(false);
          manuallyStoppedRef.current = false;
          setMicStatus("❌ Permission denied");
          alert('🔒 Microphone permission required!\n\nPlease allow microphone access and refresh the page.');
        } else if (event.error === 'audio-capture') {
          setIsListening(false);
          setMicStatus("❌ No microphone");
          alert('❌ No microphone detected. Please connect a microphone.');
        } else if (event.error !== 'aborted') {
          console.error('Recognition error:', event.error);
        }
      };
      
      recognition.onend = () => {
        if (!manuallyStoppedRef.current && recognitionRef.current === recognition) {
          setTimeout(() => {
            if (!manuallyStoppedRef.current && recognitionRef.current === recognition) {
              try {
                recognition.start();
              } catch (e) {
                if (e.name !== 'InvalidStateError') {
                  setIsListening(false);
                }
              }
            }
          }, 100);
        } else {
          manuallyStoppedRef.current = false;
          setIsListening(false);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [normalizeTranscript, scheduleAutoSubmit]);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      manuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      setMicStatus("");
      
      const toSubmit = finalTranscript.trim() || interimTranscript.trim();
      if (toSubmit) {
        const normalized = normalizeTranscript(toSubmit);
        if (normalized) {
          handleSend(null, normalized);
        } else {
          handleSend(null, toSubmit);
        }
      }
      
      setInterimTranscript("");
      setFinalTranscript("");
      accumulatedFinalRef.current = "";
    } else {
      manuallyStoppedRef.current = false;
      speechDetectedRef.current = false;
      
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setInput("");
        setInterimTranscript("");
        setFinalTranscript("");
        accumulatedFinalRef.current = "";
        recognitionRef.current.start();
      } catch (err) {
        alert('🔒 Microphone access required! Please allow microphone access and try again.');
      }
    }
  }, [isListening, finalTranscript, interimTranscript, normalizeTranscript, handleSend]);

  const displayText = finalTranscript || interimTranscript || "";

  return (
    <div className="flex flex-col h-screen bg-[#f7f7f8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">NumeriAI</h1>
              <p className="text-xs text-gray-500">Mathematical Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">N</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to NumeriAI
              </h2>
              <p className="text-gray-600 max-w-md mb-6">
                I can solve math problems! Try speaking or typing a question.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["2+3", "10×5", "100-25", "50÷2"].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors shadow-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-br-md"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {/* Live transcription while speaking */}
          {isListening && (
            <div className="flex justify-end animate-fadeIn">
              <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 bg-blue-400 text-white shadow-md">
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col space-y-1 pt-0.5 flex-shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      interimTranscript ? "bg-green-200 animate-pulse" : "bg-white/70 animate-pulse"
                    }`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      interimTranscript ? "bg-green-200 animate-pulse" : "bg-white/70 animate-pulse"
                    }`} style={{ animationDelay: "0.2s" }}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      interimTranscript ? "bg-green-200 animate-pulse" : "bg-white/70 animate-pulse"
                    }`} style={{ animationDelay: "0.4s" }}></div>
                  </div>
                  <div className="flex-1 min-h-[20px]">
                    {displayText ? (
                      <>
                        <div className="font-medium text-base leading-relaxed">
                          {finalTranscript}
                          {interimTranscript && (
                            <span className="opacity-90">
                              {" "}{interimTranscript}
                              <span className="inline-block w-0.5 h-4 bg-white ml-1 align-middle animate-blink">|</span>
                            </span>
                          )}
                        </div>
                        {interimTranscript && (
                          <div className="text-xs opacity-70 mt-1.5 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-200 rounded-full mr-1.5 animate-pulse"></span>
                            Listening...
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm opacity-90">
                        🎤 Listening... Speak your question
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={isListening ? displayText : input}
                onChange={(e) => !isListening && setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Message NumeriAI..."}
                rows={1}
                className={`w-full px-4 py-3 pr-12 border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto transition-colors ${
                  isListening 
                    ? "border-red-300 bg-red-50/50" 
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
                style={{ minHeight: "52px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                readOnly={isListening}
              />
              {isListening && (
                <div className="absolute right-4 top-3 pointer-events-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              )}
            </div>
            
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                className={`px-4 py-3 rounded-2xl transition-all ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                {isListening ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}
            
            <button
              type="submit"
              disabled={!input.trim() || loading || isListening}
              className={`px-4 py-3 rounded-2xl transition-all ${
                input.trim() && !loading && !isListening
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          
          {micStatus && (
            <div className="mt-2 text-center">
              <p className={`text-xs font-medium ${
                micStatus.includes('✅') ? 'text-green-600' : 
                micStatus.includes('❌') ? 'text-red-600' : 
                'text-blue-600'
              }`}>
                {micStatus}
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-400 text-center mt-2">
            Click the microphone to speak, or type your math question
          </p>
        </div>
      </div>
    </div>
  );
}
