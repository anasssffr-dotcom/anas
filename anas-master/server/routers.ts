import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  createChatRoom,
  getChatRoomByRoomId,
  getChatRoomById,
  createMessage,
  getMessagesByRoomId,
  deleteMessage,
} from "./db";
import { TRPCError } from "@trpc/server";

// Helper to generate unique room IDs
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    // Create a new chat room
    createRoom: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
      }))
      .mutation(async ({ input, ctx }) => {
        const roomId = generateRoomId();
        const userId = ctx.user?.id || null;

        await createChatRoom({
          roomId,
          name: input.name,
          createdBy: userId || 0,
        });

        return { roomId, name: input.name };
      }),

    // Get room details
    getRoom: publicProcedure
      .input(z.object({
        roomId: z.string(),
      }))
      .query(async ({ input }) => {
        const room = await getChatRoomByRoomId(input.roomId);
        if (!room) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat room not found",
          });
        }
        return room;
      }),

    // Send a message
    sendMessage: publicProcedure
      .input(z.object({
        roomId: z.string(),
        userName: z.string().min(1).max(255),
        content: z.string().min(1).max(5000),
      }))
      .mutation(async ({ input }) => {
        const room = await getChatRoomByRoomId(input.roomId);
        if (!room) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat room not found",
          });
        }

        await createMessage({
          roomId: room.id,
          userId: null,
          userName: input.userName,
          content: input.content,
        });

        return {
          success: true,
          message: {
            roomId: room.id,
            userName: input.userName,
            content: input.content,
            createdAt: new Date(),
          },
        };
      }),

    // Get messages for a room
    getMessages: publicProcedure
      .input(z.object({
        roomId: z.string(),
        limit: z.number().min(1).max(500).default(100),
      }))
      .query(async ({ input }) => {
        const room = await getChatRoomByRoomId(input.roomId);
        if (!room) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat room not found",
          });
        }

        const msgs = await getMessagesByRoomId(room.id, input.limit);
        return msgs;
      }),

    // Delete a message (optional)
    deleteMessage: protectedProcedure
      .input(z.object({
        messageId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await deleteMessage(input.messageId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
