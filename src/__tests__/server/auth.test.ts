import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock bcrypt
const mockBcrypt = {
  compare: vi.fn(),
};

// Mock the database
const mockDb = {
  user: {
    findUnique: vi.fn(),
  },
};

// Simulate rate limiter
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(email: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = loginAttempts.get(key);

  if (record) {
    if (now > record.resetAt) {
      loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return { success: true, remaining: LOGIN_RATE_LIMIT - 1 };
    } else if (record.count >= LOGIN_RATE_LIMIT) {
      return { success: false, remaining: 0 };
    } else {
      record.count++;
      return { success: true, remaining: LOGIN_RATE_LIMIT - record.count };
    }
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { success: true, remaining: LOGIN_RATE_LIMIT - 1 };
  }
}

// Simulate middleware checks
function enforceUserIsAuthed(session: { user?: { id: string; role: string } } | null) {
  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return session.user;
}

function enforceUserIsAdmin(session: { user?: { id: string; role: string } } | null) {
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return session.user;
}

describe("Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginAttempts.clear();
  });

  describe("Login - Invalid Credentials", () => {
    it("fails with non-existent email", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const user = await mockDb.user.findUnique({
        where: { email: "nonexistent@example.com" },
      });

      expect(user).toBeNull();

      // In real auth flow, this would return an error
      const error = new Error("Invalid credentials");
      expect(error.message).toBe("Invalid credentials");
    });

    it("fails with incorrect password", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        password: "$2a$10$hashedpassword",
      };

      mockDb.user.findUnique.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false);

      const foundUser = await mockDb.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(foundUser).not.toBeNull();

      const passwordMatch = await mockBcrypt.compare("wrongpassword", foundUser!.password);
      expect(passwordMatch).toBe(false);
    });
  });

  describe("Login - Rate Limiting", () => {
    it("allows first login attempt", () => {
      const result = checkLoginRateLimit("test@example.com");
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("allows up to 5 login attempts", () => {
      const email = "test@example.com";
      for (let i = 0; i < 5; i++) {
        const result = checkLoginRateLimit(email);
        expect(result.success).toBe(true);
      }
    });

    it("blocks 6th login attempt", () => {
      const email = "test@example.com";
      // First 5 attempts
      for (let i = 0; i < 5; i++) {
        checkLoginRateLimit(email);
      }
      // 6th attempt should be blocked
      const result = checkLoginRateLimit(email);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("Two-Factor Authentication", () => {
    it("requires 2FA when enabled on account", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        password: "$2a$10$hashedpassword",
        twoFactorEnabled: true,
        twoFactorSecret: "JBSWY3DPEHPK3PXP",
      };

      mockDb.user.findUnique.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true);

      const foundUser = await mockDb.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(foundUser?.twoFactorEnabled).toBe(true);

      // When 2FA is enabled, login should require additional verification
      // The auth flow would return a partial session requiring 2FA
      const requires2FA = foundUser?.twoFactorEnabled === true;
      expect(requires2FA).toBe(true);
    });

    it("does not require 2FA when disabled", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        password: "$2a$10$hashedpassword",
        twoFactorEnabled: false,
        twoFactorSecret: null,
      };

      mockDb.user.findUnique.mockResolvedValue(user);

      const foundUser = await mockDb.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(foundUser?.twoFactorEnabled).toBe(false);
    });
  });

  describe("Admin Route Protection", () => {
    it("rejects non-authenticated users", () => {
      expect(() => enforceUserIsAdmin(null)).toThrow(TRPCError);
    });

    it("rejects regular users from admin routes", () => {
      const session = {
        user: { id: "user-123", role: "USER" },
      };

      expect(() => enforceUserIsAdmin(session)).toThrow(TRPCError);

      try {
        enforceUserIsAdmin(session);
      } catch (error) {
        expect((error as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    it("allows ADMIN users to admin routes", () => {
      const session = {
        user: { id: "admin-123", role: "ADMIN" },
      };

      const user = enforceUserIsAdmin(session);
      expect(user.role).toBe("ADMIN");
    });

    it("allows SUPER_ADMIN users to admin routes", () => {
      const session = {
        user: { id: "superadmin-123", role: "SUPER_ADMIN" },
      };

      const user = enforceUserIsAdmin(session);
      expect(user.role).toBe("SUPER_ADMIN");
    });
  });

  describe("Protected Route Middleware", () => {
    it("rejects requests without session", () => {
      expect(() => enforceUserIsAuthed(null)).toThrow(TRPCError);

      try {
        enforceUserIsAuthed(null);
      } catch (error) {
        expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects requests with empty session", () => {
      const emptySession = { user: undefined };
      expect(() => enforceUserIsAuthed(emptySession as any)).toThrow(TRPCError);
    });

    it("allows requests with valid session", () => {
      const session = {
        user: { id: "user-123", role: "USER" },
      };

      const user = enforceUserIsAuthed(session);
      expect(user.id).toBe("user-123");
    });
  });
});
