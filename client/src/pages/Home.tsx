import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Copy, Check } from "lucide-react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const createRoomMutation = trpc.chat.createRoom.useMutation({
    onSuccess: (data) => {
      setRoomName("");
      setLocation(`/chat/${data.roomId}`);
    },
  });

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setLoading(true);
    try {
      await createRoomMutation.mutateAsync({
        name: roomName,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${roomId}`);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <p className="text-lg text-gray-600">
            محادثة فورية بسيطة وسهلة الاستخدام
          </p>
        </div>

        {/* Create Room Card */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-indigo-600 text-white rounded-t-lg">
              <CardTitle>إنشاء غرفة محادثة جديدة</CardTitle>
              <CardDescription className="text-indigo-100">
                أنشئ غرفة وشارك الرابط مع الآخرين
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الغرفة
                  </label>
                  <Input
                    type="text"
                    placeholder="مثال: غرفة الفريق"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !roomName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "جاري الإنشاء..." : "إنشاء الغرفة"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md border-0">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">محادثة فورية</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  تواصل مع الآخرين بشكل فوري دون تأخير
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Copy className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">رابط مشترك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  انسخ الرابط وشاركه مع من تريد بسهولة
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">بدون تسجيل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  لا تحتاج إلى حساب أو تسجيل دخول
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
