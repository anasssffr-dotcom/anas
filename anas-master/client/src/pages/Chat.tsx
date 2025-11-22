import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Chat() {
  const [match, params] = useRoute("/chat/:roomId");
  const [, setLocation] = useLocation();
  const roomId = params?.roomId as string;

  const [userName, setUserName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);
  const [userNameSet, setUserNameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch room details
  const { data: room, isLoading: roomLoading } = trpc.chat.getRoom.useQuery(
    { roomId },
    { enabled: !!roomId }
  );

  // Fetch messages with polling
  const { data: messages = [], refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { roomId, limit: 100 },
    { enabled: !!roomId && userNameSet }
  );

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    },
  });

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!userNameSet || !roomId) return;

    const interval = setInterval(() => {
      refetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [userNameSet, roomId, refetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !userName.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        roomId,
        userName,
        content: messageText,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/chat/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-gray-600">جاري تحميل الغرفة...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">غرفة غير موجودة</h2>
          <p className="text-gray-600 mb-6">
            عذراً، لم نتمكن من العثور على هذه الغرفة
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            العودة للرئيسية
          </Button>
        </Card>
      </div>
    );
  }

  if (!userNameSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8 max-w-md w-full mx-4 shadow-lg border-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">أهلاً بك!</h2>
          <p className="text-gray-600 mb-6">
            ما اسمك؟ (سيظهر في الرسائل)
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (userName.trim()) {
                setUserNameSet(true);
              }
            }}
            className="space-y-4"
          >
            <Input
              type="text"
              placeholder="أدخل اسمك"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
              className="w-full"
            />
            <Button
              type="submit"
              disabled={!userName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              ابدأ المحادثة
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
              <p className="text-sm text-gray-500">أنت: {userName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                تم النسخ
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                نسخ الرابط
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">لا توجد رسائل حتى الآن</p>
              <p className="text-sm">ابدأ المحادثة بإرسال أول رسالة</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.userName === userName ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.userName === userName
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.userName !== userName && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {msg.userName}
                  </p>
                )}
                <p className="break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.userName === userName
                      ? "text-indigo-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="container mx-auto flex gap-2">
          <Input
            type="text"
            placeholder="اكتب رسالتك..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
