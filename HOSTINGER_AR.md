# نشر المشروع على Hostinger

هذا المشروع مبني بـNext.js، لذلك يحتاج استضافة تشغّل تطبيقات Node.js. باقات Hostinger التي تدعم Node.js Web Apps تشمل Business وCloud؛ أما استضافة PHP التقليدية وحدها فلا تكفي. الـVPS خيار آخر لكنه يحتاج إعدادًا يدويًا.

## قبل الرفع

1. ثبّت Node.js 22 على جهازك.
2. انسخ `.env.example` إلى `.env.local` وأدخل بيانات Supabase محليًا عند توفرها.
3. لا ترفع `.env.local` أو أي مفاتيح سرية إلى GitHub. ملف `.gitignore` يستثني ملفات البيئة تلقائيًا، و`.env.example` مجرد نموذج فارغ.
4. ارفع المشروع إلى مستودع GitHub خاص أو عام. لا ترفع مجلدات `node_modules` أو `.next`.

من PowerShell داخل مجلد المشروع، إذا لم يكن Git مهيأً بعد:

```powershell
git init -b main
git add .
git status
git commit -m "Prepare project for deployment"
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

استبدل `USERNAME/REPOSITORY` بعنوان المستودع الذي أنشأته في GitHub. راجع ناتج `git status` وتأكد أن الملفات السرية غير موجودة قبل تنفيذ `git commit`.

## نشره على استضافة Node.js في Hostinger

1. من لوحة Hostinger اختر إضافة موقع من نوع **Node.js Web App**.
2. اربط حساب GitHub واختر المستودع والفرع `main`.
3. اختر Node.js 22 وإطار Next.js إذا لم يكتشفهما Hostinger تلقائيًا.
4. استخدم أوامر المشروع:

   - تثبيت الحزم: `npm ci`
   - البناء: `npm run build`
   - التشغيل: `npm run start`

5. أضف متغيرات البيئة من إعدادات التطبيق في Hostinger، ثم أعد النشر:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — رابط الموقع النهائي مع `https://`
   - `SUPABASE_SERVICE_ROLE_KEY` — على الخادم فقط عند تفعيل webhooks والمدفوعات.
   - مفاتيح Stripe أو Mollie — اختيارية، وتضاف من إعدادات Hostinger فقط عند إعداد الدفع.

6. اربط النطاق وفعّل HTTPS، ثم افتح الموقع وجرب `/ar` و`/en` وتسجيل الدخول والصفحات المطلوبة.

عند ربط GitHub، يمكن ضبط Hostinger لإعادة النشر بعد تحديث الفرع المرتبط. يوجد أيضًا فحص GitHub Actions في `.github/workflows/ci.yml` يشغّل فحص الأنواع وESLint وبناء الإنتاج عند التحديث أو فتح طلب دمج.

## إعداد Supabase بعد النشر

نفّذ migrations الموجودة في `supabase/migrations` على مشروع Supabase الخاص بك، واضبط عناوين إعادة التوجيه في Auth لتشمل نطاق الموقع المنشور. حدّث `NEXT_PUBLIC_SITE_URL` إلى النطاق النهائي. لا تضع مفتاح `service_role` في متغير يبدأ بـ`NEXT_PUBLIC_` ولا تحفظه في GitHub.

## ملاحظات مهمة

- لا تُفعّل الدفع قبل إضافة مفاتيح الإنتاج الصحيحة وضبط webhook URLs لدى مزود الدفع واختبارها.
- وظائف الموقع التي تعتمد على Supabase أو البريد أو الدفع لن تعمل فعليًا حتى تُضبط بيانات تلك الخدمات.
- إذا كانت باقتك VPS، استخدم إعداد Node.js وPM2 وHTTPS المناسب لنظام التشغيل؛ خطوات Web App أعلاه مخصصة للاستضافة المُدارة.
