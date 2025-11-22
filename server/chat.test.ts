import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("chat router", () => {
  let roomId: string;
  const caller = appRouter.createCaller(createPublicContext());

  describe("createRoom", () => {
    it("creates a new chat room", async () => {
      const result = await caller.chat.createRoom({
        name: "Test Room",
      });

      expect(result).toHaveProperty("roomId");
      expect(result).toHaveProperty("name");
      expect(result.name).toBe("Test Room");
      expect(typeof result.roomId).toBe("string");
      expect(result.roomId.length).toBeGreaterThan(0);

      roomId = result.roomId;
    });

    it("rejects empty room names", async () => {
      try {
        await caller.chat.createRoom({
          name: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("getRoom", () => {
    beforeEach(async () => {
      const result = await caller.chat.createRoom({
        name: "Get Room Test",
      });
      roomId = result.roomId;
    });

    it("retrieves an existing room", async () => {
      const room = await caller.chat.getRoom({
        roomId,
      });

      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("roomId");
      expect(room).toHaveProperty("name");
      expect(room.roomId).toBe(roomId);
      expect(room.name).toBe("Get Room Test");
    });

    it("throws error for non-existent room", async () => {
      try {
        await caller.chat.getRoom({
          roomId: "nonexistent-room-id",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("sendMessage", () => {
    beforeEach(async () => {
      const result = await caller.chat.createRoom({
        name: "Message Test Room",
      });
      roomId = result.roomId;
    });

    it("sends a message to a room", async () => {
      const result = await caller.chat.sendMessage({
        roomId,
        userName: "Test User",
        content: "Hello, World!",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("message");
      expect(result.message.userName).toBe("Test User");
      expect(result.message.content).toBe("Hello, World!");
    });

    it("rejects empty message content", async () => {
      try {
        await caller.chat.sendMessage({
          roomId,
          userName: "Test User",
          content: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("rejects empty username", async () => {
      try {
        await caller.chat.sendMessage({
          roomId,
          userName: "",
          content: "Hello",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("throws error for non-existent room", async () => {
      try {
        await caller.chat.sendMessage({
          roomId: "nonexistent-room-id",
          userName: "Test User",
          content: "Hello",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getMessages", () => {
    beforeEach(async () => {
      const result = await caller.chat.createRoom({
        name: "Get Messages Test Room",
      });
      roomId = result.roomId;

      // Send multiple messages
      await caller.chat.sendMessage({
        roomId,
        userName: "User 1",
        content: "First message",
      });

      await caller.chat.sendMessage({
        roomId,
        userName: "User 2",
        content: "Second message",
      });

      await caller.chat.sendMessage({
        roomId,
        userName: "User 3",
        content: "Third message",
      });
    });

    it("retrieves messages from a room", async () => {
      const messages = await caller.chat.getMessages({
        roomId,
      });

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(3);
      expect(messages[0].userName).toBe("User 1");
      expect(messages[1].userName).toBe("User 2");
      expect(messages[2].userName).toBe("User 3");
    });

    it("respects the limit parameter", async () => {
      const messages = await caller.chat.getMessages({
        roomId,
        limit: 2,
      });

      expect(messages.length).toBeLessThanOrEqual(2);
    });

    it("throws error for non-existent room", async () => {
      try {
        await caller.chat.getMessages({
          roomId: "nonexistent-room-id",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});
