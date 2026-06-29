import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});

		it("should reject an empty title", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "   ", description: "Invalid" });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Title is required and must be a non-empty string",
			});
		});
	});

	describe("GET /api/tasks", () => {
		it("should return all tasks ordered by newest first", async () => {
			await request(app)
				.post("/api/tasks")
				.send({ title: "First Task", description: "First" });

			await request(app)
				.post("/api/tasks")
				.send({ title: "Second Task", description: "Second" });

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
			expect(res.body[0].title).toBe("Second Task");
			expect(res.body[1].title).toBe("First Task");
		});
	});

	describe("GET /api/tasks/:id", () => {
		it("should return a task by id", async () => {
			const created = await request(app)
				.post("/api/tasks")
				.send({ title: "Fetch me", description: "One task" });

			const res = await request(app).get(`/api/tasks/${created.body.id}`);

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Fetch me");
			expect(res.body.description).toBe("One task");
		});

		it("should reject an invalid task id", async () => {
			const res = await request(app).get("/api/tasks/not-a-number");

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});

		it("should return 404 for a missing task", async () => {
			const res = await request(app).get("/api/tasks/999999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update an existing task", async () => {
			const created = await request(app)
				.post("/api/tasks")
				.send({ title: "Old title", description: "Old description" });

			const res = await request(app)
				.put(`/api/tasks/${created.body.id}`)
				.send({ title: "Updated title", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Updated title");
			expect(res.body.completed).toBe(true);
		});

		it("should return 404 when updating a missing task", async () => {
			const res = await request(app)
				.put("/api/tasks/999999")
				.send({ title: "Does not exist" });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete an existing task", async () => {
			const created = await request(app)
				.post("/api/tasks")
				.send({ title: "Delete me", description: "Temp" });

			const res = await request(app).delete(`/api/tasks/${created.body.id}`);

			expect(res.status).toBe(204);

			const fetchDeleted = await request(app).get(`/api/tasks/${created.body.id}`);
			expect(fetchDeleted.status).toBe(404);
		});

		it("should return 404 when deleting a missing task", async () => {
			const res = await request(app).delete("/api/tasks/999999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});
});
