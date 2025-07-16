-- Update videos with non-working sample-videos.com URLs to use reliable Google Cloud Storage demo videos

-- Use Blender demo videos from Google Cloud Storage (these are reliable and high quality)
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' WHERE title = 'Amélie';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' WHERE title = 'Casablanca';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' WHERE title = 'Crown of Thorns';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' WHERE title = 'Culinary Kingdoms';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' WHERE title = 'Dragon Realms';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' WHERE title = 'Future Heroes';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' WHERE title = 'Love in Tokyo';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' WHERE title = 'Neon Dreams';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' WHERE title = 'Ocean Mysteries';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' WHERE title = 'Parasite';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4' WHERE title = 'Quantum Heist';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' WHERE title = 'Tech Titans';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4' WHERE title = 'The Great Escape';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' WHERE title = 'The Last Innovators';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' WHERE title = 'The Last Kingdom';
UPDATE videos SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' WHERE title = 'The Silent Forest';