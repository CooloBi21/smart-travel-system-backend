CREATE TABLE IF NOT EXISTS public.platform_settings (
    id SMALLINT PRIMARY KEY,
    platform_name VARCHAR(150) NOT NULL,
    platform_description TEXT NOT NULL,
    support_email VARCHAR(255) NOT NULL,
    default_language VARCHAR(20) NOT NULL DEFAULT 'vi-VN',
    default_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    allow_customer_registration BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT platform_settings_singleton_id
        CHECK (id = 1),

    CONSTRAINT platform_settings_currency_check
        CHECK (default_currency ~ '^[A-Z]{3}$'),

    CONSTRAINT platform_settings_language_check
        CHECK (default_language <> '')
);

INSERT INTO public.platform_settings (
    id,
    platform_name,
    platform_description,
    support_email,
    default_language,
    default_currency,
    maintenance_mode,
    allow_customer_registration
)
VALUES (
    1,
    'Smart Travel System',
    'Nền tảng tư vấn du lịch thông minh kết hợp gợi ý tour cá nhân hóa và phân tích dữ liệu khách hàng.',
    'support@smarttravel.local',
    'vi-VN',
    'VND',
    FALSE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;
