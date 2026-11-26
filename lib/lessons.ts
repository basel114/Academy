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
    {
      title: "Module 3: Research and thinking",
      title_ar: "الوحدة 3: البحث والتفكير",
      lessons: [
        { id: "3.1", title: "Research with sources and fact-check", title_ar: "ابحث بالمصادر وتحقّق من المعلومات", thumbnail: `${ai}/3-1.jpg` },
        { id: "3.2", title: "Brainstorm better ideas", title_ar: "اعصف ذهنيًا بأفكار أفضل", thumbnail: `${ai}/3-2.jpg` },
        { id: "3.3", title: "Decide with pros and cons", title_ar: "اتخذ قرارك بالمزايا والعيوب", thumbnail: `${ai}/3-3.jpg` },
        { id: "3.4", title: "Learn any new topic fast", title_ar: "تعلّم أي موضوع جديد بسرعة", thumbnail: `${ai}/3-4.jpg` },
      ],
    },
    {
      title: "Module 4: Documents, spreadsheets and data",
      title_ar: "الوحدة 4: المستندات والجداول والبيانات",
      lessons: [
        { id: "4.1", title: "AI inside Google Docs and Word", title_ar: "الذكاء الاصطناعي داخل Google Docs أو Word", thumbnail: `${ai}/4-1.jpg` },
        { id: "4.2", title: "Spreadsheet formulas with AI", title_ar: "معادلات الجداول بمساعدة الذكاء الاصطناعي", thumbnail: `${ai}/4-2.jpg` },
        { id: "4.3", title: "Analyze a CSV file", title_ar: "حلّل ملف CSV", thumbnail: `${ai}/4-3.jpg` },
        { id: "4.4", title: "From outline to presentation", title_ar: "من المخطط إلى العرض التقديمي", thumbnail: `${ai}/4-4.jpg` },
      ],
    },
    {
      title: "Module 5: Visuals and media",
      title_ar: "الوحدة 5: الصور والوسائط",
      lessons: [
        { id: "5.1", title: "Create images from a text prompt", title_ar: "أنشئ صورًا من وصف نصي", thumbnail: `${ai}/5-1.jpg` },
        { id: "5.2", title: "Edit and improve photos with AI", title_ar: "عدّل صورك وحسّنها بالذكاء الاصطناعي", thumbnail: `${ai}/5-2.jpg` },
        { id: "5.3", title: "Turn audio and video into text", title_ar: "حوّل الصوت والفيديو إلى نص", thumbnail: `${ai}/5-3.jpg` },
        { id: "5.4", title: "Use AI media safely and fairly", title_ar: "استخدم وسائط الذكاء الاصطناعي بأمان وإنصاف", thumbnail: `${ai}/5-4.jpg` },
      ],
    },
  ],
};
