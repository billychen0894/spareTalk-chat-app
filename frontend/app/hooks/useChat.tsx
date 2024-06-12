import { SocketClient } from "@websocket/socket";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChatMessage, ChatRoom, SocketAuth } from "types/types";
import { v4 as uuidv4 } from "uuid";

export const useChat = () => {
  const [newMessage, setNewMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [startChatSession, setStartChatSession] = useState<boolean>(false);
  const [currChatRoom, setCurrChatRoom] = useState<ChatRoom | null>(null);
  const [isError, setIsError] = useState<{
    isError: boolean;
    errorMessage: string;
  }>({ isError: false, errorMessage: "" });
  const [sessionId, setSessionId] = useState<string>("");
  const [chatRoomId, setChatRoomId] = useState<string>("");
  const [isOffline, setIsOffline] = useState<Boolean>(false);
  const chatContainerRef = useRef<HTMLQuoteElement | null>(null);
  const socket = SocketClient.getInstance().getSocket();

  useEffect(() => {
    function onReceiveMessage(message: ChatMessage) {
      flushSync(() => {
        setChatMessages((prev) => [...prev, message]);
      });
    }

    function onChatRoomCreated(chatRoom: ChatRoom) {
      if (socket.connected && chatRoom) {
        setCurrChatRoom(chatRoom);
      }
    }

    function onLeftChat(userId: string) {
      if (currChatRoom) {
        setCurrChatRoom({
          id: currChatRoom.id,
          state: "idle",
          participants: currChatRoom.participants.filter((id) => id !== userId),
        });
      }
    }

    function startChat() {
      if (socket.connected) {
        const eventId = uuidv4();

        if (isOffline) {
          setIsOffline(false);
        }

        if (sessionId && chatRoomId) {
          socket.emit("check-chatRoom-session", chatRoomId, sessionId, eventId);
        }

        if (!chatRoomId) {
          socket.emit(
            "start-chat",
            socket.id,
            eventId,
            (err: any, response: any) => {
              console.log("err", err);
              console.log("response", response);
            },
          );
        }
      }
    }

    function connectError(err: any) {
      if (err) {
        setIsError({
          isError: true,
          errorMessage: "Connection error! Please try again later.",
        });
        console.error(err.message);
      }
    }

    function onSession(session: { sessionId: string; chatRoomId: string }) {
      if (socket.connected && typeof window !== undefined) {
        // set session obj to auth object
        socket.auth = {
          sessionId: session.sessionId,
          chatRoomId: session.chatRoomId,
        };
        setSessionId(session?.sessionId);
        setChatRoomId(session?.chatRoomId);

        window.localStorage.setItem("chatSession", JSON.stringify(session));
      }
    }

    function onChatHistory(chatMessages: ChatMessage[]) {
      if (chatMessages.length >= 0) {
        flushSync(() => {
          setChatMessages(chatMessages);
        });
      }
    }

    function onMissedMessages(chatMessages: ChatMessage[]) {
      if (chatMessages.length >= 0) {
        flushSync(() => {
          setChatMessages((prev) => [...prev, ...chatMessages]);
        });
      }
    }

    function onInactiveChatRoom(chatRoom: ChatRoom) {
      // Remove session and reset states
      if (typeof window !== undefined) {
        window.localStorage.removeItem("chatSession");

        setStartChatSession(false);
        setChatMessages([]);
        setCurrChatRoom(null);
        setSessionId("");
        setChatRoomId("");

        socket.auth = {
          sessionId: "",
          chatRoomId: "",
        };

        socket.disconnect();
      }
    }

    function onReceiveChatRoomSession(chatRoom: ChatRoom | null) {
      if (socket.connected && chatRoom) {
        const eventId = uuidv4();
        socket.emit("start-chat", socket.id, eventId);
        socket.emit("retrieve-chat-messages", chatRoom?.id, eventId);

        setStartChatSession(true);
        setCurrChatRoom(chatRoom);
      }
      if (socket.connected && !chatRoom && typeof window !== undefined) {
        window.localStorage.removeItem("chatSession");
        const auth = socket.auth as SocketAuth;

        setStartChatSession(false);
        setChatMessages([]);
        setCurrChatRoom(null);
        setSessionId("");
        setChatRoomId("");

        auth.sessionId = "";
        auth.chatRoomId = "";

        socket.disconnect();
      }
    }

    function disconnect(reason: any) {
      console.log("Disconnect reason:", reason);

      if (reason === "io server disconnect") {
        socket.connect();
      } else {
        setIsOffline(true);
      }
    }

    function onChatError(error: {
      status: string;
      errorCode: number;
      message: string;
      details?: {};
    }) {
      if (error.status === "error" && error.errorCode === 500) {
        setIsError({
          isError: true,
          errorMessage: "Internal server error! Please try again later.",
        });
      }

      if (error.status === "error" && error.errorCode === 404) {
        setIsError({
          isError: true,
          errorMessage: "Requested resource not found! Please try again later.",
        });
      }
    }

    function onConnectError(err: any) {
      console.error("Connection error:", err);
      setIsOffline(true);
    }

    socket.on("disconnect", disconnect);
    socket.on("connect", startChat);
    socket.on("session", onSession);
    socket.on("receive-message", onReceiveMessage);
    socket.on("chatRoom-created", onChatRoomCreated);
    socket.on("left-chat", onLeftChat);
    socket.on("connect_error", connectError);
    socket.on("chat-history", onChatHistory);
    socket.on("missed-messages", onMissedMessages);
    socket.on("inactive-chatRoom", onInactiveChatRoom);
    socket.on("receive-chatRoom-session", onReceiveChatRoomSession);
    socket.on("chat-error", onChatError);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", startChat);
      socket.off("receive-message", onReceiveMessage);
      socket.off("chatRoom-created", onChatRoomCreated);
      socket.off("left-chat", onLeftChat);
      socket.off("connect_error", connectError);
      socket.off("session", onSession);
      socket.off("chat-history", onChatHistory);
      socket.off("missed-messages", onMissedMessages);
      socket.off("inactive-chatRoom", onInactiveChatRoom);
      socket.off("receive-chatRoom-session", onReceiveChatRoomSession);
      socket.off("disconnect", disconnect);
      socket.off("chat-error", onChatError);
      socket.off("connect_error", onConnectError);
    };
  }, [socket, chatRoomId, sessionId, currChatRoom, isOffline]);

  const startChatConnection = useCallback(() => {
    socket.connect();
    setStartChatSession(true);
  }, [socket]);

  const disconnectChat = useCallback(() => {
    if (!socket.connected && typeof window !== undefined) {
      window.localStorage.removeItem("chatSession");
      setStartChatSession(false);
      setChatMessages([]);
      setCurrChatRoom(null);
      return;
    }

    if (socket.connected && typeof window !== undefined) {
      const eventId = uuidv4();
      socket.emit(
        "leave-chat",
        currChatRoom?.id,
        eventId,
        (err: any, response: any) => {
          if (response.status === "ok") {
            const auth = socket.auth as SocketAuth;

            setSessionId("");
            setChatRoomId("");
            auth.sessionId = "";
            auth.chatRoomId = "";

            socket.disconnect();
          }
        },
      );

      window.localStorage.removeItem("chatSession");
      setStartChatSession(false);
      setChatMessages([]);
      setCurrChatRoom(null);
    }
  }, [socket, currChatRoom]);

  const handleSendMessage = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && currChatRoom && newMessage.trim() !== "") {
        event.preventDefault();

        const auth = socket.auth as SocketAuth;

        const socketSessionId = auth?.sessionId || (socket.id as string);
        const chatRoomId = auth?.chatRoomId || "";

        const chatMessage: ChatMessage = {
          id: uuidv4(),
          sender: socketSessionId,
          message: newMessage,
          timestamp: new Date().toISOString(),
        };

        const eventId = uuidv4();
        socket.emit("send-message", chatRoomId, chatMessage, eventId);

        setChatMessages((prev) => [...prev, chatMessage]);

        chatContainerRef?.current?.lastElementChild?.scrollIntoView();

        setNewMessage("");
      }
    },
    [socket, newMessage, currChatRoom],
  );

  useEffect(() => {
    // Recover session if exists
    if (typeof window !== undefined) {
      const chatSessionObj = window.localStorage.getItem("chatSession");

      if (chatSessionObj) {
        const { sessionId, chatRoomId } = JSON.parse(chatSessionObj) as {
          sessionId: string;
          chatRoomId: string;
        };

        if (sessionId && !chatRoomId && !startChatSession) {
          window.localStorage.removeItem("chatSession");
          socket.auth = {
            sessionId: "",
            chatRoomId: "",
          };
          setSessionId("");
          setChatRoomId("");
        }

        if (sessionId && chatRoomId) {
          socket.auth = {
            sessionId,
            chatRoomId,
          };
          socket.connect();
          setSessionId(sessionId);
          setChatRoomId(chatRoomId);
        }
      }
    }
  }, [socket, startChatSession]);

  return {
    isOffline,
    startChatSession,
    currChatRoom,
    chatMessages,
    chatContainerRef,
    socket,
    isError,
    disconnectChat,
    handleSendMessage,
    setNewMessage,
    newMessage,
    startChatConnection,
  };
};
