import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { callApi, API_BASE } from '../utils/api';
import { Send, MessageSquare, Mic, Square, Volume2 } from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(() => localStorage.getItem('bankingbot_chat_session_id') || '');
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  const messagesEndRef = useRef(null);
  const recordingRef = useRef({
    audioContext: null,
    mediaStream: null,
    sourceNode: null,
    processorNode: null,
    silenceNode: null,
    chunks: [],
    sampleRate: 16000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatSessionId) localStorage.setItem('bankingbot_chat_session_id', chatSessionId);
  }, [chatSessionId]);

  useEffect(() => {
    const canRecord = Boolean(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext));
    setVoiceSupported(canRecord);
    setSpeechSupported(typeof window !== 'undefined' && Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance));
    
    return () => {
      const recorder = recordingRef.current;
      if (recorder.mediaStream) recorder.mediaStream.getTracks().forEach(t => t.stop());
      if (recorder.audioContext) recorder.audioContext.close().catch(() => {});
    };
  }, []);

  const sendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const userText = textOverride !== null ? textOverride : input.trim();
    if (!userText || loading || isTranscribing) return;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const data = await callApi('/chat', { message: userText, session_id: chatSessionId }, token);
      if (data.session_id) setChatSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'bot', text: data.response || 'No response.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const speakBotMessage = (text) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // --- Voice Recording Logic ---
  const mergeAudioBuffers = (chunks) => {
    const totalLength = chunks.reduce((len, chunk) => len + chunk.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    chunks.forEach((chunk) => { merged.set(chunk, offset); offset += chunk.length; });
    return merged;
  };

  const encodeWav = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    const floatTo16BitPCM = (offset, input) => {
      for (let i = 0; i < input.length; i++) {
        const val = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset + (i * 2), val < 0 ? val * 0x8000 : val * 0x7fff, true);
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(44, samples);
    return buffer;
  };

  const stopRecording = async () => {
    const recorder = recordingRef.current;
    if (recorder.processorNode) recorder.processorNode.disconnect();
    if (recorder.silenceNode) recorder.silenceNode.disconnect();
    if (recorder.sourceNode) recorder.sourceNode.disconnect();
    if (recorder.mediaStream) recorder.mediaStream.getTracks().forEach(t => t.stop());
    if (recorder.audioContext) { await recorder.audioContext.close(); recorder.audioContext = null; }

    const samples = mergeAudioBuffers(recorder.chunks);
    recorder.chunks = [];

    if (!samples.length) {
      setVoiceStatus('No audio captured.');
      setIsTranscribing(false);
      return;
    }

    const wavBuffer = encodeWav(samples, recorder.sampleRate || 16000);
    const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');

    setIsTranscribing(true);
    setVoiceStatus('Transcribing audio...');

    try {
      const res = await fetch(`${API_BASE}/voice/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      if (data.text) {
        setVoiceStatus('');
        sendMessage(null, data.text); // auto send the transcribed text
      } else {
        throw new Error('No text transcribed');
      }
    } catch (err) {
      setVoiceStatus(`Voice Error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!voiceSupported) return;

    if (isRecording) {
      setIsRecording(false);
      stopRecording();
      return;
    }

    setVoiceStatus('Recording...');
    navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        const sourceNode = audioContext.createMediaStreamSource(stream);
        const processorNode = audioContext.createScriptProcessor(4096, 1, 1);
        const silenceNode = audioContext.createGain();

        recordingRef.current = { audioContext, mediaStream: stream, sourceNode, processorNode, silenceNode, chunks: [], sampleRate: audioContext.sampleRate };

        processorNode.onaudioprocess = (e) => recordingRef.current.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        silenceNode.gain.value = 0;
        sourceNode.connect(processorNode);
        processorNode.connect(silenceNode);
        silenceNode.connect(audioContext.destination);
        setIsRecording(true);
      })
      .catch((e) => {
        setVoiceStatus('Microphone access denied.');
      });
  };

  return (
    <motion.div className="panel-card chatbot-container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: 0 }}>
        <MessageSquare className="panel-icon" />
        <h2>AI Banking Assistant</h2>
        {voiceStatus && <span className="voice-status-badge">{voiceStatus}</span>}
      </div>
      
      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-state-icon">
              <MessageSquare size={32} color="#a855f7" />
            </div>
            <h3>How can I help you today?</h3>
            <p>I am your personal AI banking assistant. Ask me anything about your accounts, loans, or recent activity.</p>
            <div className="faq-chips">
              <button type="button" onClick={() => sendMessage(null, "What is my current balance?")}>What is my current balance?</button>
              <button type="button" onClick={() => sendMessage(null, "Are there any suspicious transactions?")}>Any suspicious transactions?</button>
              <button type="button" onClick={() => sendMessage(null, "Am I eligible for a home loan?")}>Am I eligible for a home loan?</button>
              <button type="button" onClick={() => sendMessage(null, "Show me my recent activity.")}>Show my recent activity.</button>
            </div>
          </div>
        ) : messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
            <div className={`chat-bubble ${msg.role}`}>
              {msg.text}
            </div>
            {msg.role === 'bot' && speechSupported && (
              <button type="button" className="tts-button" onClick={() => speakBotMessage(msg.text)} title="Read aloud">
                <Volume2 size={14} />
              </button>
            )}
          </div>
        ))}
        {(loading || isTranscribing) && <div className="chat-bubble-wrapper bot"><div className="chat-bubble bot typing">{isTranscribing ? 'Transcribing...' : 'Thinking...'}</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={(e) => sendMessage(e, null)}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Ask about your balance, loans, or transfers..." 
          disabled={isRecording || isTranscribing}
        />
        <button 
          type="button" 
          onClick={toggleVoiceInput} 
          disabled={loading || isTranscribing || !voiceSupported} 
          className={`mic-btn ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </button>
        <button type="submit" disabled={loading || isTranscribing} className="send-btn">
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
};
export default Chatbot;
