-- Assign admin role to manipurdigital2025 user
INSERT INTO public.user_roles (user_id, role)
VALUES ('891775a3-b58d-452d-8133-3f634b4beef1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;