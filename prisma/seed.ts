import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Hash password once
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Use transaction for atomicity and optimization
  await prisma.$transaction(async (tx) => {
    // Clear existing data (optional, for clean seed)
    await tx.question.deleteMany();
    await tx.quiz.deleteMany();
    await tx.note.deleteMany();
    await tx.tag.deleteMany();
    await tx.user.deleteMany();

    // Create users
    const users = await tx.user.createManyAndReturn({
      data: [
        {
          email: "user@gmail.com",
          name: "Alice Johnson",
          password: hashedPassword,
        },
        {
          email: "user1@gmail.com",
          name: "Bob Smith",
          password: hashedPassword,
        },
        {
          email: "user2@gmail.com",
          name: "Charlie Brown",
          password: hashedPassword,
        },
      ],
    });

    // Create tags
    const tags = await tx.tag.createManyAndReturn({
      data: [
        { name: "AI" },
        { name: "Machine Learning" },
        { name: "Web Development" },
        { name: "Productivity" },
        { name: "Personal" },
        { name: "Learning" },
        { name: "Tech" },
        { name: "Notes" },
      ],
    });

    // Create notes with relations
    const notesData = [
      {
        title: "Introduction to Artificial Intelligence",
        content:
          "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.",
        aiSummary:
          "AI is the simulation of human intelligence in machines, enabling them to perform tasks that typically require human intelligence.",
        isPinned: true,
        userId: users[0].id,
        tags: { connect: [{ id: tags[0].id }, { id: tags[1].id }] },
      },
      {
        title: "Web Development Best Practices",
        content:
          "Web development involves creating websites and web applications. Best practices include responsive design, accessibility, performance optimization, and security considerations.",
        aiSummary:
          "Key practices for web development include responsive design, accessibility, performance, and security.",
        userId: users[0].id,
        tags: { connect: [{ id: tags[2].id }, { id: tags[6].id }] },
      },
      {
        title: "Machine Learning Algorithms",
        content:
          "Machine learning algorithms are methods used to train models on data. Common types include supervised learning, unsupervised learning, and reinforcement learning.",
        aiSummary:
          "ML algorithms train models on data, categorized into supervised, unsupervised, and reinforcement learning.",
        userId: users[1].id,
        tags: { connect: [{ id: tags[0].id }, { id: tags[1].id }] },
      },
      {
        title: "Personal Productivity Tips",
        content:
          "To boost productivity, maintain a daily routine, prioritize tasks, take breaks, and use tools like calendars and to-do lists.",
        aiSummary:
          "Productivity tips: routine, prioritization, breaks, and organization tools.",
        userId: users[1].id,
        tags: { connect: [{ id: tags[3].id }, { id: tags[4].id }] },
      },
      {
        title: "Learning New Technologies",
        content:
          "Learning new tech involves setting goals, practicing regularly, building projects, and staying updated with industry trends.",
        aiSummary:
          "Learn tech by setting goals, regular practice, projects, and following trends.",
        userId: users[2].id,
        tags: { connect: [{ id: tags[5].id }, { id: tags[6].id }] },
      },
      {
        title: "Note-Taking Strategies",
        content:
          "Effective note-taking includes active listening, summarizing key points, using abbreviations, and reviewing notes regularly.",
        aiSummary:
          "Effective note-taking: active listening, summarization, abbreviations, and review.",
        userId: users[2].id,
        tags: { connect: [{ id: tags[7].id }, { id: tags[3].id }] },
      },
    ];

    await tx.note.createMany({
      data: notesData,
    });

    // Create quizzes with nested questions
    const quizzesData = [
      {
        title: "AI Fundamentals Quiz",
        total: 3,
        userId: users[0].id,
        questions: {
          create: [
            {
              questionText: "What does AI stand for?",
              options: [
                "Artificial Intelligence",
                "Automated Input",
                "Advanced Integration",
              ],
              correctAnswer: "Artificial Intelligence",
            },
            {
              questionText: "Which is a type of machine learning?",
              options: [
                "Supervised Learning",
                "Super Computing",
                "System Logging",
              ],
              correctAnswer: "Supervised Learning",
            },
            {
              questionText: "AI can mimic human intelligence.",
              options: ["True", "False"],
              correctAnswer: "True",
            },
          ],
        },
      },
      {
        title: "Web Dev Basics Quiz",
        total: 2,
        userId: users[1].id,
        questions: {
          create: [
            {
              questionText: "What does HTML stand for?",
              options: [
                "HyperText Markup Language",
                "High Tech Modern Language",
                "Home Tool Markup Language",
              ],
              correctAnswer: "HyperText Markup Language",
            },
            {
              questionText: "CSS is used for styling web pages.",
              options: ["True", "False"],
              correctAnswer: "True",
            },
          ],
        },
      },
    ];

    for (const quiz of quizzesData) {
      await tx.quiz.create({ data: quiz });
    }

    console.log("Seeding completed successfully!");
  });
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
