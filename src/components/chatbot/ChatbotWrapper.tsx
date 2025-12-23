"use client";

import dynamic from "next/dynamic";

const Chatbot = dynamic(() => import("./Chatbot"), {
  ssr: false, // Chatbot chỉ cần render ở client-side
});

const ChatbotWrapper = () => {
  return <Chatbot />;
};

export default ChatbotWrapper;

