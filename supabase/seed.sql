-- Fictional demo catalog. These are public sample records, not real people.
insert into public.courses(id,slug,category,level,price_minor,currency,is_published) values
 ('10000000-0000-4000-8000-000000000001','arabic-at-home','arabic_for_dutch_speakers','beginner',4900,'EUR',true),
 ('10000000-0000-4000-8000-000000000002','gentle-parenting','parenting_child_development','all',3500,'EUR',true),
 ('10000000-0000-4000-8000-000000000003','dutch-starters','language_learning','beginner',5900,'EUR',true)
on conflict(slug) do nothing;
insert into public.course_translations(course_id,locale,title,description)
select c.id,v.locale,v.title,v.description from (values
 ('arabic-at-home','en','Arabic at home: a joyful beginning','Build a warm daily connection with Arabic, one small moment at a time.'),('arabic-at-home','nl','Arabisch thuis: een vrolijke start','Bouw thuis een warme dagelijkse band op met het Arabisch.'),('arabic-at-home','ar','العربية في البيت: بداية ممتعة','ابنِ صلة يومية دافئة باللغة العربية، خطوة خطوة.'),
 ('gentle-parenting','en','Understanding big feelings','Practical, compassionate tools for meeting your child where they are.'),('gentle-parenting','nl','Grote gevoelens begrijpen','Praktische en liefdevolle hulpmiddelen om aan te sluiten bij je kind.'),('gentle-parenting','ar','فهم المشاعر الكبيرة','أدوات عملية ومتعاطفة لفهم طفلك ومساندته.'),
 ('dutch-starters','en','Dutch for everyday life','Build confidence for the conversations that make a new place feel like home.'),('dutch-starters','nl','Nederlands voor elke dag','Krijg vertrouwen in gesprekken waardoor een nieuwe plek als thuis voelt.'),('dutch-starters','ar','الهولندية للحياة اليومية','اكتسب الثقة في المحادثات التي تجعل المكان الجديد بيتًا.')
) as v(slug,locale,title,description) join public.courses c on c.slug=v.slug on conflict(course_id,locale) do nothing;
insert into public.books(id,slug,author,category,price_minor,currency,is_published) values
 ('20000000-0000-4000-8000-000000000001','growing-together','Samen Learning','family-guide',0,'EUR',true),
 ('20000000-0000-4000-8000-000000000002','little-language','M. van Dijk','ebook',800,'EUR',true),
 ('20000000-0000-4000-8000-000000000003','curious-home','A. Hassan','activity-book',1200,'EUR',true)
on conflict(slug) do nothing;
insert into public.book_translations(book_id,locale,title,description)
select b.id,v.locale,v.title,v.description from (values
 ('growing-together','en','Growing Together','A friendly guide to learning as a family.'),('growing-together','nl','Samen groeien','Een warme gids om als gezin te leren.'),('growing-together','ar','ننمو معًا','دليل عائلي للتعلم معًا.'),
 ('little-language','en','Little Words, Big Worlds','Everyday language activities for curious learners.'),('little-language','nl','Kleine woorden, grote werelden','Taalactiviteiten voor nieuwsgierige cursisten.'),('little-language','ar','كلمات صغيرة وعوالم كبيرة','أنشطة لغوية يومية للمتعلمين الفضوليين.'),
 ('curious-home','en','The Curious Home','Simple activities to explore, talk and learn together.'),('curious-home','nl','Het nieuwsgierige huis','Eenvoudige activiteiten om samen te ontdekken en leren.'),('curious-home','ar','البيت الفضولي','أنشطة بسيطة للاستكشاف والتعلم معًا.')
) as v(slug,locale,title,description) join public.books b on b.slug=v.slug on conflict(book_id,locale) do nothing;
