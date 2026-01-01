-- Recreate missing profile for bajuzkinfts@gmail.com
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, split_part(email, '@', 1)
FROM auth.users
WHERE email = 'bajuzkinfts@gmail.com'
ON CONFLICT (id) DO NOTHING;