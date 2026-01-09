-- Delete existing admin role for tefan7410@gmail.com
DELETE FROM public.user_roles 
WHERE user_id = '8d50defc-ba63-4e6d-a257-cb8eba6ed93e' 
AND role = 'admin';

-- Assign owner role to tefan7410@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('8d50defc-ba63-4e6d-a257-cb8eba6ed93e', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;