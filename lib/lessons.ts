export type Lesson = {
  id: string;
  title: string;
  title_ar: string;
  thumbnail: string;
  free?: { slides: string; worksheet: string };
};

export type LessonModule = { title: string; title_ar: string; lessons: Lesson[] };

const ai = "/lessons/ai-essentials";

export const lessonsByCourse: Record<string, LessonModule[]> = {
  "ai-essentials": [
    {
      title: "Module 1: Getting started",
      title_ar: "الوحدة 1: البداية",
      lessons: [
        {
          id: "1.1",
          title: "What AI can and can't do for your work",
          title_ar: "ما الذي يستطيع الذكاء الاصطناعي فعله لعملك وما لا يستطيع",
          thumbnail: `${ai}/1-1.jpg`,
          free: {
            slides: "/free/ai-essentials/lesson-1-1-slides.pdf",
            worksheet: "/free/ai-essentials/lesson-1-1-worksheet.pdf",
          },
        },
        { id: "1.2", title: "ChatGPT vs Claude vs Gemini", title_ar: "ChatGPT أم Claude أم Gemini؟", thumbnail: `${ai}/1-2.jpg` },
        { id: "1.3", title: "Your first useful conversation", title_ar: "أول محادثة مفيدة لك", thumbnail: `${ai}/1-3.jpg` },
        { id: "1.4", title: "What never to paste into AI", title_ar: "ما لا يجب لصقه أبدًا في أدوات الذكاء الاصطناعي", thumbnail: `${ai}/1-4.jpg` },
      ],
    },
    {
      title: "Module 2: Writing and communication",
      title_ar: "الوحدة 2: الكتابة والتواصل",
      lessons: [
        { id: "2.1", title: "Emails in the right tone", title_ar: "كتابة الإيميلات بالنبرة المناسبة", thumbnail: `${ai}/2-1.jpg` },
        { id: "2.2", title: "Rewrite and edit your own text", title_ar: "أعد صياغة نصك وحرّره", thumbnail: `${ai}/2-2.jpg` },
        { id: "2.3", title: "Summarize long documents and meetings", title_ar: "لخّص المستندات الطويلة والاجتماعات", thumbnail: `${ai}/2-3.jpg` },
        { id: "2.4", title: "Translate between Arabic and English", title_ar: "الترجمة بين العربية والإنجليزية", thumbnail: `${ai}/2-4.jpg` },
      ],
    },
  ],
};
