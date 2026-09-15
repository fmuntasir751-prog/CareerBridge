import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../services/api";


function Chatbot() {
  const { i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  const isJapanese = i18n.language.startsWith("ja");
  const language = isJapanese ? "ja" : "en";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadMessages = async () => {
      try {
        setError("");

        const response = await api.get("/chatbot/");
        setMessages(response.data);
      } catch {
        setError(
          isJapanese
            ? "チャット履歴を読み込めませんでした。"
            : "Could not load chat history.",
        );
      }
    };

    loadMessages();
  }, [isOpen, isJapanese]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || loading) {
      return;
    }

    const temporaryMessage = {
      id: `temporary-${Date.now()}`,
      role: "user",
      message: cleanMessage,
      language,
    };

    setMessages((current) => [
      ...current,
      temporaryMessage,
    ]);

    setMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/chatbot/",
        {
          message: cleanMessage,
          language,
        },
      );

      setMessages((current) => [
        ...current,
        response.data,
      ]);
    } catch {
      setError(
        isJapanese
          ? "メッセージを送信できませんでした。"
          : "Could not send your message.",
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    const confirmation = window.confirm(
      isJapanese
        ? "チャット履歴を削除しますか？"
        : "Clear the chat history?",
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.delete("/chatbot/clear/");
      setMessages([]);
      setError("");
    } catch {
      setError(
        isJapanese
          ? "履歴を削除できませんでした。"
          : "Could not clear chat history.",
      );
    }
  };

  return (
    <div className="career-chatbot">
      {isOpen && (
        <section className="chatbot-window">
          <header className="chatbot-header">
            <div>
              <strong>
                {isJapanese
                  ? "AIキャリアアシスタント"
                  : "AI Career Assistant"}
              </strong>

              <small>
                {isJapanese
                  ? "就職活動をサポートします"
                  : "CareerBridge support"}
              </small>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                onClick={clearChat}
                title={
                  isJapanese
                    ? "履歴を削除"
                    : "Clear history"
                }
              >
                🗑️
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </header>

          <div className="chatbot-messages">
            {!messages.length && (
              <div className="chatbot-welcome">
                <span>🤖</span>

                <p>
                  {isJapanese
                    ? "こんにちは！履歴書、面接、求人、ITスキルについて質問してください。"
                    : "Hello! Ask me about resumes, interviews, jobs or web-development skills."}
                </p>
              </div>
            )}

           {messages.map((chatMessage) => {
  const jobIds = [
    ...chatMessage.message.matchAll(
      /(?:Job ID|求人ID):\s*(\d+)/g,
    ),
  ].map((match) => match[1]);

  return (
    <div
      className={`chat-message ${chatMessage.role}`}
      key={chatMessage.id}
    >
      <div className="chat-message-content">
        <p>{chatMessage.message}</p>

        {chatMessage.role === "assistant"
          && jobIds.length > 0 && (
            <div className="chatbot-job-links">
              {jobIds.map((jobId, index) => (
                <a
                  href={`/jobs/${jobId}`}
                  key={jobId}
                >
                  {isJapanese
                    ? `求人 ${index + 1} の詳細を見る`
                    : `View job ${index + 1}`}
                </a>
              ))}
            </div>
          )}
      </div>
    </div>
  );
})} 

            {loading && (
              <div className="chat-message assistant">
                <p className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="chatbot-error">
              {error}
            </div>
          )}

          <form
            className="chatbot-form"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder={
                isJapanese
                  ? "質問を入力してください..."
                  : "Type your question..."
              }
              maxLength={2000}
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
            >
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        className="chatbot-toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open career assistant"
      >
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
}


export default Chatbot;